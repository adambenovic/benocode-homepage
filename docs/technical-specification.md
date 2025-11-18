# BenoCode Website - Technical Specification

**Version:** 1.0  
**Date:** 2024  
**Architect:** Senior Software Architect  
**Status:** Ready for Development

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Design](#6-database-design)
7. [API Design](#7-api-design)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Multi-Language Implementation](#9-multi-language-implementation)
10. [Integration Specifications](#10-integration-specifications)
11. [Security Requirements](#11-security-requirements)
12. [Coding Standards & Best Practices](#12-coding-standards--best-practices)
13. [Development Workflow](#13-development-workflow)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment Strategy](#15-deployment-strategy)
16. [Performance Optimization](#16-performance-optimization)
17. [Monitoring & Logging](#17-monitoring--logging)

---

## 1. System Architecture Overview

### 1.1 Architecture Pattern

The system follows a **three-tier architecture** pattern:

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js SPA)          │
│  - Public Website                       │
│  - Admin Panel                          │
└──────────────┬──────────────────────────┘
               │ HTTPS/REST API
┌──────────────▼──────────────────────────┐
│      Backend API (Node.js/Express)      │
│  - Business Logic                       │
│  - Authentication                       │
│  - Data Validation                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Database (PostgreSQL)             │
│  - Application Data                     │
│  - User Sessions                       │
└─────────────────────────────────────────┘
```

### 1.2 Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between frontend, backend, and database
2. **RESTful API Design**: Standard HTTP methods and status codes
3. **Stateless Backend**: JWT-based authentication for scalability
4. **Type Safety**: TypeScript throughout the stack
5. **Modular Design**: Reusable components and services
6. **Security First**: Input validation, sanitization, and encryption at every layer

### 1.3 System Components

- **Frontend Application**: Next.js application serving both public site and admin panel
- **Backend API**: Express.js REST API handling business logic
- **Database**: PostgreSQL for structured data storage
- **File Storage**: Local filesystem or cloud storage for media files
- **Email Service**: Brevo API integration
- **Reverse Proxy**: Nginx for SSL termination and static file serving

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Framework | Next.js | 14.x | SSR/SSG for SEO, excellent DX, built-in routing |
| Language | TypeScript | 5.x | Type safety, better IDE support, reduced bugs |
| UI Library | React | 18.x | Component-based, large ecosystem |
| Styling | Tailwind CSS | 3.x | Utility-first, fast development, consistent design |
| State Management | Zustand / React Query | Latest | Lightweight, simple API, server state management |
| Form Handling | React Hook Form + Zod | Latest | Performance, validation, type safety |
| Internationalization | next-intl | Latest | Next.js optimized i18n solution |
| HTTP Client | Axios | Latest | Promise-based, interceptors, error handling |
| Rich Text Editor | Tiptap | Latest | Modern, extensible, accessible |

### 2.2 Backend Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Runtime | Node.js | 20.x LTS | Long-term support, modern features |
| Framework | Express.js | 4.x | Mature, flexible, large ecosystem |
| Language | TypeScript | 5.x | Type safety across stack |
| ORM | Prisma | Latest | Type-safe, migrations, excellent DX |
| Authentication | JWT (jsonwebtoken) | Latest | Stateless, scalable |
| Validation | Zod | Latest | Type-safe validation, shared with frontend |
| Email Service | Brevo SDK | Latest | Official SDK for Brevo integration |
| File Upload | Multer | Latest | Express middleware for file handling |
| Rate Limiting | express-rate-limit | Latest | DDoS protection, abuse prevention |

### 2.3 Database & Infrastructure

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Database | PostgreSQL | 15+ | ACID compliance, JSON support, robust |
| Migration Tool | Prisma Migrate | Latest | Version-controlled schema changes |
| Reverse Proxy | Nginx | Latest | SSL termination, static files, load balancing |
| Process Manager | PM2 | Latest | Production process management |
| Containerization | Docker | Latest | Consistent environments, easy deployment |

### 2.4 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| lint-staged | Pre-commit checks |
| Jest | Unit testing |
| Playwright | E2E testing |
| GitHub Actions | CI/CD |

---

## 3. Project Structure

### 3.1 Monorepo Structure

```
benocode-website/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # Next.js 14 App Router
│   │   ├── (public)/         # Public routes
│   │   │   ├── [locale]/    # Localized routes
│   │   │   └── admin/        # Admin panel routes
│   │   └── api/              # API routes (if needed)
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   ├── sections/        # Page sections
│   │   └── admin/           # Admin-specific components
│   ├── lib/                 # Utilities and helpers
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management stores
│   ├── types/               # TypeScript type definitions
│   ├── styles/              # Global styles
│   └── public/              # Static assets
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models (Prisma)
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── config/          # Configuration files
│   ├── prisma/              # Prisma schema and migrations
│   └── tests/               # Backend tests
├── shared/                  # Shared code between frontend/backend
│   ├── types/              # Shared TypeScript types
│   └── schemas/            # Shared Zod validation schemas
├── docker/                 # Docker configuration files
├── docs/                   # Documentation
├── .github/                # GitHub Actions workflows
├── docker-compose.yml      # Local development environment
└── README.md               # Project documentation
```

### 3.2 Directory Naming Conventions

- **Use kebab-case** for directories: `user-profile/`, `contact-form/`
- **Use PascalCase** for component files: `ContactForm.tsx`, `UserProfile.tsx`
- **Use camelCase** for utility files: `formatDate.ts`, `apiClient.ts`
- **Use UPPER_SNAKE_CASE** for constants: `API_ENDPOINTS.ts`, `ERROR_MESSAGES.ts`

---

## 4. Frontend Architecture

### 4.1 Next.js App Router Structure

The application uses Next.js 14 App Router with the following structure:

```
app/
├── (public)/                    # Public website routes
│   └── [locale]/               # Localized routes
│       ├── layout.tsx          # Public layout
│       ├── page.tsx            # Home page (SPA sections)
│       ├── gdpr/
│       │   └── page.tsx        # GDPR page
│       ├── privacy/
│       │   └── page.tsx        # Privacy Policy
│       └── terms/
│           └── page.tsx        # Terms of Service
├── admin/                      # Admin panel routes
│   ├── layout.tsx              # Admin layout (protected)
│   ├── login/
│   │   └── page.tsx            # Admin login
│   ├── dashboard/
│   │   └── page.tsx            # Admin dashboard
│   ├── leads/
│   │   └── page.tsx            # Lead management
│   ├── testimonials/
│   │   └── page.tsx            # Testimonials management
│   └── settings/
│       └── page.tsx            # Site settings
└── api/                        # API routes (if needed for server-side)
```

### 4.2 Component Architecture

#### Component Hierarchy

```
Page Component
├── Layout Component
│   ├── Header Component
│   ├── Main Content
│   └── Footer Component
└── Section Components
    ├── Hero Section
    ├── Services Section
    ├── Testimonials Section
    └── Contact Section
```

#### Component Categories

1. **UI Components** (`components/ui/`): Reusable, generic components
   - Buttons, Inputs, Cards, Modals, etc.
   - Should be fully typed and documented
   - No business logic, only presentation

2. **Layout Components** (`components/layout/`): Page structure components
   - Header, Footer, Sidebar, Navigation
   - Handle layout-specific logic

3. **Section Components** (`components/sections/`): Page sections
   - HeroSection, ServicesSection, TestimonialsSection
   - Contain business logic and API calls

4. **Admin Components** (`components/admin/`): Admin-specific components
   - Data tables, forms, dashboards
   - Protected routes only

### 4.3 State Management Strategy

#### Client State
- **Local Component State**: Use `useState` for simple, isolated state
- **Form State**: Use `react-hook-form` for all forms
- **Global UI State**: Use Zustand for theme, modals, notifications

#### Server State
- **Data Fetching**: Use React Query (TanStack Query) for:
  - API data fetching
  - Caching
  - Background refetching
  - Optimistic updates

#### Example Store Structure

```typescript
// stores/uiStore.ts
interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
}
```

### 4.4 Data Fetching Patterns

#### Server Components (Default)
- Use Server Components for static content and initial data
- Fetch data directly in Server Components using Prisma client

#### Client Components
- Use React Query for dynamic, client-side data fetching
- Implement proper loading and error states
- Use optimistic updates for better UX

#### Example Pattern

```typescript
// app/[locale]/page.tsx (Server Component)
import { getTestimonials } from '@/lib/api/testimonials';

export default async function HomePage() {
  const testimonials = await getTestimonials();
  return <TestimonialsSection initialData={testimonials} />;
}

// components/sections/TestimonialsSection.tsx (Client Component)
'use client';
import { useQuery } from '@tanstack/react-query';

export function TestimonialsSection({ initialData }) {
  const { data } = useQuery({
    queryKey: ['testimonials'],
    queryFn: fetchTestimonials,
    initialData,
  });
  // ...
}
```

### 4.5 Styling Guidelines

#### Tailwind CSS Usage
- Use utility classes for styling
- Create reusable component classes using `@apply` sparingly
- Use CSS variables for theme colors
- Follow mobile-first responsive design

#### Design System

```css
/* styles/globals.css */
:root {
  --color-primary: #001f3f;      /* Navy blue */
  --color-primary-light: #003d7a;
  --color-primary-dark: #001529;
  --color-secondary: #ffffff;
  --color-accent: #0074d9;
  --color-text: #333333;
  --color-text-light: #666666;
  --spacing-unit: 0.25rem;      /* 4px base */
}
```

#### Responsive Breakpoints

```typescript
// Tailwind default breakpoints
const breakpoints = {
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### 4.6 Form Handling

#### Standard Form Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 4.7 Accessibility Requirements

#### WCAG 2.1 Level AA Compliance

1. **Semantic HTML**: Use proper HTML5 semantic elements
2. **ARIA Labels**: Add ARIA labels for interactive elements
3. **Keyboard Navigation**: All interactive elements must be keyboard accessible
4. **Focus Management**: Visible focus indicators
5. **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
6. **Alt Text**: All images must have descriptive alt text
7. **Form Labels**: All form inputs must have associated labels
8. **Error Messages**: Clear, accessible error messages

#### Example Accessible Component

```typescript
<button
  type="button"
  aria-label="Close modal"
  aria-describedby="modal-description"
  className="focus:outline-none focus:ring-2 focus:ring-primary"
>
  <span aria-hidden="true">×</span>
</button>
```

---

## 5. Backend Architecture

### 5.1 Project Structure

```
backend/src/
├── index.ts                 # Application entry point
├── app.ts                   # Express app configuration
├── controllers/             # Request handlers
│   ├── auth.controller.ts
│   ├── leads.controller.ts
│   ├── testimonials.controller.ts
│   └── content.controller.ts
├── services/                # Business logic layer
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── leads.service.ts
│   └── testimonials.service.ts
├── routes/                  # Route definitions
│   ├── auth.routes.ts
│   ├── leads.routes.ts
│   └── api.routes.ts
├── middleware/              # Express middleware
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── models/                  # Prisma models (schema.prisma)
├── utils/                   # Utility functions
│   ├── logger.ts
│   ├── errors.ts
│   └── validators.ts
├── types/                   # TypeScript type definitions
└── config/                  # Configuration
    ├── database.ts
    ├── env.ts
    └── constants.ts
```

### 5.2 Layered Architecture

```
Request
  ↓
Routes Layer (routes/)
  ↓
Middleware Layer (auth, validation, rate limiting)
  ↓
Controller Layer (controllers/)
  ↓
Service Layer (services/)
  ↓
Model Layer (Prisma)
  ↓
Database
```

### 5.3 Controller Pattern

Controllers handle HTTP requests and responses. They should be thin and delegate business logic to services.

```typescript
// controllers/testimonials.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TestimonialsService } from '../services/testimonials.service';
import { CreateTestimonialDto } from '../types/testimonials.types';

export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { locale } = req.query;
      const testimonials = await this.testimonialsService.getAll(locale as string);
      res.json({ data: testimonials });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateTestimonialDto = req.body;
      const testimonial = await this.testimonialsService.create(dto);
      res.status(201).json({ data: testimonial });
    } catch (error) {
      next(error);
    }
  }
}
```

### 5.4 Service Pattern

Services contain business logic and interact with the database through Prisma.

```typescript
// services/testimonials.service.ts
import { PrismaClient } from '@prisma/client';
import { CreateTestimonialDto } from '../types/testimonials.types';

export class TestimonialsService {
  constructor(private prisma: PrismaClient) {}

  async getAll(locale?: string) {
    return this.prisma.testimonial.findMany({
      where: locale ? { locale } : undefined,
      orderBy: { order: 'asc' },
      include: { translations: true },
    });
  }

  async create(dto: CreateTestimonialDto) {
    // Business logic validation
    // Database operations
    return this.prisma.testimonial.create({
      data: {
        // Map DTO to Prisma model
      },
    });
  }
}
```

### 5.5 Error Handling

#### Custom Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super(401, 'Unauthorized');
  }
}
```

#### Error Middleware

```typescript
// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);

  res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
}
```

### 5.6 Request Validation

Use Zod schemas for request validation, shared with frontend.

```typescript
// shared/schemas/testimonials.schema.ts
import { z } from 'zod';

export const createTestimonialSchema = z.object({
  name: z.string().min(2),
  role: z.string().optional(),
  company: z.string().optional(),
  content: z.string().min(10),
  locale: z.enum(['en', 'sk', 'de', 'cz']),
  order: z.number().int().positive().optional(),
});

// middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      next(error);
    }
  };
}

// Usage in routes
router.post(
  '/testimonials',
  authMiddleware,
  validate(createTestimonialSchema),
  testimonialsController.create
);
```

### 5.7 Environment Configuration

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BREVO_API_KEY: z.string(),
  BREVO_SENDER_EMAIL: z.string().email(),
  CORS_ORIGIN: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## 6. Database Design

### 6.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          UserRole @default(ADMIN)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  @@map("users")
}

enum UserRole {
  ADMIN
  EDITOR  // For future use
}

// Content Management
model Content {
  id        String   @id @default(cuid())
  key       String   @unique // e.g., "hero.title", "services.description"
  type      ContentType
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  translations ContentTranslation[]

  @@map("content")
}

enum ContentType {
  TEXT
  RICH_TEXT
  HTML
  JSON
}

model ContentTranslation {
  id        String   @id @default(cuid())
  contentId String
  locale    Locale
  value     String   @db.Text
  
  content   Content  @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  @@unique([contentId, locale])
  @@map("content_translations")
}

// Testimonials
model Testimonial {
  id        String   @id @default(cuid())
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  translations TestimonialTranslation[]

  @@map("testimonials")
}

model TestimonialTranslation {
  id            String   @id @default(cuid())
  testimonialId String
  locale        Locale
  name          String
  role          String?
  company       String?
  content       String   @db.Text
  
  testimonial   Testimonial @relation(fields: [testimonialId], references: [id], onDelete: Cascade)
  
  @@unique([testimonialId, locale])
  @@map("testimonial_translations")
}

// Leads (Contact Form Submissions)
model Lead {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  message   String   @db.Text
  status    LeadStatus @default(NEW)
  source    String   @default("contact_form")
  metadata  Json?    // Additional data (IP, user agent, etc.)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("leads")
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CLOSED
}

// Meeting Bookings
model Meeting {
  id            String        @id @default(cuid())
  email         String
  name          String
  phone         String?
  scheduledAt   DateTime
  duration      Int           @default(30) // minutes
  timezone      String        @default("UTC")
  status        MeetingStatus @default(CONFIRMED)
  notes         String?       @db.Text
  confirmationToken String    @unique
  cancelledAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  @@map("meetings")
}

enum MeetingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

// Meeting Availability Configuration
model MeetingAvailability {
  id          String   @id @default(cuid())
  dayOfWeek   Int      // 0 = Sunday, 6 = Saturday
  startTime   String   // HH:mm format
  endTime     String   // HH:mm format
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([dayOfWeek, startTime, endTime])
  @@map("meeting_availability")
}

// Social Media Links
model SocialLink {
  id        String   @id @default(cuid())
  platform  String   // e.g., "facebook", "linkedin", "twitter"
  url       String   @db.Text
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("social_links")
}

// External Links
model ExternalLink {
  id        String   @id @default(cuid())
  label     String
  url       String   @db.Text
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("external_links")
}

// Legal Pages Content
model LegalPage {
  id        String   @id @default(cuid())
  slug      String   @unique // e.g., "gdpr", "privacy", "terms"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  translations LegalPageTranslation[]

  @@map("legal_pages")
}

model LegalPageTranslation {
  id          String   @id @default(cuid())
  legalPageId String
  locale      Locale
  title       String
  content     String   @db.Text
  
  legalPage   LegalPage @relation(fields: [legalPageId], references: [id], onDelete: Cascade)
  
  @@unique([legalPageId, locale])
  @@map("legal_page_translations")
}

enum Locale {
  EN
  SK
  DE
  CZ
}
```

### 6.2 Database Indexes

```prisma
// Add indexes for performance
model Lead {
  // ... fields ...
  
  @@index([status])
  @@index([createdAt])
  @@index([email])
}

model Meeting {
  // ... fields ...
  
  @@index([scheduledAt])
  @@index([status])
  @@index([email])
}

model Testimonial {
  // ... fields ...
  
  @@index([isActive, order])
}
```

### 6.3 Migration Strategy

1. **Development**: Use Prisma Migrate for schema changes
2. **Version Control**: All migrations committed to Git
3. **Production**: Run migrations as part of deployment process
4. **Rollback**: Keep migration history for rollback capability

```bash
# Create migration
npx prisma migrate dev --name add_testimonials_table

# Apply migrations in production
npx prisma migrate deploy
```

---

## 7. API Design

### 7.1 RESTful API Conventions

#### Base URL Structure
```
https://api.benocode.sk/v1
```

#### HTTP Methods
- `GET`: Retrieve resources
- `POST`: Create resources
- `PUT`: Update entire resource
- `PATCH`: Partial update
- `DELETE`: Delete resource

#### Status Codes
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Business logic error
- `500 Internal Server Error`: Server error

### 7.2 API Endpoints

#### Authentication
```
POST   /api/v1/auth/login          # Admin login
POST   /api/v1/auth/logout         # Logout
POST   /api/v1/auth/refresh        # Refresh token
GET    /api/v1/auth/me             # Get current user
```

#### Public Endpoints
```
GET    /api/v1/content             # Get all content (with locale)
GET    /api/v1/testimonials        # Get active testimonials
POST   /api/v1/leads               # Submit contact form
POST   /api/v1/meetings            # Book a meeting
GET    /api/v1/meetings/availability # Get available time slots
GET    /api/v1/legal/:slug         # Get legal page content
GET    /api/v1/social-links        # Get social media links
GET    /api/v1/external-links      # Get external links
```

#### Admin Endpoints (Protected)
```
# Leads Management
GET    /api/v1/admin/leads         # List all leads
GET    /api/v1/admin/leads/:id     # Get lead details
PATCH  /api/v1/admin/leads/:id     # Update lead status
DELETE /api/v1/admin/leads/:id    # Delete lead
GET    /api/v1/admin/leads/export  # Export leads (CSV)

# Testimonials Management
GET    /api/v1/admin/testimonials  # List all testimonials
POST   /api/v1/admin/testimonials  # Create testimonial
GET    /api/v1/admin/testimonials/:id # Get testimonial
PUT    /api/v1/admin/testimonials/:id # Update testimonial
DELETE /api/v1/admin/testimonials/:id # Delete testimonial
PATCH  /api/v1/admin/testimonials/:id/order # Update order

# Content Management
GET    /api/v1/admin/content       # List all content
PUT    /api/v1/admin/content/:key  # Update content
POST   /api/v1/admin/content       # Create content

# Meeting Management
GET    /api/v1/admin/meetings      # List all meetings
GET    /api/v1/admin/meetings/:id  # Get meeting details
PATCH  /api/v1/admin/meetings/:id  # Update meeting
DELETE /api/v1/admin/meetings/:id # Cancel meeting
GET    /api/v1/admin/meetings/availability # Get availability config
PUT    /api/v1/admin/meetings/availability # Update availability

# Legal Pages
GET    /api/v1/admin/legal-pages   # List legal pages
PUT    /api/v1/admin/legal-pages/:slug # Update legal page

# Social & External Links
GET    /api/v1/admin/social-links  # List social links
POST   /api/v1/admin/social-links  # Create social link
PUT    /api/v1/admin/social-links/:id # Update social link
DELETE /api/v1/admin/social-links/:id # Delete social link

# External Links
GET    /api/v1/admin/external-links # List external links
POST   /api/v1/admin/external-links # Create external link
PUT    /api/v1/admin/external-links/:id # Update external link
DELETE /api/v1/admin/external-links/:id # Delete external link
```

### 7.3 Request/Response Format

#### Standard Request Format
```typescript
// Headers
Authorization: Bearer <token>
Content-Type: application/json
Accept-Language: en

// Query Parameters
?locale=en&page=1&limit=10&sort=createdAt&order=desc
```

#### Standard Response Format
```typescript
// Success Response
{
  "data": {
    // Resource data
  },
  "meta": {  // Optional, for paginated responses
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// Error Response
{
  "error": {
    "message": "Error message",
    "statusCode": 400,
    "details": {  // Optional, for validation errors
      "field": ["Error message"]
    }
  }
}
```

#### Example API Responses

```typescript
// GET /api/v1/testimonials?locale=en
{
  "data": [
    {
      "id": "clx123",
      "name": "John Doe",
      "role": "CEO",
      "company": "Acme Corp",
      "content": "Great service!",
      "order": 1
    }
  ]
}

// POST /api/v1/leads
{
  "data": {
    "id": "clx456",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "message": "Interested in your services",
    "status": "NEW",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}

// Error Response
{
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "details": {
      "email": ["Invalid email address"],
      "message": ["Message is required"]
    }
  }
}
```

### 7.4 API Versioning

- Use URL versioning: `/api/v1/`
- Increment version for breaking changes
- Maintain backward compatibility when possible
- Document deprecation timeline

### 7.5 Rate Limiting

```typescript
// Different limits for different endpoints
const rateLimitConfig = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5, // login attempts
  },
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // contact form submissions
  },
};
```

---

## 8. Authentication & Authorization

### 8.1 Authentication Strategy

#### JWT-Based Authentication

```typescript
// Token Structure
{
  "userId": "clx123",
  "email": "admin@benocode.sk",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234567890 + 7 * 24 * 60 * 60 // 7 days
}
```

#### Authentication Flow

1. **Login**: User submits email/password
2. **Validation**: Backend validates credentials
3. **Token Generation**: Backend generates JWT access token and refresh token
4. **Response**: Tokens sent to client
5. **Storage**: Client stores tokens (httpOnly cookies recommended)
6. **Request**: Client includes token in Authorization header
7. **Verification**: Backend verifies token on each request
8. **Refresh**: Client uses refresh token to get new access token

### 8.2 Implementation

#### Login Endpoint

```typescript
// POST /api/v1/auth/login
{
  "email": "admin@benocode.sk",
  "password": "securePassword123"
}

// Response
{
  "data": {
    "user": {
      "id": "clx123",
      "email": "admin@benocode.sk",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800 // 7 days in seconds
  }
}
```

#### Auth Middleware

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    throw new UnauthorizedError();
  }
}
```

#### Password Hashing

```typescript
// Use bcrypt for password hashing
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 8.3 Authorization

