# Security Policy & Implementation — Hara Workshop

## Authentication & Authorization
- JWT (JSON Web Tokens): Short-lived access tokens (60 min) with refresh tokens (7 days).
- Password Hashing: Django PBKDF2 with SHA-256 password hashing.
- RBAC Enforcement: Object-level verification on both Django REST Framework querysets and React Route guards.
- Customer Data Isolation: Customers cannot access quotes, orders, invoices, or personal data belonging to another customer.

## Input Validation & Sanitization
- All incoming payloads pass through Django REST Framework serializers and frontend Zod schemas.
- File upload constraints: Maximum 10MB, strictly validated MIME types (JPEG, PNG, WEBP, PDF).
- CORS whitelisting preventing unauthorized cross-origin requests.
