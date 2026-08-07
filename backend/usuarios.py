from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from db import get_db # 🟢 Importamos el nuevo gestor de DB
from psycopg2.extras import DictCursor # 🟢 Para obtener resultados como diccionarios
from utils import admin_required, register_log
import secrets
import string

users_bp = Blueprint("users_bp", __name__, url_prefix="/usuarios")

# ============================================================
# ALL ROUTES BELOW REQUIRE 'admin' ROLE 🛡️
# ============================================================

@users_bp.route("/", methods=["GET"])
@admin_required
def get_usuarios():
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 💡 SAAS-IFICATION: An admin (or superadmin) can only see users from their own tenant.
            # This prevents a superadmin from seeing private data from other organizations.
            cursor.execute(
                "SELECT id_usuario, nombre, email, telefono, direccion, rol FROM usuarios WHERE tenant_id = %s", 
                (current_user.tenant_id,)
            )
            rows_raw = cursor.fetchall()
            # FIX: Explicitly convert to a list of dictionaries to ensure JSON serialization.
            rows = [dict(row) for row in rows_raw]
            return jsonify(rows)
    except Exception as e:
        current_app.logger.error(f"Error en get_usuarios: {e}")
        return jsonify({"error": "Error al obtener usuarios"}), 500

@users_bp.route("/<int:id>", methods=["GET"])
@admin_required
def get_usuario(id):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 💡 SAAS-IFICATION: An admin can only view a user from their own tenant.
            cursor.execute(
                "SELECT id_usuario, nombre, email, telefono, direccion, rol FROM usuarios WHERE id_usuario = %s AND tenant_id = %s", 
                (id, current_user.tenant_id)
            )
            row_raw = cursor.fetchone()
            if row_raw:
                # FIX: Convert to dict to ensure serialization.
                return jsonify(dict(row_raw))
            return jsonify({"error": "Usuario no encontrado"}), 404
    except Exception as e:
        current_app.logger.error(f"Error en get_usuario: {e}")
        return jsonify({"error": "Error al obtener usuario"}), 500

@users_bp.route("/", methods=["POST"])
@admin_required
def add_usuario():
    data = request.json
    name    = data.get("nombre")
    email     = data.get("email")
    password  = data.get("password")
    phone  = data.get("telefono")
    address = data.get("direccion")
    role       = data.get("rol", "cliente")

    if not name or not email:
        return jsonify({"error": "Nombre y correo son obligatorios"}), 400

    temporary_password = None
    if not password:
        # Generate a temporary password if one is not provided.
        alphabet = string.ascii_letters + string.digits
        temporary_password = ''.join(secrets.choice(alphabet) for i in range(10))
        password = temporary_password

    hashed_pw = generate_password_hash(password)
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 💡 SAAS-IFICATION: A new user created by an admin belongs to the same tenant.
            cursor.execute("""
                INSERT INTO usuarios (nombre, email, password, telefono, direccion, rol, tenant_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id_usuario, email, nombre
            """, (name, email, hashed_pw, phone, address, role, current_user.tenant_id))
            new_user = cursor.fetchone()
            conn.commit()

            response_data = {
                "message": "Usuario agregado exitosamente",
                "id_usuario": new_user['id_usuario'],
                "email": new_user['email'],
                "nombre": new_user['nombre']
            }
            if temporary_password:
                response_data["temporary_password"] = temporary_password
            
            register_log(f"Admin created new user: {email}")
            return jsonify(response_data), 201
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en add_usuario: {e}", exc_info=True)
        return jsonify({"error": "El correo podría estar ya registrado"}), 400

@users_bp.route("/<int:id>", methods=["PUT"])
@admin_required
def update_usuario(id):
    data      = request.json
    name    = data.get("nombre")
    email     = data.get("email")
    phone  = data.get("telefono")
    address = data.get("direccion")
    role       = data.get("rol")
    password  = data.get("password")

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            if password:
                hashed_pw = generate_password_hash(password)
                cursor.execute("""
                    UPDATE usuarios
                    SET nombre=%s, email=%s, telefono=%s, direccion=%s, rol=%s, password=%s
                    WHERE id_usuario=%s AND tenant_id = %s
                """, (name, email, phone, address, role, hashed_pw, id, current_user.tenant_id))
            else:
                cursor.execute("""
                    UPDATE usuarios
                    SET nombre=%s, email=%s, telefono=%s, direccion=%s, rol=%s
                    WHERE id_usuario=%s AND tenant_id = %s
                """, (name, email, phone, address, role, id, current_user.tenant_id))
            conn.commit()
            return jsonify({"message": "Usuario actualizado exitosamente"})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en update_usuario: {e}", exc_info=True)
        return jsonify({"error": "Error al actualizar usuario"}), 500

@users_bp.route("/<int:id>", methods=["DELETE"])
@admin_required
def delete_usuario(id):
    # 🛡️ Protection: Prevent an admin from deleting themselves.
    if current_user.id == id:
        return jsonify({"error": "No puedes eliminar tu propia cuenta de administrador"}), 403

    conn = get_db()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM usuarios WHERE id_usuario=%s AND tenant_id = %s", (id, current_user.tenant_id))
            conn.commit()
            return jsonify({"message": "Usuario eliminado"})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en delete_usuario: {e}", exc_info=True)
        return jsonify({"error": "Error al eliminar usuario"}), 500