#### Role-Based Access Control (RBAC)

```typescript
// middleware/authorize.middleware.ts
export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}

// Usage
router.delete(
  '/users/:id',
  authMiddleware,
  authorize('ADMIN'),
  usersController.delete
);
```

---

## 9. Multi-Language Implementation

### 9.1 Internationalization Strategy

#### Frontend (next-intl)

```typescript
// i18n/config.ts
export const locales = ['en', 'sk', 'de', 'cz'] as const;
export const defaultLocale = 'en' as const;
export type Locale = typeof locales[number];

// messages/en.json
{
  "common": {
    "welcome": "Welcome",
    "contact": "Contact Us"
  },
  "hero": {
    "title": "BenoCode - Software Solutions",
    "subtitle": "Reliable, Affordable, Individual Approach"
  }
}
```

#### URL Structure

```
/en/              # English homepage
/sk/              # Slovak homepage
/de/              # German homepage
/cz/              # Czech homepage
/en/gdpr          # English GDPR page
/sk/gdpr          # Slovak GDPR page
```

#### Implementation Pattern

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

// components/LanguageSwitcher.tsx
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <select value={locale} onChange={(e) => switchLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="sk">Slovenčina</option>
      <option value="de">Deutsch</option>
      <option value="cz">Čeština</option>
    </select>
  );
}
```

### 9.2 Backend Localization

#### Content Retrieval

```typescript
// services/content.service.ts
export class ContentService {
  async getContent(key: string, locale: string) {
    const content = await this.prisma.content.findUnique({
      where: { key },
      include: {
        translations: {
          where: { locale: locale.toUpperCase() },
        },
      },
    });

    return content?.translations[0]?.value || null;
  }
}
```

#### API Locale Handling

```typescript
// Middleware to extract locale from request
export function localeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const locale = 
    req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
    req.query.locale ||
    'en';
  
  req.locale = locale;
  next();
}
```

### 9.3 Database Localization Pattern

All translatable content uses the translation table pattern:

- **Main Table**: Stores non-translatable fields (id, order, isActive, etc.)
- **Translation Table**: Stores locale-specific content (name, content, title, etc.)

This pattern ensures:
- Easy addition of new languages
- Consistent data structure
- Efficient queries with proper indexing

---

## 10. Integration Specifications

### 10.1 Brevo Email Integration

#### Configuration

```typescript
// services/email.service.ts
import { SibApiV3Sdk } from '@getbrevo/brevo';

