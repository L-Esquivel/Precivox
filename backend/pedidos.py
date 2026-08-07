from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from utils import admin_required, register_log # 🛡️ Import the audit log utility
from db import get_db # 🟢 Import the new DB manager
from psycopg2.extras import DictCursor # 🟢 To get results as dictionaries
import logging, datetime

logger = logging.getLogger(__name__)

pedidos_bp = Blueprint("pedidos", __name__, url_prefix="/pedidos")

# ==================== LÓGICA DE STOCK ====================
# ==================== STOCK LOGIC ====================

def process_stock_deduction(cursor, order_id, tenant_id):
    """Deducts units from inventory based on the order details."""
    try:
        # This function is called from another that already handles commit/rollback,
        # so we don't commit here to maintain atomicity.
        cursor.execute("SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = %s AND tenant_id = %s", (order_id, tenant_id))
        items = cursor.fetchall()
        for item in items:
            producto_id = item['producto_id']
            cantidad_vendida = float(item['cantidad'])

            # 1. Deduct Product Stock (if applies)
            cursor.execute("""
                UPDATE productos SET stock = stock - %s 
                WHERE id_producto = %s AND controla_stock = TRUE AND tenant_id = %s
            """, (cantidad_vendida, producto_id, tenant_id))

            # 2. Deduct Ingredients based on Recipe
            cursor.execute("SELECT id_ingrediente, cantidad_necesaria FROM recetas_ingredientes WHERE id_producto = %s AND tenant_id = %s", (producto_id, tenant_id))
            ingredientes_receta = cursor.fetchall()
            for ing in ingredientes_receta:
                cantidad_a_deducir = float(ing['cantidad_necesaria']) * cantidad_vendida
                cursor.execute("""
                    UPDATE ingredientes SET cantidad = cantidad - %s 
                    WHERE id_ingrediente = %s AND tenant_id = %s
                """, (cantidad_a_deducir, ing['id_ingrediente'], tenant_id))

            # 3. Deduct Packaging based on Recipe
            cursor.execute("SELECT id_empaque, cantidad FROM recetas_empaques WHERE id_producto = %s AND tenant_id = %s", (producto_id, tenant_id))
            empaques_receta = cursor.fetchall()
            for emp in empaques_receta:
                cantidad_a_deducir = float(emp['cantidad']) * cantidad_vendida
                cursor.execute("""
                    UPDATE empaques SET cantidad = cantidad - %s 
                    WHERE id_empaque = %s AND tenant_id = %s
                """, (cantidad_a_deducir, emp['id_empaque'], tenant_id))

    except Exception as e:
        logger.error(f"Error deducting stock: {e}")
        # Propagate the exception so the calling function can perform a rollback.
        raise

# ==================== STATS (Dashboard) ====================

