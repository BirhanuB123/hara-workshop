# Production Deployment Guide — Hara Workshop

## Docker Deployment
`ash
docker-compose up -d --build
`
This provisions:
- db: PostgreSQL 16 on port 5432
- redis: Redis 7 on port 6379
- backend: Gunicorn / Django application on port 8000
- celery: Celery background worker
- frontend: Nginx serving the production Vite build

## Environment Checklist
- DEBUG=False
- SECRET_KEY: High-entropy 64-char string.
- DATABASE_URL: Production PostgreSQL credentials.
- ALLOWED_HOSTS: Domain names.
- CORS_ALLOWED_ORIGINS: Production frontend URLs.
- Secure SSL certificates.