export class EmailService {
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

  constructor() {
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );
  }

  async sendContactFormNotification(lead: Lead) {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = 'New Contact Form Submission';
    sendSmtpEmail.htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Message:</strong> ${lead.message}</p>
    `;
    sendSmtpEmail.sender = {
      name: 'BenoCode Website',
      email: process.env.BREVO_SENDER_EMAIL!,
    };
    sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL! }];

    return this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }

  async sendMeetingConfirmation(meeting: Meeting) {
    // Similar implementation for meeting confirmations
  }
}
```

#### Email Templates

Store email templates in the database or as template files:

```typescript
// templates/meeting-confirmation.hbs
<h1>Meeting Confirmed</h1>
<p>Hello {{name}},</p>
<p>Your meeting is scheduled for {{scheduledAt}}.</p>
<p>Meeting details:</p>
<ul>
  <li>Date: {{date}}</li>
  <li>Time: {{time}}</li>
  <li>Duration: {{duration}} minutes</li>
</ul>
```

### 10.2 Calendar Integration (Future)

For meeting scheduling, consider integrating with:
- Google Calendar API
- Outlook Calendar API
- Cal.com API

Implementation should be abstracted behind an interface:

```typescript
// interfaces/calendar.interface.ts
export interface CalendarService {
  createEvent(meeting: Meeting): Promise<string>;
  updateEvent(eventId: string, meeting: Meeting): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  getAvailability(startDate: Date, endDate: Date): Promise<TimeSlot[]>;
}
```

### 10.3 Analytics Integration

#### Google Analytics 4

```typescript
// lib/analytics.ts
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_path: url,
    });
  }
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

---

## 11. Security Requirements

### 11.1 Security Checklist

#### Input Validation & Sanitization
- ✅ Validate all user inputs using Zod schemas
- ✅ Sanitize HTML content to prevent XSS
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Validate file uploads (type, size, content)

#### Authentication & Authorization
- ✅ Use strong password requirements (min 12 chars, complexity)
- ✅ Implement rate limiting on auth endpoints
- ✅ Use httpOnly cookies for token storage (recommended)
- ✅ Implement token refresh mechanism
- ✅ Hash passwords with bcrypt (12 rounds minimum)

#### Data Protection
- ✅ Encrypt sensitive data at rest
- ✅ Use HTTPS for all communications
- ✅ Implement CORS properly
- ✅ Sanitize error messages (don't expose internal details)
- ✅ Implement CSRF protection

#### GDPR Compliance
- ✅ Cookie consent banner
- ✅ Privacy policy page
- ✅ Data export functionality
- ✅ Data deletion functionality
- ✅ Consent tracking
- ✅ Data retention policies

### 11.2 Security Headers

```typescript
// middleware/security.middleware.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

### 11.3 Input Sanitization

```typescript
// utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href'],
  });
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
```

### 11.4 File Upload Security

```typescript
// middleware/upload.middleware.ts
import multer from 'multer';
import { extname } from 'path';

const ALLOWED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = extname(file.originalname).toLowerCase();
  if (ALLOWED_FILE_TYPES.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
```

---

## 12. Coding Standards & Best Practices

### 12.1 TypeScript Guidelines

#### Type Safety
- ✅ Use strict TypeScript configuration
- ✅ Avoid `any` type - use `unknown` if type is truly unknown
- ✅ Define interfaces/types for all data structures
- ✅ Use type guards for runtime type checking

#### Code Organization
- ✅ One class/interface per file
- ✅ Use barrel exports (`index.ts`) for clean imports
- ✅ Group related functionality together
- ✅ Keep functions small and focused (single responsibility)

#### Example

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function isAdmin(user: User): boolean {
  return user.role === 'ADMIN';
}

// ❌ Bad
function processUser(user: any): any {
  // ...
}
```

### 12.2 Naming Conventions

#### Variables & Functions
- **camelCase** for variables and functions: `getUserById`, `isValidEmail`
- **PascalCase** for classes and interfaces: `UserService`, `ApiResponse`
- **UPPER_SNAKE_CASE** for constants: `MAX_FILE_SIZE`, `API_BASE_URL`
- **Descriptive names**: `userEmail` not `email`, `isAuthenticated` not `auth`

#### Files & Directories
- **kebab-case** for directories: `user-profile/`, `contact-form/`
- **PascalCase** for React components: `ContactForm.tsx`
- **camelCase** for utilities: `formatDate.ts`, `apiClient.ts`

### 12.3 Code Style

#### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 12.4 Error Handling

#### Frontend Error Handling

```typescript
// ✅ Good - Proper error handling
try {
  const data = await api.createLead(formData);
  toast.success('Message sent successfully!');
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
    logger.error(error);
  }
}

