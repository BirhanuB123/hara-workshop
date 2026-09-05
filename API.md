# REST API Documentation — Hara Workshop

All endpoints are prefixed with /api/ and output JSON with consistent pagination and error formatting.

## Authentication Endpoints
- POST /api/auth/register/ — Customer registration.
- POST /api/auth/login/ — Returns JWT access and refresh tokens + user profile.
- POST /api/auth/refresh/ — Refreshes expired access tokens.
- GET /api/auth/me/ — Retrieves current user info, role, and profile details.
- PATCH /api/auth/profile/ — Updates user profile.

## Public & Catalog Endpoints
- GET /api/categories/ — List product categories.
- GET /api/products/ — Filterable product catalog (category, search, featured).
- GET /api/products/{id}/ — Single product details.
- GET /api/services/ — Workshop service offerings.
- GET /api/projects/ — Portfolio projects with filtering (category, featured).
- GET /api/projects/{id}/ — Single project details with gallery images.
- GET /api/settings/public/ — Public workshop contact details, hours, and branding.

## Quotations
- POST /api/quotes/ — Submit quote request (Customer).
- GET /api/quotes/ — List quotes (Customer sees own; Staff sees all).
- GET /api/quotes/{id}/ — Quote details and itemized pricing breakdown.
- POST /api/quotes/{id}/calculate/ — Calculate pricing breakdown (Staff).
- POST /api/quotes/{id}/propose/ — Propose quotation to customer (Staff).
- POST /api/quotes/{id}/accept/ — Accept quotation and trigger order creation (Customer).
- POST /api/quotes/{id}/reject/ — Reject quotation (Customer).

## Orders & Production
- GET /api/orders/ — List orders (Customer sees own; Staff sees all).
- GET /api/orders/{id}/ — Order details, items, timeline.
- GET /api/production/ — Workshop production jobs (Production staff / Managers).
- PATCH /api/production/{id}/ — Update job stage, progress %, and notes.

## Inventory & Suppliers
- GET /api/materials/ — Materials list with current stock levels.
- POST /api/inventory/transactions/ — Record purchase, consumption, waste, adjustment.
- GET /api/suppliers/ — Supplier directory.

## Billing & Finance
- GET /api/invoices/ — Invoices (filtered by role).
- GET /api/payments/ — Payment transaction records.
- POST /api/payments/ — Record payment transaction.
- GET /api/expenses/ — Workshop operating expenses.
- GET /api/reports/ — Analytics and aggregated metrics.
