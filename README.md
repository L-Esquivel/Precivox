<div align="center">

# 🧮 Precivox

**Multi-Tenant Business Intelligence SaaS Platform**

A full-stack SaaS application engineered for small and medium-sized food businesses — replacing fragmented spreadsheets with a unified, data-driven ecosystem for precise recipe costing, inventory management, order processing, and real-time profitability analysis.

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## Overview

Precivox was born from a real problem: small food businesses (bakeries, restaurants, catering) track costs in messy spreadsheets, guess at profit margins, and lose money without knowing it. This platform solves that by providing an **Advanced Costing Engine** that automatically calculates the true cost of every product — down to the last gram of flour and the box it ships in.

The platform is built as a **multi-tenant SaaS**, meaning a single deployment serves multiple independent businesses, each with their own isolated data, branding, and feature configuration — all managed through a centralized Super Admin dashboard.

### Who is this for?

- **Small bakeries & food businesses** that need real cost visibility and margin analysis
- **Platform operators** who want to offer business intelligence tools as a managed service
- **Recruiters & engineers** evaluating full-stack SaaS architecture and engineering practices

---

## ✨ Key Features

### 🧮 Advanced Costing Engine
The core differentiator — a mathematical engine providing 100% visibility into production costs:

| Capability | Description |
|:---|:---|
| **Granular Recipe Costing** | Aggregates individual ingredient and packaging costs per product automatically |
| **Operational Expense Integration** | Factors in labor, utilities, and indirect costs for a true "cost to produce" |
| **Dynamic Profit Margins** | Set desired margins → instantly see recommended selling price vs. actual costs |
| **Suggested Pricing** | Auto-calculates optimal selling prices based on cost + target profit percentage |
| **Waste (Merma) Management** | Ingredient waste tracked by cost; finished product waste tracked by sale price to measure lost revenue |

### 📦 Inventory & Supply Chain
- Full CRUD for **ingredients**, **packaging materials**, and **products**
- **Recipe system** linking products to their ingredient/packaging formulas with exact quantities
- **Automatic stock deduction** when orders are marked as completed
- Stock control with low-inventory alerts

### 🛒 Order Management
- Create, edit, and track orders through a complete lifecycle (`pending → confirmed → in preparation → completed / canceled`)
- **Receipt generation** with print-ready formatting
- Order detail panels with per-item breakdowns
- Automatic inventory deduction on order completion

### 📊 Business Intelligence Dashboard
- Real-time KPIs: total revenue, expenses, waste costs, profit margins
- Interactive charts powered by **Recharts** (cost vs. sales trends, category breakdowns)
- Expense tracking by category with period filtering

### 🏢 Multi-Tenancy & Platform Management
- **Logical data isolation** — every query is scoped by `tenant_id`
- **Super Admin dashboard** for managing the tenant lifecycle, payments, and global statistics
- **Module system** — toggle features on/off per tenant (feature flags)
- **Custom branding** per tenant: logo, colors, social links, WhatsApp integration

### 🌍 Internationalization
- Fully bilingual admin panel (**English / Spanish**) using `i18next`
- Automatic language detection from browser settings

### 🔐 Security & Authentication
- Session-based authentication with **Flask-Login**
- **Google OAuth 2.0** social login via Authlib
- Password recovery flow via **SendGrid** transactional emails
- Role-based access control (RBAC): Super Admin, Admin, Client
- API rate limiting with **Flask-Limiter**

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                            │
│                                                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │ Admin Panel   │  │  Storefront  │  │ Landing Page │ │
│   │ React + Vite  │  │ React + Vite │  │ React + Vite │ │
│   │  (Port 5173)  │  │ (Port 5174)  │  │ (Port 5175)  │ │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│          │                 │                  │         │
└──────────┼─────────────────┼──────────────────┼─────────┘
           │                 │                  │
           ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    REST API (Flask)                      │
