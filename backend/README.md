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

## Deploy on Railway

The repo includes a `Dockerfile` and `railway.json` (health check on `/health`, restart on failure).

1. **Prepare Neon first (from your computer):** `npm run db:push`, then `npm run db:copy` (see First run). Use the **pooled** Neon connection string for the API.
2. **Push this folder to GitHub** (e.g. as `backend-express/` in the `hara-workshop` repo).
3. **Railway → New Project → Deploy from GitHub repo.** If the API is in a sub-folder, open the service **Settings → Root Directory** and set that folder. Railway picks up `railway.json` and builds the Dockerfile.
4. **Variables** (service → Variables):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://hara-workshop.vercel.app` (comma-separate extra origins; `hara-workshop*.vercel.app` previews are allowed automatically) |
| `PUBLIC_API_URL` | your Railway public URL, no trailing slash |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Cloudinary |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_GROUP_CHAT_ID`, `TELEGRAM_MANAGER_CHAT_ID` | from your bot |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | long random strings (needed once login is added) |

   Railway sets `PORT` itself; do not add it.
5. **Settings → Networking → Generate Domain**, then copy it into `PUBLIC_API_URL` and redeploy.
6. Check `https://<domain>/health` and `https://<domain>/api/products/`.
7. **Vercel (frontend):** set `VITE_API_URL=https://<domain>/api` and redeploy.
8. Keep the old Render service running until the new one has served real traffic for a few days, then remove it.
