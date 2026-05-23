from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from db import get_db
from psycopg2.extras import DictCursor
from utils import admin_required, register_log
import logging

logger = logging.getLogger(__name__)

settings_bp = Blueprint("settings", __name__, url_prefix="/settings")

# ========================================
# GET TENANT SETTINGS (for Admin Panel)
# ========================================
@settings_bp.route("/", methods=["GET"])
@admin_required
def get_tenant_settings():
    """Fetches the settings for the currently logged-in tenant administrator."""
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            cursor.execute("SELECT * FROM tenant_settings WHERE tenant_id = %s", (tenant_id,))
            settings = cursor.fetchone()
            if not settings:
                # If no settings exist, create a default entry and return it
                cursor.execute(
                    "INSERT INTO tenant_settings (tenant_id) VALUES (%s) RETURNING *",
                    (tenant_id,)
                )
                settings = cursor.fetchone()
                conn.commit()
                register_log(f"Initialized default settings for tenant_id {tenant_id}")
            
            return jsonify(dict(settings))
    except Exception as e:
        logger.error(f"Error in get_tenant_settings: {e}", exc_info=True)
        return jsonify({"error": "Error fetching settings"}), 500

# ========================================
# UPDATE TENANT SETTINGS (for Admin Panel)
# ========================================
@settings_bp.route("/", methods=["PUT"])
@admin_required
def update_tenant_settings():
    """Updates the settings for the currently logged-in tenant administrator."""
    tenant_id = current_user.tenant_id
    data = request.get_json()
    conn = get_db()
    
    # Fields that are allowed to be updated
    allowed_fields = [
        'logo_url', 'hero_image_url', 'brand_color_primary', 'brand_color_secondary',
        'welcome_title', 'welcome_subtitle', 'social_instagram_url', 
        'social_whatsapp_number', 'subdomain'
    ]
    
    # Build the dynamic query
    set_clauses = []
    values = []
    for field in allowed_fields:
        if field in data:
            set_clauses.append(f"{field} = %s")
            values.append(data[field])

    if not set_clauses:
        return jsonify({"error": "No valid fields provided for update"}), 400

    values.append(tenant_id)
    
    try:
        with conn.cursor() as cursor:
            query = f"UPDATE tenant_settings SET {', '.join(set_clauses)} WHERE tenant_id = %s"
            cursor.execute(query, tuple(values))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Settings not found for this tenant"}), 404

            register_log(f"Updated settings for tenant_id {tenant_id}")
            return jsonify({"message": "Settings updated successfully"})
    except Exception as e:
        conn.rollback()
        # Handle unique constraint violation for subdomain
        if "tenant_settings_subdomain_key" in str(e):
            return jsonify({"error": "This subdomain is already in use by another store."}), 409
        logger.error(f"Error in update_tenant_settings: {e}", exc_info=True)
        return jsonify({"error": "Internal server error while updating settings"}), 500

# ========================================
# GET PUBLIC STOREFRONT DATA (for Landing Page)
# ========================================
@settings_bp.route("/public/storefront/<subdomain>", methods=["GET"])
def get_public_storefront_data(subdomain):
    """
    Public endpoint to fetch all necessary data for a storefront based on its subdomain.
    """
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 1. Get tenant settings
            cursor.execute("SELECT * FROM tenant_settings WHERE subdomain = %s", (subdomain,))
            settings = cursor.fetchone()
            if not settings:
                return jsonify({"error": "Store not found"}), 404
            
            # 2. Get public products for that tenant
            cursor.execute("SELECT id_producto, nombre, descripcion, precio, imagen, categoria FROM productos WHERE tenant_id = %s", (settings['tenant_id'],))
            products = [dict(p) for p in cursor.fetchall()]

            return jsonify({"settings": dict(settings), "products": products})
    except Exception as e:
        logger.error(f"Error in get_public_storefront_data: {e}", exc_info=True)
        return jsonify({"error": "Could not retrieve store data"}), 500