│                                                         │
│   ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│   │  Auth   │ │ Products  │ │  Orders  │ │ Recipes  │  │
│   │ Module  │ │  Module   │ │  Module  │ │ Module   │  │
│   └────┬────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘  │
│        │            │            │             │        │
│   ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│   │ Tenants │ │ Expenses  │ │  Waste   │ │Storefront│  │
│   │ Module  │ │  Module   │ │  Module  │ │ Module   │  │
│   └────┬────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘  │
│        └────────────┼────────────┼─────────────┘        │
│                     ▼            ▼                       │
│              ┌─────────────────────┐                    │
│              │  PostgreSQL (Supabase)│                   │
│              │  18 tables, tenant-  │                    │
│              │  scoped isolation    │                    │
│              └─────────────────────┘                    │
│                                                         │
│   External Services: Cloudinary · SendGrid · Google     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|:---|:---|
| **Python 3.9+** | Core language |
| **Flask 3.0** | Lightweight WSGI web framework |
| **PostgreSQL** | Relational database (hosted on Supabase) |
| **psycopg2** | PostgreSQL adapter with connection pooling |
| **Flask-Login** | Session management & authentication |
| **Flask-Limiter** | API rate limiting |
| **Authlib** | Google OAuth 2.0 integration |
| **SendGrid** | Transactional email (password recovery) |
| **Cloudinary** | Cloud image storage & optimization |
| **Gunicorn** | Production WSGI HTTP server |

### Frontend (Admin Panel)
| Technology | Purpose |
|:---|:---|
| **React 19** | UI library |
| **Vite 6** | Build tool & dev server |
| **Bootstrap 5** | Responsive component framework |
| **Recharts** | Interactive data visualization charts |
| **i18next** | Internationalization (EN/ES) |
| **SweetAlert2** | Premium toast & alert notifications |
| **React Router 7** | Client-side routing |
| **@hello-pangea/dnd** | Drag & drop functionality |

### Infrastructure
| Service | Purpose |
|:---|:---|
| **Vercel** | Frontend deployment (Admin Panel) |
| **Railway / Render** | Backend API deployment |
| **Supabase** | Managed PostgreSQL database |
| **GitHub** | Version control & CI/CD |

---

## 📁 Project Structure

```
precivox/
├── admin-panel/              # 🖥️  Admin Panel (React + Vite)
│   └── mi-app/
│       ├── src/
│       │   ├── components/   # Feature components (pedidos, productos, etc.)
│       │   ├── contexts/     # React Context (Auth, Theme)
│       │   ├── locales/      # i18n translation files (en.json, es.json)
│       │   ├── services/     # API service layer
│       │   └── utils/        # Shared utilities (currency formatting, etc.)
│       └── package.json
│
├── backend/                  # ⚙️  Flask REST API
│   ├── app.py                # Application entry point & middleware config
│   ├── db.py                 # PostgreSQL connection pool manager
│   ├── models.py             # User model (Flask-Login integration)
│   ├── utils.py              # Decorators (@admin_required) & audit logging
│   ├── init_schema.py        # Database schema initialization script
│   ├── login.py              # Auth routes (email/password, Google OAuth)
│   ├── productos.py          # Product catalog API
│   ├── pedidos.py            # Order management API
│   ├── recetas.py            # Recipe costing engine API
│   ├── ingredientes.py       # Ingredient inventory API
│   ├── empaques.py           # Packaging inventory API
│   ├── gastos.py             # Expense tracking API
│   ├── merma.py              # Waste management API
│   ├── tenants.py            # Multi-tenant management API
│   ├── platform_api.py       # Super Admin platform operations
│   ├── storefront.py         # Storefront CMS API
│   ├── requirements.txt      # Python dependencies
│   └── Procfile              # Deployment configuration
│
├── storefront-app/           # 🛍️  Customer-facing Storefront (React + Vite)
├── landing-page/             # 🌐  Marketing Landing Page (React + Vite)
│
├── database/                 # 🗄️  Database Setup Scripts
│   ├── setup.sql             # Full PostgreSQL schema (18 tables)
│   ├── seed.sql              # Sample data for development
│   └── README.md             # Database setup instructions
│
├── shared-assets/            # 🎨  Shared images and branding assets
├── LICENSE                   # Proprietary license
└── README.md                 # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|:---|:---|
| **Node.js** | v18 or higher |
| **Python** | v3.9 or higher |
| **PostgreSQL** | v14 or higher |
| **Git** | Latest |

### 1. Clone the Repository

```bash
git clone https://github.com/L-Esquivel/Precivox.git
cd Precivox
```

### 2. Database Setup

Create a local PostgreSQL database and run the provided setup scripts:

```bash
# Create the database
createdb precivox_dev

