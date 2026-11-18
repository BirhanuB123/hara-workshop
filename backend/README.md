# Hara Workshop API (Express + Prisma + Neon)

Replacement for the Django backend. Same `/api` URLs and JSON shapes, so the React frontend only needs a new `VITE_API_URL`.

## Status

| Area | State |
|---|---|
| Neon schema (28 tables, names identical to Django) | Done |
| `GET /api/products/` (+ filters, search, ordering, pagination), `/products/{id\|sku\|slug}`, `/products/subcategories`, `/products/categories[/{id}]` | Done, tested on PostgreSQL 16 |
| `GET /api/services/`, `/services/{id\|slug}`, `/services/categories` | Done, tested |
| `GET /api/settings/` and `/api/core/public-settings/` (public) | Done, tested |
| `POST /api/contact/` (validation, saved first, then Telegram) | Done, tested (Telegram path needs a bot token) |
| `POST /api/quotations/` (validation, file checks, Cloudinary, numbering, price baseline, Telegram link) | Done, tested without files; file upload needs Cloudinary keys |
| Data copy Django → Neon (`npm run db:copy`) | Done, tested between two local databases |
| Media copy to Cloudinary (`npm run media:upload`) | Written, not tested (needs your keys) |
| JWT login, staff write endpoints, orders, production, inventory, messaging, notifications, reports, Telegram bot webhook | Not started |

## First run

```bash
cp .env.example .env            # fill DATABASE_URL (Neon), CORS_ORIGINS, Cloudinary, Telegram
npm install                     # also runs `prisma generate`
npm run db:push                 # creates the tables in Neon from prisma/schema.prisma
SOURCE_DATABASE_URL=postgres://...django-db... npm run db:copy -- --dry   # row counts only
SOURCE_DATABASE_URL=postgres://...django-db... npm run db:copy            # copy the data
npm run media:upload -- /path/to/django/media   # images -> Cloudinary (same relative paths)
npm run dev                     # http://localhost:8000
```

`db:copy` is safe to re-run (existing ids are skipped). Run it once against a Neon **branch** first.

## Checks before cutover

1. `npx prisma db pull` against the live Django database in a scratch folder and diff it with `prisma/schema.prisma`. The schema was generated from `models.py`, not from the live database, so migrations applied by hand would show up here.
2. Compare row counts printed by `db:copy`.
3. Point the frontend at the new API in a Vercel preview (`VITE_API_URL=https://<new-host>/api`) and try: catalog, a product page, a service page, the contact form and a quote with attachments.

## Notes

- **Prisma 7**: the datasource URL lives in `prisma.config.ts`; the client is generated into `src/generated/prisma` and uses the `pg` driver adapter.
- **Images**: rows copied from Django hold relative paths such as `products/gate.jpg`; the API turns them into Cloudinary URLs. New uploads store the full Cloudinary URL.
- **Passwords**: copied users keep Django's `pbkdf2_sha256$...` hashes. The login phase will verify those and re-hash to bcrypt on first sign-in.
- **Visibility**: until login is built, every caller is treated as a visitor (only `is_active` rows).
- **Hosting**: plain Node server (`npm run build && npm start`); works on Railway, Fly, Render, a VPS, or Vercel with a small `api/index.ts` wrapper exporting `app`.