@pedidos_bp.route("/stats", methods=["GET"])
@admin_required
def get_estadisticas_dashboard():
    tenant_id = current_user.tenant_id
    conn = get_db()
    cursor = conn.cursor(cursor_factory=DictCursor)
    try:
        # 1. Obtener y validar rango de fechas (default: últimos 30 días)
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=29)

        start_date_str = request.args.get('fecha_inicio', start_date.strftime('%Y-%m-%d'))
        end_date_str = request.args.get('fecha_fin', end_date.strftime('%Y-%m-%d'))
        params_with_tenant = (tenant_id, start_date_str, end_date_str)

        # 2. Financial summary for the date range
        # 💡 SAAS-IFICATION: All queries now filter by tenant_id.
        where_pedidos = " WHERE tenant_id = %s AND estado != 'cancelado' AND DATE(fecha_pedido) BETWEEN %s AND %s "
        cursor.execute(f"""
            SELECT 
                SUM(total) as total_sales_range,
                COUNT(id_pedido) as num_orders_range
            FROM pedidos {where_pedidos}
        """, params_with_tenant)
        summary_range_raw = cursor.fetchone()
        summary = {
            'total_sales_range': float(summary_range_raw.get('total_sales_range') or 0),
            'num_orders_range': int(summary_range_raw.get('num_orders_range') or 0)
        }
        
        # 3. Sum expenses in the same date range
        cursor.execute("""
            SELECT SUM(monto) as total_expenses_range
            FROM gastos WHERE tenant_id = %s AND fecha BETWEEN %s AND %s
        """, params_with_tenant)
        expenses_range_raw = cursor.fetchone()
        summary['total_expenses_range'] = float(expenses_range_raw.get('total_expenses_range') or 0)

        # 4. Sum waste in the same date range
        cursor.execute("""
            SELECT SUM(costo_perdida) as total_waste_range
            FROM merma WHERE tenant_id = %s AND fecha BETWEEN %s AND %s
        """, params_with_tenant)
        waste_range_raw = cursor.fetchone()
        summary['total_waste_range'] = float(waste_range_raw.get('total_waste_range') or 0)

        # 5. Data for the chart for the date range (IMPROVED VERSION)
        # 💡 FIX: A complete date series is generated for the range and sales are joined.
        # This ensures there is a data point (even if it's 0) for each day,
        # making the chart continuous and easier to render on the frontend.
        cursor.execute("""
            WITH date_series AS (
                SELECT generate_series(%s::date, %s::date, '1 day'::interval)::date as fecha
            )
            SELECT 
                d.fecha,
                COALESCE(SUM(p.total), 0) as venta
            FROM date_series d
            LEFT JOIN pedidos p ON DATE(p.fecha_pedido) = d.fecha AND p.tenant_id = %s AND p.estado != 'cancelado'
            GROUP BY d.fecha
            ORDER BY d.fecha ASC
        """, (start_date_str, end_date_str, tenant_id))
        chart_data_raw = cursor.fetchall()
        sales_chart_data = [{"fecha": str(row['fecha']), "venta": float(row['venta'])} for row in chart_data_raw]

        # 6. Orders by status for the date range
        cursor.execute(f"SELECT estado, COUNT(id_pedido) as cantidad FROM pedidos {where_pedidos} GROUP BY estado", params_with_tenant)
        status_raw = cursor.fetchall()
        orders_by_status = {row['estado']: row['cantidad'] for row in status_raw}

        # 7. Top product for the date range
        where_pedidos_aliased = " WHERE ped.tenant_id = %s AND ped.estado = 'completado' AND DATE(ped.fecha_pedido) BETWEEN %s AND %s "
        cursor.execute(f"""
            SELECT p.nombre, p.precio, SUM(dp.cantidad) as total_vendido
            FROM detalle_pedidos dp
            JOIN productos p ON dp.producto_id = p.id_producto
            JOIN pedidos ped ON dp.pedido_id = ped.id_pedido
            {where_pedidos_aliased}
            GROUP BY p.id_producto
            ORDER BY total_vendido DESC LIMIT 1
        """, params_with_tenant)
        top_product_raw = cursor.fetchone()
        top_product = None
        if top_product_raw:
            top_product = {
                "nombre": top_product_raw['nombre'],
                "precio": float(top_product_raw['precio']),
                "total_vendido": int(top_product_raw['total_vendido'])
            }

        return jsonify({
            "summary": summary, 
            "sales_chart_data": sales_chart_data, 
            "orders_by_status": orders_by_status, 
            "top_product": top_product,
            "applied_filters": {"start_date": start_date_str, "end_date": end_date_str}
        })
    except Exception as e:
        current_app.logger.error(f"Error en get_estadisticas_dashboard: {e}")
        return jsonify({"error": "Error al obtener estadísticas"}), 500

# ==================== ADMIN MANAGEMENT ====================

