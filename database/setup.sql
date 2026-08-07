-- =============================================================
-- Precivox - Database Setup Script (PostgreSQL)
-- =============================================================
-- This script creates all necessary tables for running Precivox
-- locally. Run it against a fresh PostgreSQL database.
--
-- Usage:
--   1. Create a database:  createdb precivox_dev
--   2. Run this script:    psql -d precivox_dev -f database/setup.sql
--   3. (Optional) Seed:    psql -d precivox_dev -f database/seed.sql
-- =============================================================

-- -----------------------------------------------
-- 1. MULTI-TENANCY CORE
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
    id_tenant SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'cliente',
    is_superadmin BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- 2. MODULE SYSTEM (Feature Flags per Tenant)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS modules (
    module_key VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    order_index INT
);

CREATE TABLE IF NOT EXISTS tenant_module_settings (
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    module_key VARCHAR(50) REFERENCES modules(module_key) ON DELETE CASCADE,
    custom_label VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (tenant_id, module_key)
);

-- -----------------------------------------------
-- 3. TENANT BRANDING & PAYMENTS
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id INT PRIMARY KEY REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    logo_url VARCHAR(255),
    primary_color VARCHAR(50),
    secondary_color VARCHAR(50),
    whatsapp_number VARCHAR(50),
    social_instagram VARCHAR(150),
    social_facebook VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS tenant_payments (
    id_payment SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- -----------------------------------------------
-- 4. PRODUCT CATALOG & COSTING ENGINE
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS productos (
    id_producto SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2),
    imagen VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    stock INT DEFAULT 0,
    controla_stock BOOLEAN DEFAULT FALSE,
    utilidad_porcentaje DECIMAL(5,2) DEFAULT 40.00,
    pax INT DEFAULT 1,
    costo_produccion DECIMAL(10,2) DEFAULT 0.00,
    precio_sugerido DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS empaques (
    id_empaque SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    precio DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS ingredientes (
    id_ingrediente SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 0.00,
    costo_unitario DECIMAL(10,2) DEFAULT 0.00
);

-- -----------------------------------------------
-- 5. RECIPE SYSTEM (Links Products ↔ Ingredients/Packaging)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS recetas_ingredientes (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    id_producto INT REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_ingrediente INT REFERENCES ingredientes(id_ingrediente) ON DELETE CASCADE,
    cantidad_necesaria DECIMAL(10,2) NOT NULL,
    costo_ingrediente DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS recetas_empaques (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    id_producto INT REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_empaque INT REFERENCES empaques(id_empaque) ON DELETE CASCADE,
    cantidad INT DEFAULT 1,
    subtotal DECIMAL(10,2)
);

-- -----------------------------------------------
-- 6. ORDER MANAGEMENT
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP,
    total DECIMAL(10,2),
    abono DECIMAL(10,2),
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    creado_por INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    cliente VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id_detalle SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    pedido_id INT REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id_producto) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS pagos (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    metodo VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'pendiente'
);

-- -----------------------------------------------
-- 7. FINANCIAL TRACKING
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS gastos (
    id_gasto SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merma (
    id_merma SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    id_producto INT REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_ingrediente INT REFERENCES ingredientes(id_ingrediente) ON DELETE CASCADE,
    descripcion VARCHAR(255),
    cantidad DECIMAL(10,2) NOT NULL,
    costo_perdida DECIMAL(10,2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT
);

-- -----------------------------------------------
-- 8. REVIEWS & STOREFRONT CMS
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS resenas (
    id_resena SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    producto_id INT REFERENCES productos(id_producto) ON DELETE CASCADE,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storefront_sections (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id_tenant) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL,
    display_order INT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- 9. SEED DATA: Default Platform Modules
-- -----------------------------------------------

INSERT INTO modules (module_key, label, icon, description, order_index) VALUES 
('usuarios',     'Usuarios',        '👥', 'Gestión de usuarios y accesos',        1),
('productos',    'Productos',       '🍰', 'Catálogo de productos',                2),
('pedidos',      'Pedidos',         '🛒', 'Gestión de órdenes',                   3),
('insumos',      'Insumos',         '📦', 'Ingredientes y empaques',              4),
('recetas',      'Recetas',         '📋', 'Fórmulas y preparaciones',             5),
('gastos',       'Gastos',          '💸', 'Registro de gastos fijos y variables', 6),
('merma',        'Merma',           '🗑️', 'Control de desperdicios',              7),
('ingredientes', 'Ingredientes',    '🥚', 'Gestión de ingredientes',              8),
('empaques',     'Empaques',        '📦', 'Gestión de empaques',                  9),
('storefront',   'Tienda en Línea', '🛍️', 'Página pública de ventas',            10)
ON CONFLICT (module_key) DO NOTHING;

-- =============================================================
-- ✅ Setup complete! Your database is ready.
-- =============================================================
