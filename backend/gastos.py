from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from utils import admin_required, register_log # 🛡️ Import the log utility
from db import get_db # 🟢 Importamos el nuevo gestor de DB
from psycopg2.extras import DictCursor # 🟢 Para obtener resultados como diccionarios
import datetime

gastos_bp = Blueprint("gastos_bp", __name__, url_prefix="/gastos")

@gastos_bp.route("/", methods=["GET"])
@admin_required
def get_gastos():
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # Allows filtering by month and year, e.g., /gastos?month=10&year=2023
            month = request.args.get('month', type=int)
            year = request.args.get('year', type=int)

            # 💡 SAAS-IFICATION: Filter expenses by the logged-in user's tenant_id.
            query = "SELECT * FROM gastos WHERE tenant_id = %s"
            params = [tenant_id]
            
            if month and year:
                query += " AND EXTRACT(MONTH FROM fecha) = %s AND EXTRACT(YEAR FROM fecha) = %s"
                params.extend([month, year])
            
            query += " ORDER BY fecha DESC"
            
            cursor.execute(query, tuple(params))
            expenses_raw = cursor.fetchall()
            # FIX: Convert to dict to ensure JSON serialization and that the table is displayed.
            expenses = [dict(g) for g in expenses_raw]
            # Convert date objects to string for JSON serialization
            for expense in expenses:
                if isinstance(expense.get('fecha'), datetime.date):
                    expense['fecha'] = expense['fecha'].isoformat()
            return jsonify(expenses)
    except Exception as e:
        current_app.logger.error(f"Error en get_gastos: {e}")
        return jsonify({"error": "Error al obtener los gastos"}), 500

@gastos_bp.route("/", methods=["POST"])
@admin_required
def create_gasto():
    data = request.get_json()
    description = data.get("descripcion")
    amount = data.get("monto")
    date = data.get("fecha")
    tenant_id = current_user.tenant_id
    category = data.get("categoria", "Varios")

    if not description or not amount or not date:
        return jsonify({"error": "La descripción, monto y fecha son obligatorios"}), 400

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # 💡 SAAS-IFICATION: Insert the tenant_id when creating a new expense.
            cursor.execute("""
                INSERT INTO gastos (descripcion, monto, categoria, fecha, tenant_id)
                VALUES (%s, %s, %s, %s, %s)
            """, (description, amount, category, date, tenant_id))
            conn.commit()
            register_log(f"Registró un nuevo gasto: {description} por ${amount}")
            return jsonify({"message": "Gasto registrado exitosamente"}), 201
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en create_gasto: {e}")
        return jsonify({"error": "Error al registrar el gasto"}), 500

@gastos_bp.route("/<int:id>", methods=["PUT"])
@admin_required
def update_gasto(id):
    tenant_id = current_user.tenant_id
    data = request.get_json()
    description = data.get("descripcion")
    amount = data.get("monto")
    date = data.get("fecha")
    category = data.get("categoria")

    if not all([description, amount, date, category]):
        return jsonify({"error": "La descripción, monto, fecha y categoría son obligatorios"}), 400

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE gastos 
                SET descripcion=%s, monto=%s, categoria=%s, fecha=%s
                WHERE id_gasto=%s AND tenant_id=%s
            """, (description, amount, category, date, id, tenant_id))
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Gasto no encontrado o no pertenece a su organización"}), 404

            conn.commit()
            register_log(f"Actualizó gasto ID {id}: {description}")
            return jsonify({"message": "Gasto actualizado exitosamente"})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en update_gasto: {e}")
        return jsonify({"error": "Error al actualizar el gasto"}), 500

@gastos_bp.route("/<int:id>", methods=["DELETE"])
@admin_required
def delete_gasto(id):
    tenant_id = current_user.tenant_id
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # 💡 SAAS-IFICATION: Ensure only an expense from the correct tenant can be deleted.
            cursor.execute("DELETE FROM gastos WHERE id_gasto=%s AND tenant_id = %s", (id, tenant_id))
            
            if cursor.rowcount == 0:
                return jsonify({"error": "Gasto no encontrado o no pertenece a su organización"}), 404

            conn.commit()
            register_log(f"Eliminó gasto ID {id}")
            return jsonify({"message": "Gasto eliminado exitosamente"})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en delete_gasto: {e}")
        return jsonify({"error": "Error al eliminar el gasto"}), 500