@pedidos_bp.route("/", methods=["GET"])
@login_required
def get_pedidos():
    tenant_id = current_user.tenant_id
    conn = get_db()
    cursor = conn.cursor(cursor_factory=DictCursor)
    try:
        cursor.execute("""
            SELECT p.*, u.nombre as cliente_nombre, u.telefono as cliente_telefono 
            FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id_usuario
            WHERE p.tenant_id = %s
            ORDER BY p.fecha_pedido DESC
        """, (tenant_id,))
        orders = [dict(row) for row in cursor.fetchall()]
        # Format data for the frontend
        for p in orders:
            p['id_pedido'] = p.get('id_pedido') 
            p['total'] = float(p.get('total') or 0)
            if p.get('fecha_pedido'): 
                p['fecha_pedido'] = p['fecha_pedido'].strftime('%Y-%m-%d %H:%M')
            if p.get('fecha_entrega') and hasattr(p['fecha_entrega'], 'strftime'):
                p['fecha_entrega'] = p['fecha_entrega'].strftime('%Y-%m-%d %H:%M')
        return jsonify(orders)
    except Exception as e:
        current_app.logger.error(f"Error en get_pedidos: {e}")
        return jsonify({"error": "Error al obtener pedidos"}), 500

@pedidos_bp.route("/", methods=["POST"])
@admin_required
def create_pedido_admin():
    """
    Allows an administrator to create a new order manually.
    Calculates the total on the backend for security.
    """
    data = request.get_json()
    tenant_id = current_user.tenant_id
    conn = get_db()

    items = data.get("items", [])
    if not items:
        return jsonify({"error": "El pedido debe contener al menos un producto"}), 400

    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 1. Calculate the order total from the backend to prevent price manipulation.
            order_total = 0
            products_to_insert = []
            for item in items:
                producto_id = item.get("id_producto")
                cantidad = item.get("cantidad")
                if not producto_id or not cantidad or int(cantidad) <= 0:
                    continue # Ignore invalid items

                cursor.execute("SELECT precio FROM productos WHERE id_producto = %s AND tenant_id = %s", (producto_id, tenant_id))
                producto_data = cursor.fetchone()
                if not producto_data:
                    raise ValueError(f"Uno de los productos seleccionados (ID: {producto_id}) no fue encontrado.")
                
                precio_unitario = float(producto_data['precio'] or 0)
                subtotal = precio_unitario * int(cantidad)
                order_total += subtotal
                products_to_insert.append({
                    "producto_id": producto_id,
                    "cantidad": cantidad,
                    "precio_unitario": precio_unitario,
                    "subtotal": subtotal
                })
            
            if not products_to_insert:
                return jsonify({"error": "No se proporcionaron productos válidos en el pedido"}), 400

            # 2. Insert the main order.
            # FIX: 'customer_name' is removed from the INSERT. The customer's name is obtained via a JOIN with the 'usuarios' table using 'usuario_id'.
            cursor.execute("""
                INSERT INTO pedidos (usuario_id, telefono, direccion, total, estado, tenant_id)
                VALUES (%s, %s, %s, %s, 'pendiente', %s)
                RETURNING id_pedido
            """, (
                data.get("usuario_id"), 
                data.get("telefono"), 
                data.get("direccion"), 
                order_total, 
                tenant_id
            ))
            pedido_id = cursor.fetchone()[0]

            # 3. Insert the order details.
            for prod in products_to_insert:
                cursor.execute("INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, tenant_id) VALUES (%s, %s, %s, %s, %s, %s)",
                               (pedido_id, prod['producto_id'], prod['cantidad'], prod['precio_unitario'], prod['subtotal'], tenant_id))
            
            conn.commit()
            register_log(f"Admin creó nuevo pedido ID {pedido_id}")
            return jsonify({"message": "Pedido creado exitosamente", "id_pedido": pedido_id}), 201

    except ValueError as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en create_pedido_admin: {e}", exc_info=True)
        return jsonify({"error": "Error interno al crear el pedido"}), 500

