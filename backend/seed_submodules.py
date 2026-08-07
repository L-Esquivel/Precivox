import os
import psycopg2
from dotenv import load_dotenv

def seed_submodules():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    
    if not db_url:
        print("❌ Error: DATABASE_URL environment variable not found.")
        return

    # Ensure sslmode=require for Render
    if 'sslmode' not in db_url:
        db_url += '?sslmode=require' if '?' not in db_url else '&sslmode=require'

    try:
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO modules (module_key, label, icon, description, order_index)
                VALUES 
                ('ingredientes', 'Ingredientes', '🥑', 'Terminología para ingredientes', 8),
                ('empaques', 'Empaques', '📦', 'Terminología para empaques', 9)
                ON CONFLICT (module_key) DO NOTHING;
            """)
            
            # Now, for every existing tenant, we should enable these by default so they don't disappear
            cursor.execute("SELECT id_tenant FROM tenants;")
            tenants = cursor.fetchall()
            
            for tenant in tenants:
                tenant_id = tenant[0]
                cursor.execute("""
                    INSERT INTO tenant_module_settings (tenant_id, module_key, custom_label)
                    VALUES 
                    (%s, 'ingredientes', 'Ingredientes'),
                    (%s, 'empaques', 'Empaques')
                    ON CONFLICT DO NOTHING;
                """, (tenant_id, tenant_id))
            
            conn.commit()
            print("✅ Submódulos 'ingredientes' y 'empaques' añadidos a la base de datos con éxito.")
    except Exception as e:
        print(f"❌ Error al conectar o insertar en la base de datos: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    seed_submodules()