# Create all tables and seed default modules
psql -d precivox_dev -f database/setup.sql

# (Optional) Load demo data for testing
psql -d precivox_dev -f database/seed.sql
```

> **Note:** If using the seed data, you'll need to generate real password hashes. See comments in `database/seed.sql` for instructions.

### 3. Backend Setup

```bash
# Navigate to the backend
cd backend

# Create and activate a virtual environment
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://localhost:5432/precivox_dev

# Security
SECRET_KEY=your-secret-key-here

# Email (SendGrid) — Optional for local dev
SENDGRID_API_KEY=your-sendgrid-key
SUPPORT_EMAIL_ADDRESS=support@yourdomain.com

# Image Storage (Cloudinary) — Optional for local dev
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth — Optional for local dev
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Frontend Setup (Admin Panel)

```bash
cd admin-panel/mi-app
npm install
```

Create a `.env` file in `admin-panel/mi-app/`:

```env
VITE_API_URL=http://127.0.0.1:5000
```

### 5. Run the Application

Open **two terminals** and run:

**Terminal 1 — Backend API:**
```bash
cd backend
python app.py
# ✅ API running at http://127.0.0.1:5000
```

**Terminal 2 — Admin Panel:**
```bash
cd admin-panel/mi-app
npm run dev
# ✅ Admin Panel running at http://localhost:5173
```

---

## 📡 API Reference

The backend exposes **17 RESTful blueprint modules** with over 60 endpoints:

| Module | Prefix | Description |
|:---|:---|:---|
| **Auth** | `/auth` | Login, logout, Google OAuth, password recovery, session (`/me`) |
| **Users** | `/usuarios` | User CRUD, role management |
| **Products** | `/productos` | Catalog management, pricing, stock control, image upload |
| **Orders** | `/pedidos` | Full order lifecycle, status updates, receipt generation |
| **Order Details** | `/detalle_pedidos` | Line items per order |
| **Ingredients** | `/ingredientes` | Raw material inventory and unit costs |
| **Recipes** | `/recipes` | Costing calculations, ingredient & packaging allocations |
| **Packaging** | `/empaques` | Packaging materials management |
| **Expenses** | `/gastos` | Fixed & variable expense tracking |
| **Waste** | `/merma` | Shrinkage logging and loss metrics |
| **Tenants** | `/tenants` | Multi-tenant organization management |
| **Platform** | `/platform` | Super Admin operations, support, module enablement |
| **Modules** | `/modules` | Available feature module listing |
| **Payments** | `/payments` | Tenant subscription & billing |
| **Settings** | `/settings` | Tenant branding (logo, colors, social links) |
| **Storefront (Admin)** | `/api/tenant/storefront` | CMS section management |
| **Storefront (Public)** | `/api/public/storefront` | Public storefront data |

---

## 🗺 Roadmap

- [x] **Multi-Tenant Architecture** — Logical data isolation with `tenant_id` scoping
- [x] **Advanced Costing Engine** — Granular recipe costing with margin analysis
- [x] **Admin Panel** — Full-featured dashboard with BI charts
- [x] **Internationalization** — Bilingual support (EN/ES) with `i18next`
- [x] **Module System** — Feature flags togglable per tenant by Super Admin
- [x] **Order Lifecycle** — Complete order processing with automatic inventory deduction
- [x] **Waste Tracking** — Forensic waste management with cost/revenue impact analysis
- [x] **Tenant Branding** — Custom logos, colors, and social links per business
- [ ] **Multi-Tenant Storefronts** — Dynamic, customizable public-facing pages *(in progress)*
- [ ] **Security Audit** — End-to-end review of data isolation and RBAC
- [ ] **Dockerization** — Full containerization for portable deployment
- [ ] **Payment Gateway Integration** — Online payments for storefront orders

---

## 📄 License

Copyright © 2026 **Luis Alejandro Esquivel Rojas**. All Rights Reserved.

This software and all associated files are the exclusive intellectual property of the author. Unauthorized copying, distribution, modification, or commercial use is strictly prohibited without express written consent. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by [Luis Esquivel](https://github.com/L-Esquivel)

</div>