@pedidos_bp.route("/<int:id>/estado", methods=["PUT"])
@admin_required # FIX: Security decorator added. Only admins can change the status.
def update_estado_pedido(id):
    data = request.get_json()
    new_status = data.get("estado")
    tenant_id = current_user.tenant_id
    conn = get_db()
    cursor = conn.cursor(cursor_factory=DictCursor)
    try:
        cursor.execute("SELECT estado FROM pedidos WHERE id_pedido = %s AND tenant_id = %s", (id, tenant_id))
        current_status_row = cursor.fetchone()
        if not current_status_row: return jsonify({"error": "Pedido no encontrado"}), 404

        if new_status == 'completado' and current_status_row.get('estado') != 'completado':
            process_stock_deduction(cursor, id, tenant_id)

        cursor.execute("UPDATE pedidos SET estado=%s WHERE id_pedido=%s AND tenant_id = %s", (new_status, id, tenant_id))
        conn.commit()

        # 🛡️ LOG: Order status tracking
        register_log(f"Actualizó estado del pedido #{id} de '{current_status_row.get('estado')}' a '{new_status}'")

        return jsonify({"message": "Actualizado", "status": new_status})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en update_estado_pedido: {e}", exc_info=True)
        return jsonify({"error": "Error al actualizar el estado del pedido"}), 500

