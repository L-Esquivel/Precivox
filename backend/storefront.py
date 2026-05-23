from flask import Blueprint, jsonify, request, current_app
from flask_login import current_user
from utils import admin_required
from db import get_db
from psycopg2.extras import DictCursor
import datetime

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
    except Exception as e:
        # Log the detailed error for debugging on the server
        current_app.logger.error(f"Error fetching storefront sections for tenant {tenant_id}: {e}")
        # Return a generic error to the client
        return jsonify({"error": "An internal error occurred while loading the storefront configuration."}), 500