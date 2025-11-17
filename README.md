# BenoCode Website

A modern, multi-language website with admin panel for BenoCode software solutions.

## Architecture

This project follows a **three-tier architecture**:
- **Frontend**: Next.js 14 SPA (Public Website + Admin Panel)
- **Backend**: Express.js REST API
- **Database**: PostgreSQL 15+

## Technology Stack

### Frontend
- Next.js 14.x (App Router)
- TypeScript 5.x
- React 18.x
- Tailwind CSS 3.x
- Zustand + React Query
- React Hook Form + Zod
- next-intl

### Backend
- Node.js 20.x LTS
- Express.js 4.x
- TypeScript 5.x
- Prisma ORM
- JWT Authentication
- Brevo Email Service

### Infrastructure
- PostgreSQL 15+
- Docker & Docker Compose
- Nginx (production)

## Prerequisites

- Docker & Docker Compose
- Node.js 20.x LTS (for local development without Docker)
- PostgreSQL 15+ (for local development without Docker)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd benocode-website
   ```

2. **Set up environment variables**
   
   Create `.env` file in the root directory:
   ```env
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your-secret-key-min-32-characters-long
   BREVO_API_KEY=your-brevo-api-key
   BREVO_SENDER_EMAIL=noreply@benocode.sk
   ADMIN_EMAIL=admin@benocode.sk
   NEXT_PUBLIC_GA_ID=your-google-analytics-id
   ```

   Create `backend/.env` file:
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL=postgresql://benocode:your_secure_password@postgres:5432/benocode
   JWT_SECRET=your-secret-key-min-32-characters-long
   JWT_EXPIRES_IN=7d
   BREVO_API_KEY=your-brevo-api-key
   BREVO_SENDER_EMAIL=noreply@benocode.sk
   ADMIN_EMAIL=admin@benocode.sk
   CORS_ORIGIN=http://localhost:3000
   ```

   Create `frontend/.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_GA_ID=your-google-analytics-id
   ```

3. **Start the development stack**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

## Local Development (Without Docker)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
benocode-website/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # Next.js 14 App Router
│   ├── components/           # React components
│   ├── lib/                  # Utilities and helpers
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # State management stores
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Global styles
├── backend/                  # Express.js backend API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   └── config/           # Configuration files
│   └── prisma/               # Prisma schema and migrations
├── shared/                   # Shared code between frontend/backend
│   ├── types/                # Shared TypeScript types
│   └── schemas/              # Shared Zod validation schemas
├── docker/                   # Docker configuration files
├── docs/                     # Documentation
└── docker-compose.yml        # Local development environment
```

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Development Guidelines

Please refer to `technical-specification.md` for detailed development guidelines, including:

- Coding standards and best practices
- API design conventions
- Database schema design
- Security requirements
- Testing strategy
- Deployment process

## Environment Variables

### Backend (.env)
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)
- `BREVO_API_KEY` - Brevo API key for email service
- `BREVO_SENDER_EMAIL` - Email address for sending emails
- `ADMIN_EMAIL` - Admin email address
- `CORS_ORIGIN` - Allowed CORS origin

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID

## Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Rebuild containers
docker-compose build

# Execute command in container
docker-compose exec backend npm run prisma:migrate
```

## License

ISC

## Support

For questions or issues, please refer to the technical specification document or contact the development team.

