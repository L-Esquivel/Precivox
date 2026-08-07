# Precivox Database

This directory contains the SQL scripts needed to set up and populate the PostgreSQL database for local development.

## Files

| File | Description |
|:---|:---|
| `setup.sql` | Creates all 18 tables, indexes, and constraints. Also seeds the default platform modules. |
| `seed.sql` | Populates the database with demo data: a sample tenant, admin user, products, ingredients, and packaging. |

## Quick Start

```bash
# 1. Create the database
createdb precivox_dev

# 2. Run the schema setup
psql -d precivox_dev -f database/setup.sql

# 3. (Optional) Load demo data
psql -d precivox_dev -f database/seed.sql
```

## Notes

- The seed script includes placeholder password hashes. See the comments inside `seed.sql` for instructions on generating real hashes with Werkzeug.
- Make sure your `DATABASE_URL` in `backend/.env` points to this local database (e.g., `postgresql://localhost:5432/precivox_dev`).
