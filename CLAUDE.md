# CLAUDE.md — BenoCode Homepage

## Project overview

Personal freelance portfolio & admin CMS for [benocode.sk](https://benocode.sk). Monorepo with three packages:

- **`/backend`** — Express 5 REST API (Node 22, TypeScript 6)
- **`/frontend`** — Next.js 16 App Router (React 19, TypeScript 6)
- **`/shared`** — Shared Zod schemas and TypeScript types

Everything runs in Docker. PostgreSQL 17, Redis 7, Nginx reverse proxy in production.

## Running the project

The project runs via Docker Compose. Use the Makefile:

```bash
make dev          # Start dev stack (postgres, redis, backend, frontend)
make down         # Stop containers
make logs         # Tail all logs
make logs-be      # Tail backend logs
make logs-fe      # Tail frontend logs
make migrate      # Run Prisma migrations (in backend container)
make seed         # Seed the database
make shell-be     # Shell into backend container
make shell-fe     # Shell into frontend container
make prod         # Build and start production stack
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Admin panel: http://localhost:3000/admin

## Tech stack

### Backend
- Express 5.2, TypeScript 6, Prisma 7 (PostgreSQL), Redis 7
- JWT auth with httpOnly cookies, CSRF protection (HMAC-SHA256)
- Winston logging, Sentry error tracking, Brevo email
- Zod validation, DOMPurify sanitization, Helmet security headers

### Frontend
- Next.js 16.2, React 19, TypeScript 6, Tailwind CSS 4
- React Query 5 (server state), Zustand 5 (client state)
- React Hook Form + Zod (forms), next-intl (i18n: EN, SK, DE, CZ)
- Tiptap rich text editor, Axios HTTP client

## Testing

```bash
make test-be          # Backend unit tests (Jest)
make test-fe          # Frontend unit tests (Jest)
make test-integration # Backend integration tests (Supertest)
make test-e2e         # Playwright E2E tests (requires running dev stack)
```

Backend tests run inside Docker containers. E2E tests run on host against the running dev stack.

## Code style

### Formatting (Prettier)
- Single quotes, semicolons, trailing commas (es5)
- 100 char print width, 2-space indent
- Config: `.prettierrc.json` (shared between frontend and backend)

### Linting (ESLint)
- **Backend**: `eslint:recommended` + `@typescript-eslint/recommended` + Prettier
  - `no-explicit-any`: error
  - Config: `backend/.eslintrc.json`
- **Frontend**: Next.js core-web-vitals + TypeScript + Prettier (flat config)
  - `no-explicit-any`: warn (ongoing cleanup)
  - Config: `frontend/eslint.config.mjs`

### Conventions
- Backend follows controller → service → Prisma pattern
- Frontend uses App Router with `'use client'` where needed
- API routes under `/api/v1/` — public and `/api/v1/admin/` — protected
- Translations in `/frontend/messages/{en,sk,de,cz}.json`

## Database

PostgreSQL 17 via Prisma 7. Schema at `backend/prisma/schema.prisma`.

Key models: User, Content, ContentTranslation, Testimonial, TestimonialTranslation, Lead, SocialLink, ExternalLink, LegalPage, LegalPageTranslation, MeetingBooking, AvailabilitySlot.

```bash
# In backend container or via make:
npx prisma migrate dev --name <name>   # Create migration
npx prisma migrate deploy              # Apply migrations (production)
npx prisma studio                      # GUI browser
```

## Environment variables

Three `.env` files are needed (see `.env.example` files):
- **Root `.env`** — Docker Compose variables (DB_PASSWORD, JWT_SECRET, etc.)
- **`backend/.env`** — Backend config (DATABASE_URL, CORS_ORIGIN, etc.)
- **`frontend/.env.local`** — Frontend config (NEXT_PUBLIC_API_URL)

Run `make setup` to copy examples on first clone.

## Architecture notes

- Auth: JWT access tokens (7d) + refresh tokens (30d) in httpOnly cookies
- CSRF: Token generated server-side, sent via `X-CSRF-Token` header, validated on state-changing requests to `/api/v1/admin/*`
- Production: Nginx reverse proxy handles SSL termination, Express has `trust proxy` enabled
- Frontend API client has automatic token refresh on 401 responses
- i18n: 4 locales (EN, SK, DE, CZ), route-based with `[locale]` segment for public pages
- Admin panel is not localized, lives under `/admin/*`

## Docker

- Dev: `docker-compose.yml` — hot-reload, source mounted as volumes
- Prod: `docker-compose.prod.yml` — multi-stage builds, non-root users, healthchecks, Nginx
- Backend entrypoint runs Prisma migrations + seed before starting

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
1. Backend tests (unit + integration against PostgreSQL)
2. Frontend tests (unit + type-check + lint)
3. E2E tests (Playwright)
4. Build verification