// ❌ Bad - Silent failures
const data = await api.createLead(formData);
```

#### Backend Error Handling

```typescript
// ✅ Good - Use custom error classes
if (!user) {
  throw new NotFoundError('User');
}

if (!hasPermission(user, 'DELETE_LEAD')) {
  throw new ForbiddenError();
}

// ❌ Bad - Generic errors
throw new Error('Something went wrong');
```

### 12.5 Code Comments

#### When to Comment
- ✅ Complex business logic
- ✅ Non-obvious algorithms
- ✅ Workarounds for third-party issues
- ✅ Public API documentation

#### When NOT to Comment
- ❌ Self-explanatory code
- ❌ Comments that duplicate code
- ❌ Outdated comments

```typescript
// ✅ Good
// Calculate discount based on customer tier and order volume
// Tier 1: 5%, Tier 2: 10%, Tier 3: 15%
const discount = calculateDiscount(customer.tier, order.volume);

// ❌ Bad
// Set discount to 10
const discount = 10;
```

### 12.6 Testing Best Practices

#### Test Structure
- **Unit Tests**: Test individual functions/components in isolation
- **Integration Tests**: Test API endpoints with database
- **E2E Tests**: Test critical user flows

#### Test Naming
```typescript
describe('TestimonialsService', () => {
  describe('getAll', () => {
    it('should return all active testimonials', () => {
      // ...
    });

    it('should filter by locale when provided', () => {
      // ...
    });
  });
});
```

### 12.7 Git Commit Messages

Follow Conventional Commits:

```
feat: add testimonial management API
fix: resolve timezone issue in meeting booking
docs: update API documentation
style: format code with prettier
refactor: extract email service to separate module
test: add unit tests for lead service
chore: update dependencies
```

---

## 13. Development Workflow

### 13.1 Git Workflow

#### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches (e.g., `feature/testimonials-crud`)
- `fix/*`: Bug fix branches (e.g., `fix/email-validation`)
- `hotfix/*`: Critical production fixes

#### Pull Request Process
1. Create feature branch from `develop`
2. Make changes and commit following conventions
3. Push branch and create PR
4. Code review required (at least one approval)
5. Run CI/CD pipeline
6. Merge to `develop`
7. Deploy to staging for testing
8. Merge `develop` to `main` for production

### 13.2 Development Environment Setup

#### Prerequisites
- Node.js 20.x LTS
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- Git

#### Setup Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd benocode-website

# 2. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
cd backend
npx prisma migrate dev
npx prisma generate

# 5. Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 13.3 Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/benocode
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@benocode.sk
ADMIN_EMAIL=admin@benocode.sk
CORS_ORIGIN=http://localhost:3000
```

### 13.4 Code Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] No console.logs or debug code

#### Code Quality
- [ ] Follows coding standards
- [ ] Properly typed (TypeScript)
- [ ] No code duplication
- [ ] Functions are focused and testable

#### Security
- [ ] Input validation implemented
- [ ] No sensitive data exposed
- [ ] Authentication/authorization correct
- [ ] SQL injection prevention (Prisma handles this)

#### Performance
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Proper indexing used
- [ ] Images optimized

#### Testing
- [ ] Unit tests added/updated
- [ ] Tests pass
- [ ] Edge cases tested

---

## 14. Testing Strategy

### 14.1 Testing Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\
     /      \    Integration Tests (Some)
    /________\
   /          \  Unit Tests (Many)
  /____________\
```

### 14.2 Unit Tests

#### Frontend Unit Tests (Jest + React Testing Library)

```typescript
// components/__tests__/ContactForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '../ContactForm';

describe('ContactForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<ContactForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/message/i), 'Test message');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
      });
    });
  });
});
```

#### Backend Unit Tests (Jest)

```typescript
// services/__tests__/testimonials.service.test.ts
import { TestimonialsService } from '../testimonials.service';
import { PrismaClient } from '@prisma/client';

describe('TestimonialsService', () => {
  let service: TestimonialsService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    service = new TestimonialsService(prisma);
  });

  it('should return all active testimonials', async () => {
    const testimonials = await service.getAll('en');
    expect(testimonials).toBeDefined();
    expect(Array.isArray(testimonials)).toBe(true);
  });
});
```

### 14.3 Integration Tests

```typescript
// tests/integration/leads.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('POST /api/v1/leads', () => {
  it('should create a new lead', async () => {
    const response = await request(app)
      .post('/api/v1/leads')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Interested in your services',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe('john@example.com');
  });

  it('should return 400 for invalid email', async () => {
    await request(app)
      .post('/api/v1/leads')
      .send({
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Test',
      })
      .expect(400);
  });
});
```

### 14.4 E2E Tests (Playwright)

```typescript
// tests/e2e/contact-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should submit contact form successfully', async ({ page }) => {
    await page.goto('/en');
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="message"]', 'Test message');
    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### 14.5 Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

---

## 15. Deployment Strategy

### 15.1 Deployment Architecture

```
Internet
  ↓
Nginx (Reverse Proxy)
  ├── SSL Termination
  ├── Static Files (Frontend)
  └── Proxy to Backend API
      ↓
Backend API (Node.js/Express)
  ↓
PostgreSQL Database
```

### 15.2 Docker Configuration

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: benocode
      POSTGRES_USER: benocode
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://benocode:${DB_PASSWORD}@postgres:5432/benocode
      NODE_ENV: production
    depends_on:
      - postgres
    ports:
      - "3001:3001"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### 15.3 Nginx Configuration

```nginx
# /etc/nginx/sites-available/benocode
server {
    listen 80;
    server_name benocode.sk www.benocode.sk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name benocode.sk www.benocode.sk;

    ssl_certificate /etc/letsencrypt/live/benocode.sk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/benocode.sk/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /_next/static {
        alias /var/www/benocode/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 15.4 Deployment Process

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates valid
- [ ] Backup current database

#### Deployment Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run database migrations
cd backend
npx prisma migrate deploy

# 4. Build applications
cd ../frontend && npm run build
cd ../backend && npm run build

# 5. Restart services (using PM2)
pm2 restart benocode-frontend
pm2 restart benocode-backend

# 6. Verify deployment
curl https://benocode.sk/api/v1/health
```

### 15.5 PM2 Configuration

```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'benocode-backend',
      script: './backend/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
    },
    {
      name: 'benocode-frontend',
      script: 'node',
      args: './frontend/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

---

## 16. Performance Optimization

### 16.1 Frontend Optimization

#### Next.js Optimizations
- Use Server Components by default
- Implement proper caching strategies
- Optimize images with Next.js Image component
- Code splitting with dynamic imports
- Static generation where possible

#### Example

```typescript
// Optimize images
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="BenoCode Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>

// Dynamic imports for heavy components
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

### 16.2 Backend Optimization

#### Database Query Optimization
- Use Prisma's `select` to fetch only needed fields
- Implement pagination for list endpoints
- Use database indexes appropriately
- Avoid N+1 queries with `include`

#### Example

```typescript
// ✅ Good - Select only needed fields
const testimonials = await prisma.testimonial.findMany({
  select: {
    id: true,
    order: true,
    translations: {
      where: { locale: 'EN' },
      select: {
        name: true,
        content: true,
      },
    },
  },
});

// ❌ Bad - Fetching all fields
const testimonials = await prisma.testimonial.findMany({
  include: { translations: true },
});
```

#### Caching Strategy

```typescript
// Implement Redis caching for frequently accessed data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedContent(key: string) {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const content = await fetchContentFromDB(key);
  await redis.setex(key, 3600, JSON.stringify(content)); // Cache for 1 hour
  return content;
}
```

### 16.3 Performance Targets

- **Page Load Time**: < 3 seconds (First Contentful Paint)
- **Time to Interactive**: < 5 seconds
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)

---

## 17. Monitoring & Logging

### 17.1 Logging Strategy

#### Structured Logging

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'benocode-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

#### Log Levels
- **ERROR**: Errors that need immediate attention
- **WARN**: Warning messages for potential issues
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information

### 17.2 Error Tracking

#### Sentry Integration (Recommended)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 17.3 Health Checks

```typescript
// routes/health.routes.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await checkDatabase(),
    memory: process.memoryUsage(),
  };

  res.json(health);
});
```

### 17.4 Monitoring Metrics

Track the following metrics:
- API response times
- Error rates
- Database query performance
- Server resource usage (CPU, memory)
- Request rates
- Active user sessions

---

## Appendix A: Development Rules Summary

### Must Follow Rules

1. **TypeScript**: All code must be typed. No `any` without justification.
2. **Code Review**: All code must be reviewed before merging.
3. **Tests**: New features must include tests.
4. **Documentation**: Complex logic must be documented.
5. **Security**: Never commit secrets or credentials.
6. **Error Handling**: Always handle errors properly.
7. **Validation**: Validate all user inputs.
8. **Accessibility**: Follow WCAG 2.1 Level AA standards.
9. **Performance**: Optimize database queries and API calls.
10. **Git**: Use conventional commit messages.

### Code Quality Gates

- ESLint must pass with no errors
- TypeScript compilation must succeed
- All tests must pass
- Code coverage must not decrease
- No security vulnerabilities (npm audit)

---

## Appendix B: Useful Commands

### Development

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run migrate      # Run database migrations
npm run seed         # Seed database
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev --name migration_name
npx prisma generate  # Generate Prisma Client
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e     # E2E tests
```

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024 | Initial specification | Senior Architect |

---

**End of Technical Specification**

