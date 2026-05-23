from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user
from utils import admin_required
from db import get_db
from psycopg2.extras import DictCursor
from psycopg2 import errors, sql
import datetime
import json

storefront_bp = Blueprint("storefront_bp", __name__)

# Endpoint for the admin panel to manage sections
@storefront_bp.route("/sections", methods=["GET"])
@admin_required
def get_storefront_sections():
    """
    Fetches all storefront sections for the current tenant,
    ordered by their display order.
    """
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM storefront_sections WHERE tenant_id = %s ORDER BY display_order ASC",
                (tenant_id,)
            )
            rows = cursor.fetchall()
            
            # Convert rows to a list of dictionaries and handle non-serializable types
            sections = []
            for row in rows:
                section = dict(row)
                # Convert datetime objects to ISO 8601 strings for JSON compatibility.
                # The check for `isinstance` is a good practice for robustness.
                if section.get('created_at') and isinstance(section.get('created_at'), datetime.datetime):
                    section['created_at'] = section['created_at'].isoformat()
                if section.get('updated_at') and isinstance(section.get('updated_at'), datetime.datetime):
                    section['updated_at'] = section['updated_at'].isoformat()
                sections.append(section)

            return jsonify(sections)
    except errors.UndefinedTable:
        # This can happen if the database migration for this feature has not been run.
        # Instead of crashing with a 500 error, we log a warning and return an empty list,
        # which is a valid state for the frontend (meaning "no sections configured yet").
        current_app.logger.warning(
            f"The 'storefront_sections' table was not found for tenant {tenant_id}. "
            "This is expected if the database schema has not been updated. Returning an empty list."
        )
        return jsonify([])
    except Exception as e:
        # Log the detailed error for debugging on the server
        current_app.logger.error(f"Error fetching storefront sections for tenant {tenant_id}: {e}")
        # Return a generic error to the client
        return jsonify({"error": "An internal error occurred while loading the storefront configuration."}), 500

@storefront_bp.route("/sections", methods=["POST"])
@admin_required
def create_storefront_section():
    """
    Creates a new storefront section for the current tenant.
    It automatically assigns the next available display_order.
    """
    data = request.get_json()
    section_type = data.get("section_type")
    if not section_type:
        return jsonify({"error": "section_type is required"}), 400

    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # Determine the next display_order
            cursor.execute(
                "SELECT COALESCE(MAX(display_order), -1) as max_order FROM storefront_sections WHERE tenant_id = %s",
                (tenant_id,)
            )
            new_order = cursor.fetchone()['max_order'] + 1

            # Insert the new section with default empty content and make it visible
            cursor.execute(
                """
                INSERT INTO storefront_sections (tenant_id, section_type, display_order, content, is_visible)
                VALUES (%s, %s, %s, '{}'::jsonb, TRUE)
                RETURNING *
                """,
                (tenant_id, section_type, new_order)
            )
            new_section_raw = cursor.fetchone()
            conn.commit()

            # Convert to dict and serialize datetime objects before returning
            new_section = dict(new_section_raw)
            if new_section.get('created_at') and isinstance(new_section.get('created_at'), datetime.datetime):
                new_section['created_at'] = new_section['created_at'].isoformat()
            if new_section.get('updated_at') and isinstance(new_section.get('updated_at'), datetime.datetime):
                new_section['updated_at'] = new_section['updated_at'].isoformat()

            return jsonify(new_section), 201

    except errors.UndefinedTable:
        conn.rollback()
        current_app.logger.error(
            f"CRITICAL: Attempt to create a storefront section failed because 'storefront_sections' table does not exist. Tenant ID: {tenant_id}. "
            "The database schema is out of date. Please run the necessary migrations."
        )
        # Return 503 Service Unavailable, as the service is not ready to handle this request
        return jsonify({"error": "Feature not available: Database is not up to date."}), 503
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error creating storefront section for tenant {tenant_id}: {e}")
        return jsonify({"error": "An internal error occurred while creating the section."}), 500

