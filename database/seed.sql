-- =============================================================
-- Precivox - Sample Seed Data (PostgreSQL)
-- =============================================================
-- Run this AFTER setup.sql to populate the database with demo
-- data for testing and development purposes.
--
-- Usage:  psql -d precivox_dev -f database/seed.sql
-- =============================================================

-- -----------------------------------------------
-- 1. DEMO TENANT
-- -----------------------------------------------

INSERT INTO tenants (nombre) VALUES ('Demo Bakery') RETURNING id_tenant;
-- This will return id_tenant = 1

-- -----------------------------------------------
-- 2. ADMIN USER (password: admin123)
-- -----------------------------------------------
-- The password hash below corresponds to 'admin123' using
-- Werkzeug's generate_password_hash (pbkdf2:sha256)
-- In production, change this immediately.

INSERT INTO usuarios (tenant_id, nombre, email, password, rol, is_superadmin)
VALUES (
    1,
    'Admin Demo',
    'admin@demo.com',
    'pbkdf2:sha256:600000$placeholder$hash_placeholder',
    'admin',
    FALSE
);

-- NOTE: The password hash above is a placeholder. To generate a
-- real hash, run the following in a Python shell:
--
--   from werkzeug.security import generate_password_hash
--   print(generate_password_hash('your_password_here'))
--
-- Then replace the placeholder hash in this file.

-- -----------------------------------------------
-- 3. SUPER ADMIN (Platform Owner)
-- -----------------------------------------------

INSERT INTO usuarios (tenant_id, nombre, email, password, rol, is_superadmin)
VALUES (
    1,
    'Super Admin',
    'superadmin@precivox.com',
    'pbkdf2:sha256:600000$placeholder$hash_placeholder',
    'admin',
    TRUE
);

-- -----------------------------------------------
-- 4. SAMPLE INGREDIENTS
-- -----------------------------------------------

INSERT INTO ingredientes (tenant_id, nombre, unidad, cantidad, costo_unitario) VALUES
(1, 'Harina de Trigo',    'kg',   50.00,  1.20),
(1, 'Azúcar',             'kg',   30.00,  0.90),
(1, 'Huevos',             'unidad', 120.00, 0.15),
(1, 'Mantequilla',        'kg',   20.00,  5.50),
(1, 'Leche',              'litro', 40.00,  1.00),
(1, 'Chocolate Cobertura','kg',   10.00,  8.00),
(1, 'Vainilla',           'litro',  5.00, 12.00),
(1, 'Polvo de Hornear',   'kg',    3.00,  3.50);

-- -----------------------------------------------
-- 5. SAMPLE PACKAGING
-- -----------------------------------------------

INSERT INTO empaques (tenant_id, nombre, descripcion, precio) VALUES
(1, 'Caja Individual',      'Caja de cartón para 1 pieza',   0.50),
(1, 'Caja Docena',          'Caja para 12 piezas',           1.50),
(1, 'Bolsa Celofán',        'Bolsa transparente individual',  0.10),
(1, 'Etiqueta Personalizada','Sticker con logo',              0.05);

-- -----------------------------------------------
-- 6. SAMPLE PRODUCTS
-- -----------------------------------------------

INSERT INTO productos (tenant_id, nombre, categoria, precio, precio_venta, utilidad_porcentaje, pax) VALUES
(1, 'Pastel de Chocolate',   'Pasteles',    150.00, 250.00, 40.00, 12),
(1, 'Cupcake de Vainilla',   'Cupcakes',     25.00,  45.00, 44.00,  1),
(1, 'Pan de Banana',         'Panes',        80.00, 120.00, 33.00,  8),
(1, 'Galletas de Avena',     'Galletas',     15.00,  25.00, 40.00,  1),
(1, 'Cheesecake de Fresas',  'Pasteles',    200.00, 350.00, 43.00, 10);

-- -----------------------------------------------
-- 7. ACTIVATE ALL MODULES FOR DEMO TENANT
-- -----------------------------------------------

INSERT INTO tenant_module_settings (tenant_id, module_key, is_active) VALUES
(1, 'usuarios',     TRUE),
(1, 'productos',    TRUE),
(1, 'pedidos',      TRUE),
(1, 'insumos',      TRUE),
(1, 'recetas',      TRUE),
(1, 'gastos',       TRUE),
(1, 'merma',        TRUE),
(1, 'ingredientes', TRUE),
(1, 'empaques',     TRUE),
(1, 'storefront',   FALSE);

-- -----------------------------------------------
-- 8. DEMO TENANT BRANDING
-- -----------------------------------------------

INSERT INTO tenant_settings (tenant_id, primary_color, secondary_color)
VALUES (1, '#667eea', '#764ba2');

-- =============================================================
-- ✅ Seed data loaded! You can now log in with the demo admin.
-- =============================================================
