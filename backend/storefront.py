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
            sections_raw = cursor.fetchall()
            
            # Convert raw data to a list of dicts for JSON serialization
            sections = []
            for row in sections_raw:
                section = dict(row)
                # Ensure datetime objects are JSON serializable
                if isinstance(section.get('created_at'), datetime.datetime):
                    section['created_at'] = section['created_at'].isoformat()
                if isinstance(section.get('updated_at'), datetime.datetime):
                    section['updated_at'] = section['updated_at'].isoformat()
                sections.append(section)

            return jsonify(sections)
    except Exception as e:
        current_app.logger.error(f"Error fetching storefront sections for tenant {tenant_id}: {e}")
        return jsonify({"error": "Failed to load storefront configuration"}), 500