@storefront_bp.route("/sections/<int:section_id>", methods=["DELETE"])
@admin_required
def delete_storefront_section(section_id):
    """
    Deletes a specific storefront section for the current tenant.
    """
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # The WHERE clause ensures a tenant can only delete their own sections.
            cursor.execute(
                "DELETE FROM storefront_sections WHERE id = %s AND tenant_id = %s",
                (section_id, tenant_id)
            )
            
            # Check if a row was actually deleted
            if cursor.rowcount == 0:
                return jsonify({"error": "Section not found or you do not have permission to delete it."}), 404

            conn.commit()
            return jsonify({"message": "Section deleted successfully"}), 200

    except errors.UndefinedTable:
        conn.rollback()
        current_app.logger.error(
            f"CRITICAL: Attempt to delete a storefront section failed because 'storefront_sections' table does not exist. Tenant ID: {tenant_id}. "
            "The database schema is out of date. Please run the necessary migrations."
        )
        # Return 503 Service Unavailable, as the service is not ready to handle this request
        return jsonify({"error": "Feature not available: Database is not up to date."}), 503
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error deleting storefront section {section_id} for tenant {tenant_id}: {e}")
        return jsonify({"error": "An internal error occurred while deleting the section."}), 500

@storefront_bp.route("/sections/reorder", methods=["PUT"])
@admin_required
def reorder_storefront_sections():
    """
    Updates the display_order of sections based on a provided list of IDs.
    """
    data = request.get_json()
    ordered_ids = data.get("ordered_ids")
    if not ordered_ids or not isinstance(ordered_ids, list):
        return jsonify({"error": "ordered_ids must be a list of section IDs"}), 400

    if not ordered_ids:
        return jsonify({"message": "No sections to reorder"}), 200

    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # Validate that all IDs are integers to prevent injection.
            try:
                sanitized_ids = [int(sid) for sid in ordered_ids]
            except (ValueError, TypeError):
                return jsonify({"error": "All IDs in ordered_ids must be integers"}), 400

            # Build the CASE statement safely using psycopg2.sql to prevent SQL injection.
            when_clauses = []
            for index, section_id in enumerate(sanitized_ids):
                when_clauses.append(
                    sql.SQL("WHEN {} THEN {}").format(
                        sql.Literal(section_id),
                        sql.Literal(index)
                    )
                )
            
            case_expression = sql.SQL("CASE id {} END").format(sql.SQL(" ").join(when_clauses))
            
            # Build the final, safe query.
            query = sql.SQL("""
                UPDATE storefront_sections
                SET display_order = {case_expr}
                WHERE id = ANY(%s) AND tenant_id = %s
            """).format(case_expr=case_expression)

            cursor.execute(query, (sanitized_ids, tenant_id))
            conn.commit()

        return jsonify({"message": "Sections reordered successfully"}), 200
    except errors.UndefinedTable:
        conn.rollback()
        current_app.logger.error(
            f"CRITICAL: Attempt to reorder storefront sections failed because 'storefront_sections' table does not exist. Tenant ID: {tenant_id}. "
            "The database schema is out of date. Please run the necessary migrations."
        )
        # Return 503 Service Unavailable, as the service is not ready to handle this request
        return jsonify({"error": "Feature not available: Database is not up to date."}), 503
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error reordering storefront sections for tenant {tenant_id}: {e}")
        return jsonify({"error": "An internal error occurred while reordering sections."}), 500

@storefront_bp.route("/sections/<int:section_id>", methods=["PUT"])
@admin_required
def update_storefront_section(section_id):
    """
    Updates a specific storefront section (e.g., its content or visibility).
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided for update"}), 400

    tenant_id = current_user.tenant_id
    conn = get_db()

    # Define allowed fields to update
    allowed_fields = ['content', 'is_visible']
    
    set_clauses = []
    values = []

    for field in allowed_fields:
        if field in data:
            set_clauses.append(sql.SQL("{} = %s").format(sql.Identifier(field)))
            values.append(data[field] if field != 'content' else json.dumps(data[field]))

    if not set_clauses:
        return jsonify({"error": "No valid fields to update"}), 400

    values.extend([section_id, tenant_id])

    try:
        with conn.cursor() as cursor:
            query = sql.SQL("UPDATE storefront_sections SET {} WHERE id = %s AND tenant_id = %s").format(sql.SQL(', ').join(set_clauses))
            cursor.execute(query, tuple(values))
            conn.commit()
            return jsonify({"message": "Section updated successfully"}), 200
    except errors.UndefinedTable:
        conn.rollback()
        current_app.logger.error(
            f"CRITICAL: Attempt to update a storefront section failed because 'storefront_sections' table does not exist. Tenant ID: {tenant_id}. "
            "The database schema is out of date. Please run the necessary migrations."
        )
        # Return 503 Service Unavailable, as the service is not ready to handle this request
        return jsonify({"error": "Feature not available: Database is not up to date."}), 503
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error updating storefront section {section_id} for tenant {tenant_id}: {e}")
        return jsonify({"error": "An internal error occurred while updating the section."}), 500