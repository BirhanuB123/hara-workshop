# System Architecture — Hara Workshop

Hara Workshop is architected as a decoupled, multi-tier full-stack application.

## High-Level Architecture
1. **Client Tier (Frontend):**
   - React 18 / 19 with TypeScript and Vite.
   - Tailwind CSS with an industrial-modern design system inspired by the Hara Workshop branding.
   - Zustand for lightweight client state (auth session, shopping/quote draft state, UI notifications).
   - React Router v6 with declarative public, customer, and admin layout structures.
   - Recharts for data-driven workshop analytics.
2. **Application Tier (Backend):**
   - Python Django 5.x + Django REST Framework.
   - Modular Django apps adhering to Single Responsibility:
     - accounts: Authentication, custom User model, profiles, RBAC.
     - core: Base audit models, workshop settings, media utilities.
     - products: Category and product catalogs, dimensions, pricing.
     - services: Service capabilities and scope definitions.
     - projects: Project gallery, showcase with before/after images.
     - quotations: Estimation engine, bill of materials breakdown, status transitions.
     - orders: Order management, state-machine tracking, delivery info.
     - production: 10-stage workshop manufacturing workflow, tasks, assignments.
     - inventory: Raw materials, SKU tracking, stock transactions, alerts.
     - suppliers: Supplier directory and procurement connections.
     - payments: Payment records, ETB currency, multiple channels (CBE, Telebirr, etc.).
     - invoices: Formal invoice generation, VAT calculation, balance tracking.
     - expenses: Workshop operating expenses and receipt tracking.
     - messaging: Direct customer-workshop communication.
     - notifications: Notification dispatch and unread alerts.
     - reports: Aggregated analytics and financial metrics.
3. **Persistence Tier:**
   - PostgreSQL 16 (production and containerized runs).
   - Dynamic database router configuration supporting PostgreSQL with graceful zero-dependency SQLite fallback for local test execution.
4. **Background & Async Processing:**
   - Celery worker + Redis queue for background notifications, scheduled quote expirations, and stock monitoring.
   - Eager fallback mode (CELERY_TASK_ALWAYS_EAGER = True) when Redis is not running locally.
