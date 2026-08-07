from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from utils import admin_required, register_log # 🛡️ Import the log utility
from db import get_db # 🟢 Import the new DB manager
from psycopg2.extras import DictCursor # 🟢 To get results as dictionaries
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

ingredientes_bp = Blueprint("ingredientes", __name__, url_prefix="/ingredientes")

@ingredientes_bp.route("/", methods=["GET"])
@login_required
def get_ingredientes():
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 💡 SAAS-IFICATION: Filter by tenant_id.
            # FIX: Use COALESCE to avoid null values on the frontend (which cause $0 prices or missing data)
            # and select columns explicitly for clarity.
            cursor.execute("""
                SELECT 
                    id_ingrediente, nombre, unidad_medida, 
                    COALESCE(stock, 0) as stock, 
                    COALESCE(costo_por_unidad, 0) as costo_por_unidad 
                FROM ingredientes WHERE tenant_id = %s ORDER BY nombre
            """, (tenant_id,))
            ingredientes_raw = cursor.fetchall()
            # FIX: Convert to a list of dictionaries for correct JSON serialization.
            ingredientes = [dict(row) for row in ingredientes_raw]
            return jsonify(ingredientes)
    except Exception as e:
        logger.error(f"Error en get_ingredientes: {e}", exc_info=True)
        return jsonify({"error": "Error al obtener los ingredientes"}), 500

@ingredientes_bp.route("/", methods=["POST"])
@admin_required
def create_ingrediente():
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        data = request.get_json() or {}
        nombre = data.get("nombre")
        # 💡 FIX: Accept 'unidad_medida' or 'unidad' from the frontend.
        # This fixes a 400 error when the frontend sends 'unidad' instead of
        # the database column name ('unidad_medida').
        unidad_medida = data.get("unidad_medida") or data.get("unidad")
        stock = data.get("stock", 0)
        costo_por_unidad = data.get("costo_por_unidad", 0)

        if not nombre or not unidad_medida:
            return jsonify({"error": "El nombre y la unidad de medida son obligatorios"}), 400

        with conn.cursor() as cursor:
            # 💡 SAAS-IFICATION: Insert the tenant_id.
            cursor.execute("""
                INSERT INTO ingredientes (nombre, unidad_medida, stock, costo_por_unidad, tenant_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (nombre, unidad_medida, float(stock), float(costo_por_unidad), tenant_id))
            conn.commit()

        # 🛡️ AUDIT: Creation log
        register_log(f"Creó nuevo ingrediente: {nombre}")
        
        return jsonify({"message": "Ingrediente creado exitosamente"}), 201
    except Exception as e:
        conn.rollback()
        logger.error(f"Error en create_ingrediente: {e}", exc_info=True)
        return jsonify({"error": "Error al crear el ingrediente"}), 500

@ingredientes_bp.route("/<int:id>", methods=["PUT"])
@admin_required
def update_ingrediente(id):
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        data = request.get_json() or {}
        nombre = data.get("nombre")
        # 💡 FIX: Accept 'unidad_medida' or 'unidad' for consistency.
        unidad_medida = data.get("unidad_medida") or data.get("unidad")
        stock = data.get("stock")
        costo_por_unidad = data.get("costo_por_unidad")

        with conn.cursor() as cursor:
            # 💡 SAAS-IFICATION: Ensure only an ingredient from the correct tenant can be updated.
            cursor.execute("""
                UPDATE ingredientes
                SET nombre=%s, unidad_medida=%s, stock=%s, costo_por_unidad=%s
                WHERE id_ingrediente=%s AND tenant_id = %s
            """, (nombre, unidad_medida, float(stock or 0), float(costo_por_unidad or 0), id, tenant_id))
            conn.commit()

        # 🛡️ AUDIT: Update log
        register_log(f"Actualizó ingrediente ID {id}: {nombre}")

        return jsonify({"message": "Ingrediente actualizado exitosamente"})
    except Exception as e:
        conn.rollback()
        logger.error(f"Error en update_ingrediente: {e}", exc_info=True)
        return jsonify({"error": "Error al actualizar el ingrediente"}), 500

@ingredientes_bp.route("/<int:id>", methods=["DELETE"])
@admin_required
def delete_ingrediente(id):
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # VERIFICATION: Is this ingredient in use by any recipe?
            cursor.execute("SELECT COUNT(*) as total FROM recetas_ingredientes WHERE id_ingrediente = %s AND tenant_id = %s", (id, tenant_id))
            if cursor.fetchone()['total'] > 0:
                return jsonify({"error": "No se puede eliminar: el ingrediente está en uso en una o más recetas."}), 400

            # 💡 SAAS-IFICATION: Ensure only an ingredient from the correct tenant can be deleted.
            cursor.execute("DELETE FROM ingredientes WHERE id_ingrediente = %s AND tenant_id = %s", (id, tenant_id))
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Ingrediente no encontrado o no pertenece a su organización"}), 404

            conn.commit()

        # 🛡️ AUDIT: Deletion log
        register_log(f"Eliminó ingrediente ID {id}")

        return jsonify({"message": "Eliminado exitosamente"})
    except Exception as e:
        conn.rollback()
        logger.error(f"Error en delete_ingrediente: {e}", exc_info=True)
        return jsonify({"error": "Error al eliminar el ingrediente"}), 500