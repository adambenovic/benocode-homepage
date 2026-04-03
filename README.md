# BenoCode Website

A modern, multi-language website with admin panel for BenoCode software solutions.

## Architecture

This project follows a **three-tier architecture**:
- **Frontend**: Next.js 15 SPA (Public Website + Admin Panel)
- **Backend**: Express.js REST API
- **Database**: PostgreSQL 15+

## Technology Stack

### Frontend
- Next.js 15.x (App Router)
- TypeScript 5.x
- React 18.x
- Tailwind CSS 3.x
- Zustand + React Query
- React Hook Form + Zod
- next-intl (EN, SK, DE, CZ)

### Backend
- Node.js 20.x LTS
- Express.js 4.x
- TypeScript 5.x
- Prisma ORM
- JWT Authentication
- Brevo Email Service
- Redis (caching)

### Infrastructure
- PostgreSQL 15+
- Redis 7
- Docker & Docker Compose
- Nginx (production reverse proxy)

## Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 20.x LTS (for local development without Docker)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd benocode-homepage
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   Edit `.env` with your values (at minimum: `DB_PASSWORD`, `JWT_SECRET`, `BREVO_API_KEY`):
   ```env
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your-secret-key-min-32-characters-long
   BREVO_API_KEY=your-brevo-api-key
   BREVO_SENDER_EMAIL=noreply@benocode.sk
   ADMIN_EMAIL=admin@benocode.sk
   ```

3. **Start the development stack**
   ```bash
   docker compose up -d
   ```
   Or using Make:
   ```bash
   make dev
   ```

4. **Run database migrations**
   ```bash
   docker compose exec backend npx prisma migrate dev
   ```
   Or:
   ```bash
   make migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

## Local Development (Without Docker)

### Backend Setup

1. ```bash
   cd backend
   npm install
   cp .env.example .env   # Edit with your local values
   npx prisma migrate dev
   npm run dev
   ```

### Frontend Setup

1. ```bash
   cd frontend
   npm install
   cp .env.example .env.local   # Edit with your local values
   npm run dev
   ```

## Production Deployment

1. **Set up environment variables**
   ```bash
   cp env.production.example .env
   # Edit .env with real production values
   ```

2. **Start the production stack**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   Or:
   ```bash
   make prod
   ```

   The backend container automatically runs `prisma migrate deploy` on startup before serving requests.

3. **SSL/TLS**: Place your certificate and key in `docker/ssl/`:
   - `docker/ssl/cert.pem`
   - `docker/ssl/key.pem`

   For Let's Encrypt (recommended), see `docs/DEPLOYMENT.md`.

## Using Make

A `Makefile` is provided for common operations:

```bash
make help        # Show all available commands
make dev         # Start development stack
make prod        # Start production stack (builds images)
make down        # Stop all containers
make logs        # Follow logs (all services)
make migrate     # Run DB migrations (dev)
make seed        # Seed the database
make shell-be    # Open shell in backend container
make shell-fe    # Open shell in frontend container
make test-be     # Run backend tests
make test-fe     # Run frontend tests
make clean       # Remove containers, volumes, and images
```

## Project Structure

```
benocode-homepage/
├── frontend/                 # Next.js 15 frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities and helpers
│   ├── stores/               # Zustand state stores
│   └── messages/             # i18n translation files
├── backend/                  # Express.js REST API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── config/           # Configuration files
│   │   └── utils/            # Utility functions
│   └── prisma/               # Prisma schema and migrations
├── shared/                   # Shared TypeScript types & Zod schemas
├── docker/                   # Nginx config and SSL directory
├── docs/                     # Extended documentation
├── docker-compose.yml        # Development stack
├── docker-compose.prod.yml   # Production stack
├── Makefile                  # Convenience commands
└── env.production.example    # Production env reference
```

## Available Scripts

### Backend
- `npm run dev` - Start development server (tsx watch)
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run prisma:migrate` - Run migrations (dev)
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:seed` - Seed the database
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server (Turbo)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm test` - Run unit tests
- `npm run test:e2e` - Run Playwright E2E tests

## Environment Variables

### Root `.env` (Docker Compose)
| Variable | Required | Description |
|---|---|---|
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `BREVO_API_KEY` | Yes | Brevo email service API key |
| `BREVO_SENDER_EMAIL` | Yes | From address for emails |
| `ADMIN_EMAIL` | Yes | Admin notification email |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics ID |

### Backend `backend/.env`
| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` / `test` |
| `PORT` | No | Server port (default: `3001`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `BREVO_API_KEY` | Yes | Brevo API key |
| `BREVO_SENDER_EMAIL` | Yes | From address for emails |
| `ADMIN_EMAIL` | Yes | Admin notification email |
| `CORS_ORIGIN` | Yes | Frontend URL for CORS |
| `REDIS_URL` | No | Redis connection URL |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

### Frontend `frontend/.env.local`
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics ID |

## Database Management

```bash
# Create a new migration
cd backend && npx prisma migrate dev --name migration_name

# Apply migrations in production
cd backend && npx prisma migrate deploy

# Open Prisma Studio (database GUI)
cd backend && npx prisma studio

# Seed the database
cd backend && npm run prisma:seed
```

## Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Follow logs
docker compose logs -f

# Follow logs for specific service
docker compose logs -f backend

# Rebuild containers
docker compose build

# Execute command in container
docker compose exec backend npx prisma migrate dev
```

## Further Documentation

- `docs/DEPLOYMENT.md` - Detailed production deployment guide
- `docs/QUICK-DEPLOY.md` - Quick start deployment checklist
- `docs/technical-specification.md` - Architecture and API specification

## License

ISC