@pedidos_bp.route("/<int:id>", methods=["PUT"])
@admin_required
def update_pedido_admin(id):
    """
    Allows an administrator to update an existing order.
    This replaces all items in the order and recalculates the total.
    """
    data = request.get_json()
    tenant_id = current_user.tenant_id
    conn = get_db()

    items = data.get("items", [])
    if not items:
        return jsonify({"error": "Un pedido debe contener al menos un producto"}), 400

    try:
        with conn.cursor(cursor_factory=DictCursor) as cursor:
            # 1. Recalculate total on the backend for security
            new_total = 0.0
            products_to_insert = []
            for item in items:
                cursor.execute("SELECT precio FROM productos WHERE id_producto = %s AND tenant_id = %s", (item.get("id_producto"), tenant_id))
                producto_data = cursor.fetchone()
                if not producto_data:
                    raise ValueError(f"Producto con ID {item.get('id_producto')} no encontrado.")
                
                precio_unitario_db = float(producto_data['precio'] or 0)
                cantidad = int(item.get("cantidad"))
                subtotal = precio_unitario_db * cantidad
                new_total += subtotal
                products_to_insert.append({
                    "id_producto": item.get("id_producto"),
                    "cantidad": cantidad,
                    "precio_unitario": precio_unitario_db,
                    "subtotal": subtotal
                })

            # 2. Delete old order details
            cursor.execute("DELETE FROM detalle_pedidos WHERE pedido_id = %s AND tenant_id = %s", (id, tenant_id))

            # 3. Insert new order details
            for prod in products_to_insert:
                cursor.execute("""
                    INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, tenant_id) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (id, prod['id_producto'], prod['cantidad'], prod['precio_unitario'], prod['subtotal'], tenant_id))

            # 4. Update the main order's total
            cursor.execute("UPDATE pedidos SET total = %s WHERE id_pedido = %s AND tenant_id = %s", (new_total, id, tenant_id))

            conn.commit()
            register_log(f"Admin actualizó pedido ID {id}")
            return jsonify({"message": "Pedido actualizado exitosamente", "id_pedido": id, "new_total": new_total})

    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en update_pedido_admin: {e}", exc_info=True)
        return jsonify({"error": "Error interno al actualizar el pedido"}), 500

@pedidos_bp.route("/<int:id>", methods=["DELETE"])
@admin_required
def delete_pedido(id):
    tenant_id = current_user.tenant_id
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM detalle_pedidos WHERE pedido_id = %s AND tenant_id = %s", (id, tenant_id))
        cursor.execute("DELETE FROM pedidos WHERE id_pedido = %s AND tenant_id = %s", (id, tenant_id))
        conn.commit()

        # 🛡️ LOG: Order deletion
        register_log(f"Eliminó permanentemente pedido ID {id}")

        return jsonify({"message": "Pedido eliminado exitosamente"})
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en delete_pedido: {e}", exc_info=True)
        return jsonify({"error": "Error al eliminar el pedido"}), 500

# ==================== PUBLIC ENDPOINTS 🌍 ====================

@pedidos_bp.route("/public", methods=["POST"])
def create_pedido_publico():
    data = request.get_json()
    # 💡 SAAS-IFICATION: Public orders are associated with the public tenant.
    tenant_id_publico = os.getenv('PUBLIC_TENANT_ID', 1)
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO pedidos (usuario_id, telefono, direccion, total, estado, tenant_id)
            VALUES (%s, %s, %s, %s, 'pendiente', %s)
            RETURNING id_pedido
        """, (data.get("usuario_id"), data.get("telefono"), data.get("direccion"), data.get("total", 0), tenant_id_publico))
        pedido_id = cursor.fetchone()[0]

        for item in data.get("items", []):
            cursor.execute("""
                INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, tenant_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (pedido_id, item.get("id_producto"), item.get("cantidad"), item.get("precio"), item.get("subtotal"), tenant_id_publico))
        conn.commit()

        # 🛡️ LOG: New incoming order
        register_log(f"Recibió nuevo pedido web: ID #{pedido_id}")

        return jsonify({"message": "Pedido recibido", "id_pedido": pedido_id}), 201
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error en create_pedido_publico: {e}", exc_info=True)
        return jsonify({"error": "Error al procesar el pedido"}), 500

@pedidos_bp.route("/public/mis-pedidos", methods=["GET"])
@login_required
def get_mis_pedidos():
    tenant_id = current_user.tenant_id
    conn = get_db()
    cursor = conn.cursor(cursor_factory=DictCursor)
    try:
        # This route was already optimized to avoid N+1, only the connection is changed.
        # 1. Get all user orders (1st query)
        cursor.execute("SELECT * FROM pedidos WHERE usuario_id = %s AND tenant_id = %s ORDER BY fecha_pedido DESC", (current_user.id, tenant_id))
        orders = [dict(p) for p in cursor.fetchall()]

        if not orders:
            return jsonify({"pedidos": []})

        # 2. Get ALL details for THOSE orders in a single query (2nd query)
        pedido_ids = [p['id_pedido'] for p in orders]
        placeholders = ','.join(['%s'] * len(pedido_ids))
        cursor.execute(f"""
            SELECT dp.pedido_id, dp.cantidad, dp.subtotal, pr.nombre 
            FROM detalle_pedidos dp JOIN productos pr ON dp.producto_id = pr.id_producto
            WHERE dp.pedido_id IN ({placeholders}) AND dp.tenant_id = %s
        """, tuple(pedido_ids) + (tenant_id,))
        all_details = cursor.fetchall()

        # 3. Map details to their corresponding orders in Python (very fast)
        details_by_order = {}
        for detalle in all_details:
            pedido_id = detalle['pedido_id']
            if pedido_id not in details_by_order:
                details_by_order[pedido_id] = []
            details_by_order[pedido_id].append({
                "nombre": detalle['nombre'], "cantidad": detalle['cantidad'], "subtotal": float(detalle['subtotal'])
            })

        # 4. Combine the data
        for p in orders:
            p['total'] = float(p['total'] or 0)
            p['fecha_pedido'] = p['fecha_pedido'].strftime('%Y-%m-%d %H:%M') if p['fecha_pedido'] else ""
            p['detalles'] = details_by_order.get(p['id_pedido'], [])
        return jsonify({"pedidos": orders})
    except Exception as e:
        current_app.logger.error(f"Error en get_mis_pedidos: {e}")
        return jsonify({"error": "Error al obtener sus pedidos"}), 500