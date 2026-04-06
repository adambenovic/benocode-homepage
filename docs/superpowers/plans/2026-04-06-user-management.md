# User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete user management to the admin panel — CRUD, password management, email invites, forced password change, editor role restrictions.

**Architecture:** Backend follows the existing controller → service → Prisma pattern. New `UsersService` + `UsersController` behind `authorize('ADMIN')`. Auth service gains `isActive` checks, `forcePasswordChange` flag in JWT payload, self-service password change, and invite acceptance. Frontend adds user list/create/edit pages, force-change redirect in admin layout, self-service change-password modal, and sidebar role filtering.

**Tech Stack:** Express 5, Prisma 7, bcrypt, crypto (Node built-in for invite tokens), Brevo email, React 19, Next.js 16, React Query 5, React Hook Form + Zod, Zustand, Tailwind CSS 4.

---

## File Structure

### Backend — New Files
- `backend/src/services/users.service.ts` — User CRUD + invite + stats logic
- `backend/src/controllers/users.controller.ts` — HTTP handlers for user management
- `backend/src/types/users.types.ts` — Zod schemas + DTO interfaces
- `backend/src/__tests__/services/users.service.test.ts` — Unit tests for users service
- `backend/src/__tests__/services/auth.service.change-password.test.ts` — Unit tests for password change + invite accept

### Backend — Modified Files
- `backend/prisma/schema.prisma` — Add fields to User model
- `backend/src/services/auth.service.ts` — isActive check, forcePasswordChange in JWT, changePassword, acceptInvite
- `backend/src/types/auth.types.ts` — Add forcePasswordChange to JwtPayload + LoginResponse
- `backend/src/routes/admin.routes.ts` — Register user management routes
- `backend/src/routes/auth.routes.ts` — Add change-password + accept-invite routes
- `backend/src/services/email.service.ts` — Add invite email method
- `backend/src/config/env.ts` — Add FRONTEND_URL env var

### Frontend — New Files
- `frontend/lib/api/users.ts` — API client for user management
- `frontend/app/admin/users/page.tsx` — User list with stats
- `frontend/app/admin/users/create/page.tsx` — Create user form
- `frontend/app/admin/users/[id]/page.tsx` — Edit user form
- `frontend/app/admin/users/layout.tsx` — Passthrough layout
- `frontend/app/admin/users/create/layout.tsx` — Passthrough layout
- `frontend/app/admin/users/[id]/layout.tsx` — Passthrough layout
- `frontend/app/admin/change-password/page.tsx` — Force password change page
- `frontend/app/admin/accept-invite/page.tsx` — Public invite acceptance page
- `frontend/components/admin/ChangePasswordModal.tsx` — Self-service password change modal

### Frontend — Modified Files
- `frontend/lib/api/auth.ts` — Add changePassword, acceptInvite, User type update
- `frontend/stores/authStore.ts` — Add forcePasswordChange to User type
- `frontend/components/admin/AdminSidebar.tsx` — Conditionally show Users link for ADMIN role
- `frontend/components/admin/AdminHeader.tsx` — Add "Change Password" button
- `frontend/app/admin/layout.tsx` — Force password change redirect + accept-invite bypass

### Note on Shared Package
The `shared/` package exists but is NOT wired into either project's tsconfig paths. Instead of setting up that plumbing, we define validation schemas locally in `backend/src/types/users.types.ts` and use Zod directly in frontend form components (matching the existing pattern where each frontend page defines its own Zod schema inline).

---

## Task 1: Database Migration

**Files:**
- Modify: `backend/prisma/schema.prisma:11-21`

- [ ] **Step 1: Update the User model**

In `backend/prisma/schema.prisma`, replace the User model (lines 11-21):

```prisma
// User Management
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  passwordHash        String?
  role                UserRole  @default(EDITOR)
  isActive            Boolean   @default(true)
  forcePasswordChange Boolean   @default(false)
  inviteToken         String?   @unique
  inviteExpiresAt     DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  lastLoginAt         DateTime?

  @@map("users")
}
```

Changes from current: `passwordHash` now nullable (`String?`), added `isActive`, `forcePasswordChange`, `inviteToken`, `inviteExpiresAt`. Default role changed to `EDITOR`.

- [ ] **Step 2: Create the migration**

Run inside the backend container:

```bash
make shell-be
npx prisma migrate dev --name add-user-management-fields
```

Expected: Migration created and applied. Existing users get `isActive=true`, `forcePasswordChange=false`.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add user management fields to User model"
```

---

## Task 2: (Removed — schemas defined locally per existing patterns)

---

## Task 3: Environment Config

**Files:**
- Modify: `backend/src/config/env.ts`

- [ ] **Step 1: Add FRONTEND_URL to env schema**

In `backend/src/config/env.ts`, add `FRONTEND_URL` to the schema object (after the `CORS_ORIGIN` line):

```typescript
FRONTEND_URL: z.string().url().default('http://localhost:3000'),
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/config/env.ts
git commit -m "feat: add FRONTEND_URL env variable"
```

---

## Task 4: Backend Types

**Files:**
- Create: `backend/src/types/users.types.ts`
- Modify: `backend/src/types/auth.types.ts`

- [ ] **Step 1: Create user management types**

Create `backend/src/types/users.types.ts`:

```typescript
// types/users.types.ts
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'EDITOR']),
  method: z.enum(['password', 'invite']),
  password: passwordSchema.optional(),
}).refine(
  (data) => data.method !== 'password' || (data.password !== undefined && data.password !== ''),
  { message: 'Password is required when method is "password"', path: ['password'] }
);

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'EDITOR']).optional(),
  isActive: z.boolean().optional(),
  forcePasswordChange: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

export const forceChangePasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  invitePending: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface UserStatsResponse {
  total: number;
  admins: number;
  editors: number;
  active: number;
  inactive: number;
}
```

- [ ] **Step 2: Update auth types to include forcePasswordChange**

In `backend/src/types/auth.types.ts`, update `JwtPayload` and `LoginResponse`:

```typescript
// types/auth.types.ts
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    forcePasswordChange: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  forcePasswordChange: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/types/users.types.ts backend/src/types/auth.types.ts
git commit -m "feat: add user management types and update auth types"
```

---

## Task 5: Users Service

**Files:**
- Create: `backend/src/services/users.service.ts`

- [ ] **Step 1: Write the users service test**

Create `backend/src/__tests__/services/users.service.test.ts`:

```typescript
// __tests__/services/users.service.test.ts
import { UsersService } from '../../services/users.service';
import { ValidationError, NotFoundError } from '../../utils/errors';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

const mockEmailService = {
  sendInviteEmail: jest.fn(),
};

jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(mockPrisma as any, mockEmailService as any);
  });

  describe('create', () => {
    it('should create a user with password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        role: 'EDITOR',
        isActive: true,
        forcePasswordChange: true,
        inviteToken: null,
        inviteExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });

      const result = await service.create({
        email: 'new@example.com',
        role: 'EDITOR',
        method: 'password',
        password: 'SecurePass123!@',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.invitePending).toBe(false);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            role: 'EDITOR',
            forcePasswordChange: true,
          }),
        })
      );
    });

    it('should create a user with invite', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: 'invited@example.com',
        passwordHash: null,
        role: 'EDITOR',
        isActive: true,
        forcePasswordChange: false,
        inviteToken: 'hashed-token',
        inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });

      const result = await service.create({
        email: 'invited@example.com',
        role: 'EDITOR',
        method: 'invite',
      });

      expect(result.invitePending).toBe(true);
      expect(mockEmailService.sendInviteEmail).toHaveBeenCalled();
    });

    it('should throw ValidationError if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' });

      await expect(
        service.create({
          email: 'existing@example.com',
          role: 'EDITOR',
          method: 'password',
          password: 'SecurePass123!@',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        role: 'ADMIN',
        isActive: true,
        forcePasswordChange: false,
        inviteToken: null,
        inviteExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });

      const result = await service.getById('1');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const existing = {
        id: '1',
        email: 'test@example.com',
        role: 'EDITOR',
        isActive: true,
        forcePasswordChange: false,
        inviteToken: null,
        inviteExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      mockPrisma.user.findUnique.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue({ ...existing, role: 'ADMIN' });

      const result = await service.update('1', { role: 'ADMIN' }, 'other-user-id');
      expect(result.role).toBe('ADMIN');
    });

    it('should prevent self-deactivation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
      });

      await expect(
        service.update('1', { isActive: false }, '1')
      ).rejects.toThrow(ValidationError);
    });

    it('should prevent self role change', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
      });

      await expect(
        service.update('1', { role: 'EDITOR' }, '1')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '2',
        email: 'editor@example.com',
        isActive: true,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: '2',
        email: 'editor@example.com',
        isActive: false,
        role: 'EDITOR',
        forcePasswordChange: false,
        inviteToken: null,
        inviteExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });

      const result = await service.deactivate('2', 'admin-id');
      expect(result.isActive).toBe(false);
    });

    it('should prevent self-deactivation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', isActive: true });

      await expect(service.deactivate('1', '1')).rejects.toThrow(ValidationError);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
make shell-be
npx jest src/__tests__/services/users.service.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../services/users.service'`

- [ ] **Step 3: Implement the users service**

Create `backend/src/services/users.service.ts`:

```typescript
// services/users.service.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashPassword } from '../utils/password';
import { NotFoundError, ValidationError } from '../utils/errors';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponse,
  UserStatsResponse,
} from '../types/users.types';
import { EmailService } from './email.service';
import { env } from '../config/env';

export class UsersService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService
  ) {}

  async getAll(
    skip?: number,
    take?: number
  ): Promise<{ data: UserResponse[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => this.mapToResponse(u)),
      total,
    };
  }

  async getStats(): Promise<UserStatsResponse> {
    const [total, admins, editors, active, inactive] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'EDITOR' } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
    ]);

    return { total, admins, editors, active, inactive };
  }

  async getById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.mapToResponse(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ValidationError('A user with this email already exists');
    }

    if (dto.method === 'password') {
      const passwordHash = await hashPassword(dto.password!);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role as any,
          isActive: true,
          forcePasswordChange: true,
        },
      });
      return this.mapToResponse(user);
    }

    // Invite method
    const rawToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        role: dto.role as any,
        isActive: true,
        forcePasswordChange: false,
        inviteToken: hashedToken,
        inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendInviteEmail(dto.email, rawToken);

    return this.mapToResponse(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUserId: string
  ): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }

    if (id === currentUserId) {
      if (dto.isActive === false) {
        throw new ValidationError('You cannot deactivate your own account');
      }
      if (dto.role && dto.role !== existing.role) {
        throw new ValidationError('You cannot change your own role');
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ValidationError('A user with this email already exists');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.forcePasswordChange !== undefined)
      updateData.forcePasswordChange = dto.forcePasswordChange;
    if (dto.password) {
      updateData.passwordHash = await hashPassword(dto.password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(user);
  }

  async deactivate(id: string, currentUserId: string): Promise<UserResponse> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('User');
    }

    if (id === currentUserId) {
      throw new ValidationError('You cannot deactivate your own account');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return this.mapToResponse(user);
  }

  async resendInvite(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User');
    }
    if (user.passwordHash) {
      throw new ValidationError(
        'This user has already set their password'
      );
    }

    const rawToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await this.prisma.user.update({
      where: { id },
      data: {
        inviteToken: hashedToken,
        inviteExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await this.emailService.sendInviteEmail(user.email, rawToken);
  }

  private mapToResponse(user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    forcePasswordChange: boolean;
    inviteToken: string | null;
    inviteExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      forcePasswordChange: user.forcePasswordChange,
      invitePending: user.inviteToken !== null && user.inviteExpiresAt !== null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest src/__tests__/services/users.service.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/users.service.ts backend/src/__tests__/services/users.service.test.ts
git commit -m "feat: add users service with CRUD, invite, and deactivation"
```

---

## Task 6: Auth Service Changes

**Files:**
- Modify: `backend/src/services/auth.service.ts`
- Create: `backend/src/__tests__/services/auth.service.change-password.test.ts`

- [ ] **Step 1: Write the change-password and invite tests**

Create `backend/src/__tests__/services/auth.service.change-password.test.ts`:

```typescript
// __tests__/services/auth.service.change-password.test.ts
import { AuthService } from '../../services/auth.service';
import { prisma } from '../../config/database';
import { verifyPassword, hashPassword } from '../../utils/password';
import { UnauthorizedError, ValidationError, NotFoundError } from '../../utils/errors';
import crypto from 'crypto';

jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('new-hashed-password'),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(() => 'mock-token'),
    verify: jest.fn(),
  },
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(),
}));

describe('AuthService — password management', () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
  });

  describe('changePassword', () => {
    it('should change password when current password is correct', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'old-hash',
        forcePasswordChange: false,
      });
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.changePassword('1', 'OldPassword1!@#', 'NewPassword1!@#');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { passwordHash: 'new-hashed-password', forcePasswordChange: false },
      });
    });

    it('should throw if current password is wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        passwordHash: 'old-hash',
      });
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('1', 'WrongPass1!@#', 'NewPassword1!@#')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('forceChangePassword', () => {
    it('should change password without current password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        forcePasswordChange: true,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.forceChangePassword('1', 'NewPassword1!@#');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { passwordHash: 'new-hashed-password', forcePasswordChange: false },
      });
    });
  });

  describe('acceptInvite', () => {
    it('should set password and clear invite token', async () => {
      const rawToken = 'abc123';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'invited@example.com',
        inviteToken: hashedToken,
        inviteExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.acceptInvite(rawToken, 'NewPassword1!@#');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          passwordHash: 'new-hashed-password',
          inviteToken: null,
          inviteExpiresAt: null,
          forcePasswordChange: false,
        },
      });
    });

    it('should throw if token is expired', async () => {
      const rawToken = 'abc123';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        inviteToken: hashedToken,
        inviteExpiresAt: new Date(Date.now() - 1000), // expired
      });

      await expect(
        service.acceptInvite(rawToken, 'NewPassword1!@#')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw if token not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.acceptInvite('bad-token', 'NewPassword1!@#')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login — isActive check', () => {
    it('should throw if user is deactivated', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hash',
        isActive: false,
        role: 'ADMIN',
      });
      (verifyPassword as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw if password not set (invite pending)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: null,
        isActive: true,
        role: 'EDITOR',
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/__tests__/services/auth.service.change-password.test.ts --no-coverage
```

Expected: FAIL — methods `changePassword`, `forceChangePassword`, `acceptInvite` don't exist yet, and login doesn't check `isActive`.

- [ ] **Step 3: Update the auth service**

Replace `backend/src/services/auth.service.ts` with:

```typescript
// services/auth.service.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { verifyPassword, hashPassword } from '../utils/password';
import { UnauthorizedError, NotFoundError, ValidationError } from '../utils/errors';
import { env } from '../config/env';
import { LoginDto, LoginResponse, JwtPayload } from '../types/auth.types';

export class AuthService {
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedError();
    }

    if (!user.isActive) {
      throw new UnauthorizedError();
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError();
    }

    const isValidPassword = await verifyPassword(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError();
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      forcePasswordChange: user.forcePasswordChange,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError();
      }

      // Generate new tokens with fresh data
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange,
      };

      const newAccessToken = this.generateAccessToken(payload);
      const newRefreshToken = this.generateRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7 * 24 * 60 * 60,
      };
    } catch (error) {
      throw new UnauthorizedError();
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        forcePasswordChange: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash!);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, forcePasswordChange: false },
    });
  }

  async forceChangePassword(userId: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, forcePasswordChange: false },
    });
  }

  async acceptInvite(rawToken: string, password: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: { inviteToken: hashedToken },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired invite token');
    }

    if (!user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      throw new ValidationError('Invalid or expired invite token');
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        inviteToken: null,
        inviteExpiresAt: null,
        forcePasswordChange: false,
      },
    });
  }

  private generateAccessToken(payload: JwtPayload): string {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any,
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest src/__tests__/services/auth.service --no-coverage
```

Expected: PASS (both the existing auth.service.test.ts and the new change-password tests). The existing test may need a minor fix since `login` now checks `isActive` — the mock user needs `isActive: true` and `forcePasswordChange: false`. If the existing test fails, update the mock user in `auth.service.test.ts` to include those fields.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/auth.service.ts backend/src/__tests__/services/auth.service.change-password.test.ts
git commit -m "feat: add password change, invite acceptance, and isActive checks to auth service"
```

---

## Task 7: Email Service — Invite Email

**Files:**
- Modify: `backend/src/services/email.service.ts`

- [ ] **Step 1: Add sendInviteEmail method**

Add this method to the `EmailService` class in `backend/src/services/email.service.ts`, before the `escapeHtml` method:

```typescript
  async sendInviteEmail(email: string, rawToken: string): Promise<void> {
    const inviteUrl = `${env.FRONTEND_URL}/admin/accept-invite?token=${rawToken}`;

    const htmlContent = `
      <h2>You've been invited to BenoCode Admin</h2>
      <p>You've been invited to join the BenoCode admin panel.</p>
      <p>Click the link below to set your password and activate your account:</p>
      <p><a href="${this.escapeHtml(inviteUrl)}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">Set Your Password</a></p>
      <p>Or copy this link: ${this.escapeHtml(inviteUrl)}</p>
      <p>This link expires in 48 hours.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: "You've been invited to BenoCode Admin",
      htmlContent,
    });
  }
```

Also add the import for `env` at the top of the file if not already present:

```typescript
import { env } from '../config/env';
```

(It's already imported — line 1.)

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/email.service.ts
git commit -m "feat: add invite email to email service"
```

---

## Task 8: Users Controller

**Files:**
- Create: `backend/src/controllers/users.controller.ts`

- [ ] **Step 1: Create the users controller**

Create `backend/src/controllers/users.controller.ts`:

```typescript
// controllers/users.controller.ts
import { Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { CreateUserDto, UpdateUserDto } from '../types/users.types';
import { createPaginationMeta } from '../middleware/pagination.middleware';

export class UsersController {
  constructor(private usersService: UsersService) {}

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pagination = (req as any).pagination;
      const [result, stats] = await Promise.all([
        this.usersService.getAll(pagination?.skip, pagination?.limit),
        this.usersService.getStats(),
      ]);

      if (pagination) {
        res.json({
          data: result.data,
          stats,
          meta: createPaginationMeta(pagination.page, pagination.limit, result.total),
        });
      } else {
        res.json({ data: result.data, stats });
      }
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.usersService.getById(id);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto: CreateUserDto = req.body;
      const user = await this.usersService.create(dto);
      res.status(201).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateUserDto = req.body;
      const user = await this.usersService.update(id, dto, req.user!.userId);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await this.usersService.deactivate(id, req.user!.userId);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  async resendInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.usersService.resendInvite(id);
      res.json({ data: { message: 'Invite sent successfully' } });
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/users.controller.ts
git commit -m "feat: add users controller"
```

---

## Task 9: Backend Routes

**Files:**
- Modify: `backend/src/routes/admin.routes.ts`
- Modify: `backend/src/routes/auth.routes.ts`

- [ ] **Step 1: Add user management routes to admin.routes.ts**

At the top of `backend/src/routes/admin.routes.ts`, add imports:

```typescript
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';
import { createUserSchema, updateUserSchema } from '../types/users.types';
```

Before the `// Metrics endpoint` line (around line 110), add:

```typescript
// Users admin routes
const usersService = new UsersService(prisma, emailService);
const usersController = new UsersController(usersService);
router.get('/users', authMiddleware, authorize('ADMIN'), paginationMiddleware, usersController.getAll.bind(usersController));
router.get('/users/:id', authMiddleware, authorize('ADMIN'), usersController.getById.bind(usersController));
router.post('/users', authMiddleware, authorize('ADMIN'), validate(createUserSchema), usersController.create.bind(usersController));
router.put('/users/:id', authMiddleware, authorize('ADMIN'), validate(updateUserSchema), usersController.update.bind(usersController));
router.patch('/users/:id/deactivate', authMiddleware, authorize('ADMIN'), usersController.deactivate.bind(usersController));
router.post('/users/:id/resend-invite', authMiddleware, authorize('ADMIN'), usersController.resendInvite.bind(usersController));
```

- [ ] **Step 2: Add change-password and accept-invite routes to auth.routes.ts**

In `backend/src/routes/auth.routes.ts`, add the imports:

```typescript
import { changePasswordSchema, acceptInviteSchema, forceChangePasswordSchema } from '../types/users.types';
```

Add before `export default router;`:

```typescript
router.post(
  '/change-password',
  authRateLimit,
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

router.post(
  '/force-change-password',
  authRateLimit,
  authMiddleware,
  validate(forceChangePasswordSchema),
  authController.forceChangePassword.bind(authController)
);

router.post(
  '/accept-invite',
  authRateLimit,
  validate(acceptInviteSchema),
  authController.acceptInvite.bind(authController)
);
```

- [ ] **Step 3: Add controller methods to auth.controller.ts**

Add these methods to the `AuthController` class in `backend/src/controllers/auth.controller.ts`:

```typescript
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      }
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(req.user.userId, currentPassword, newPassword);
      res.json({ data: { message: 'Password changed successfully' } });
    } catch (error) {
      return next(error);
    }
  }

  async forceChangePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      }
      const { newPassword } = req.body;
      await this.authService.forceChangePassword(req.user.userId, newPassword);

      // Issue new tokens with forcePasswordChange: false
      const user = await this.authService.getCurrentUser(req.user.userId);
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        forcePasswordChange: false,
      };

      // Re-login essentially — set new cookies
      const jwt = require('jsonwebtoken');
      const { env } = require('../config/env');
      const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
      const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ data: { message: 'Password changed successfully' } });
    } catch (error) {
      return next(error);
    }
  }

  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await this.authService.acceptInvite(token, password);
      res.json({ data: { message: 'Password set successfully. You can now log in.' } });
    } catch (error) {
      return next(error);
    }
  }
```

Add the `AuthRequest` import at the top of the file if not already there (it's used for `req.user`):

```typescript
import { AuthRequest } from '../middleware/auth.middleware';
```

(Already imported on line 4.)

- [ ] **Step 4: Fix existing auth.service.test.ts mock data**

Update the mock user in `backend/src/__tests__/services/auth.service.test.ts` (the `should return tokens on successful login` test) to include the new fields:

```typescript
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'ADMIN' as const,
        isActive: true,
        forcePasswordChange: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
```

Also update the assertion to check for `forcePasswordChange`:

```typescript
      expect(result.user.forcePasswordChange).toBe(false);
```

- [ ] **Step 5: Run all backend tests**

```bash
npx jest --no-coverage --testPathIgnorePatterns=integration
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/admin.routes.ts backend/src/routes/auth.routes.ts backend/src/controllers/auth.controller.ts backend/src/__tests__/services/auth.service.test.ts
git commit -m "feat: add user management and password change routes"
```

---

## Task 10: Frontend API Client

**Files:**
- Create: `frontend/lib/api/users.ts`
- Modify: `frontend/lib/api/auth.ts`

- [ ] **Step 1: Create the users API client**

Create `frontend/lib/api/users.ts`:

```typescript
// lib/api/users.ts
import { apiClient } from './client';

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  invitePending: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface UserStatsResponse {
  total: number;
  admins: number;
  editors: number;
  active: number;
  inactive: number;
}

export interface UsersListResponse {
  data: UserResponse[];
  stats: UserStatsResponse;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  email: string;
  role: 'ADMIN' | 'EDITOR';
  method: 'password' | 'invite';
  password?: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'ADMIN' | 'EDITOR';
  isActive?: boolean;
  forcePasswordChange?: boolean;
  password?: string;
}

export const usersApi = {
  getAll: async (page?: number, limit?: number): Promise<UsersListResponse> => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    return apiClient.get<UsersListResponse>(`/admin/users?${params.toString()}`);
  },

  getById: async (id: string): Promise<{ data: UserResponse }> => {
    return apiClient.get<{ data: UserResponse }>(`/admin/users/${id}`);
  },

  create: async (data: CreateUserRequest): Promise<{ data: UserResponse }> => {
    return apiClient.post<{ data: UserResponse }>('/admin/users', data);
  },

  update: async (id: string, data: UpdateUserRequest): Promise<{ data: UserResponse }> => {
    return apiClient.put<{ data: UserResponse }>(`/admin/users/${id}`, data);
  },

  deactivate: async (id: string): Promise<{ data: UserResponse }> => {
    return apiClient.patch<{ data: UserResponse }>(`/admin/users/${id}/deactivate`);
  },

  resendInvite: async (id: string): Promise<{ data: { message: string } }> => {
    return apiClient.post<{ data: { message: string } }>(`/admin/users/${id}/resend-invite`);
  },
};
```

- [ ] **Step 2: Update auth API client**

In `frontend/lib/api/auth.ts`, update the `User` interface and add new methods:

Replace the `User` interface:

```typescript
export interface User {
  id: string;
  email: string;
  role: string;
  forcePasswordChange?: boolean;
}
```

Add to the `authApi` object before the closing `};`:

```typescript
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ data: { message: string } }> => {
    return apiClient.post('/auth/change-password', { currentPassword, newPassword });
  },

  forceChangePassword: async (newPassword: string): Promise<{ data: { message: string } }> => {
    return apiClient.post('/auth/force-change-password', { newPassword });
  },

  acceptInvite: async (token: string, password: string): Promise<{ data: { message: string } }> => {
    return apiClient.post('/auth/accept-invite', { token, password });
  },
```

- [ ] **Step 3: Update auth store**

In `frontend/stores/authStore.ts`, the `User` import from `@/lib/api/auth` already has `forcePasswordChange` now. No change needed since the interface is imported.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/api/users.ts frontend/lib/api/auth.ts
git commit -m "feat: add frontend API clients for user management"
```

---

## Task 11: Admin Layout — Force Password Change Redirect

**Files:**
- Modify: `frontend/app/admin/layout.tsx`

- [ ] **Step 1: Add force password change redirect and accept-invite bypass**

Update `frontend/app/admin/layout.tsx`. The key changes:
1. Allow `/admin/accept-invite` without auth (like login page)
2. After auth validation, redirect to `/admin/change-password` if `forcePasswordChange` is true

Replace the entire file:

```typescript
// app/admin/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { Spinner } from '@/components/ui/Spinner';
import { ToastContainer } from '@/components/ui/Toast';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

const PUBLIC_PATHS = ['/admin/login', '/admin/accept-invite'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, _hasHydrated, setUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p);

  const { isLoading, data, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !isPublicPage && _hasHydrated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (isError && !isPublicPage) {
      router.push('/admin/login');
    }
  }, [isError, isPublicPage, router]);

  // Force password change redirect
  useEffect(() => {
    if (
      user?.forcePasswordChange &&
      isAuthenticated &&
      pathname !== '/admin/change-password' &&
      !isPublicPage
    ) {
      router.push('/admin/change-password');
    }
  }, [user, isAuthenticated, pathname, isPublicPage, router]);

  if (isPublicPage) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Force password change — show page without sidebar/header
  if (user?.forcePasswordChange && pathname === '/admin/change-password') {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
      <ToastContainer />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admin/layout.tsx
git commit -m "feat: add force password change redirect and accept-invite bypass to admin layout"
```

---

## Task 12: Admin Sidebar — Role-Based Filtering

**Files:**
- Modify: `frontend/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Add Users nav item and hide it for editors**

In `frontend/components/admin/AdminSidebar.tsx`, update the `navItems` array and add role filtering.

Replace the `navItems` const:

```typescript
  const { user } = useAuthStore();

  const allNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥', adminOnly: true },
    { href: '/admin/leads', label: 'Leads', icon: '📧' },
    { href: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
    { href: '/admin/meetings', label: 'Meetings', icon: '📅' },
    { href: '/admin/meetings/availability', label: 'Availability', icon: '⏰' },
    { href: '/admin/content', label: 'Content', icon: '📝' },
    { href: '/admin/legal-pages', label: 'Legal Pages', icon: '⚖️' },
  ];

  const navItems = allNavItems.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );
```

Note: `useAuthStore` already imports `user` via destructuring on line with `{ logout }`. Update it to `const { logout, user } = useAuthStore();` — but `user` is actually not destructured there currently. The store is imported on line 6. Add `user` to the destructuring: change `const { logout } = useAuthStore();` to `const { logout, user } = useAuthStore();`.

- [ ] **Step 2: Commit**

```bash
git add frontend/components/admin/AdminSidebar.tsx
git commit -m "feat: add Users nav item with admin-only visibility"
```

---

## Task 13: Admin Header — Change Password Button

**Files:**
- Modify: `frontend/components/admin/AdminHeader.tsx`

- [ ] **Step 1: Add change password button to header**

Update `frontend/components/admin/AdminHeader.tsx`:

```typescript
// components/admin/AdminHeader.tsx
'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';

export const AdminHeader: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={toggleSidebar} className="lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <Button variant="outline" size="sm" onClick={() => setShowChangePassword(true)}>
              Change Password
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
          </div>
        </div>
      </header>
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/admin/AdminHeader.tsx
git commit -m "feat: add change password button to admin header"
```

---

## Task 14: Change Password Modal

**Files:**
- Create: `frontend/components/admin/ChangePasswordModal.tsx`

- [ ] **Step 1: Create the change password modal**

Create `frontend/components/admin/ChangePasswordModal.tsx`:

```typescript
// components/admin/ChangePasswordModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

interface ChangePasswordModalProps {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Password changed successfully' });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to change password';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              required
            />
            <Input
              label="New Password"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Min 12 characters, uppercase, lowercase, number, and special character required.
            </p>
            <Input
              label="Confirm New Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
            />
            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                Change Password
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/admin/ChangePasswordModal.tsx
git commit -m "feat: add self-service change password modal"
```

---

## Task 15: Force Password Change Page

**Files:**
- Create: `frontend/app/admin/change-password/page.tsx`

- [ ] **Step 1: Create the force change password page**

Create `frontend/app/admin/change-password/page.tsx`:

```typescript
// app/admin/change-password/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const forceChangeSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ForceChangeFormData = z.infer<typeof forceChangeSchema>;

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForceChangeFormData>({
    resolver: zodResolver(forceChangeSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ForceChangeFormData) =>
      authApi.forceChangePassword(data.newPassword),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, forcePasswordChange: false });
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      addNotification({ type: 'success', message: 'Password changed successfully' });
      router.push('/admin/dashboard');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to change password';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: ForceChangeFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You need to set a new password before you can continue.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Min 12 characters, uppercase, lowercase, number, and special character required.
            </p>
            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Set Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admin/change-password/page.tsx
git commit -m "feat: add force password change page"
```

---

## Task 16: Accept Invite Page

**Files:**
- Create: `frontend/app/admin/accept-invite/page.tsx`

- [ ] **Step 1: Create the accept invite page**

Create `frontend/app/admin/accept-invite/page.tsx`:

```typescript
// app/admin/accept-invite/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const acceptInviteSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: AcceptInviteFormData) =>
      authApi.acceptInvite(token!, data.password),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Password set successfully. You can now log in.' });
      router.push('/admin/login');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to set password';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: AcceptInviteFormData) => {
    await mutation.mutateAsync(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">Invalid invite link. No token provided.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please contact your administrator for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Set Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Welcome to BenoCode Admin. Set your password to activate your account.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Min 12 characters, uppercase, lowercase, number, and special character required.
            </p>
            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Set Password & Activate Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admin/accept-invite/page.tsx
git commit -m "feat: add accept invite page"
```

---

## Task 17: User List Page

**Files:**
- Create: `frontend/app/admin/users/page.tsx`
- Create: `frontend/app/admin/users/layout.tsx`

- [ ] **Step 1: Create the passthrough layout**

Create `frontend/app/admin/users/layout.tsx`:

```typescript
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Create the user list page**

Create `frontend/app/admin/users/page.tsx`:

```typescript
// app/admin/users/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, UserResponse } from '@/lib/api/users';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useUIStore } from '@/stores/uiStore';
import Link from 'next/link';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ isActive, invitePending }: { isActive: boolean; invitePending: boolean }) {
  if (invitePending) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        Invite Pending
      </span>
    );
  }
  return isActive ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
      Inactive
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  return role === 'ADMIN' ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      Editor
    </span>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);
  const { user: currentUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'admin', page],
    queryFn: () => usersApi.getAll(page, 10),
  });

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User deactivated' });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error?.response?.data?.error?.message || 'Failed to deactivate user',
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: usersApi.resendInvite,
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Invite resent' });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error?.response?.data?.error?.message || 'Failed to resend invite',
      });
    },
  });

  const handleDeactivate = (user: UserResponse) => {
    if (confirm(`Are you sure you want to deactivate ${user.email}?`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const users = data?.data || [];
  const stats = data?.stats;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
        <Link href="/admin/users/create">
          <Button>Create User</Button>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-100 dark:bg-gray-800' },
            { label: 'Admins', value: stats.admins, color: 'bg-purple-50 dark:bg-purple-900/30' },
            { label: 'Editors', value: stats.editors, color: 'bg-blue-50 dark:bg-blue-900/30' },
            { label: 'Active', value: stats.active, color: 'bg-green-50 dark:bg-green-900/30' },
            { label: 'Inactive', value: stats.inactive, color: 'bg-red-50 dark:bg-red-900/30' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-lg p-4 text-center`}
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.email}</td>
                      <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                      <td className="px-6 py-4"><StatusBadge isActive={user.isActive} invitePending={user.invitePending} /></td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(user.lastLoginAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">Edit</Button>
                          </Link>
                          {user.invitePending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resendMutation.mutate(user.id)}
                              isLoading={resendMutation.isPending}
                            >
                              Resend
                            </Button>
                          )}
                          {user.id !== currentUser?.id && user.isActive && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivate(user)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(data.meta!.totalPages, p + 1))}
            disabled={page === data.meta!.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/users/page.tsx frontend/app/admin/users/layout.tsx
git commit -m "feat: add user list page with stats and table"
```

---

## Task 18: Create User Page

**Files:**
- Create: `frontend/app/admin/users/create/page.tsx`
- Create: `frontend/app/admin/users/create/layout.tsx`

- [ ] **Step 1: Create the passthrough layout**

Create `frontend/app/admin/users/create/layout.tsx`:

```typescript
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Create the create user page**

Create `frontend/app/admin/users/create/page.tsx`:

```typescript
// app/admin/users/create/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const createUserFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'EDITOR']),
  method: z.enum(['password', 'invite']),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => data.method !== 'password' || (data.password !== undefined && data.password !== ''),
  { message: 'Password is required', path: ['password'] }
).refine(
  (data) => {
    if (data.method !== 'password') return true;
    if (!data.password) return true;
    const result = passwordSchema.safeParse(data.password);
    return result.success;
  },
  { message: 'Password does not meet requirements', path: ['password'] }
).refine(
  (data) => data.method !== 'password' || data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

type CreateUserFormData = z.infer<typeof createUserFormSchema>;

export default function CreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      email: '',
      role: 'EDITOR',
      method: 'invite',
      password: '',
      confirmPassword: '',
    },
  });

  const method = watch('method');

  const mutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User created successfully' });
      router.push('/admin/users');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to create user';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    await mutation.mutateAsync({
      email: data.email,
      role: data.role,
      method: data.method,
      ...(data.method === 'password' ? { password: data.password } : {}),
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create User</h1>
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            <Select
              label="Role"
              {...register('role')}
              error={errors.role?.message}
              options={[
                { value: 'EDITOR', label: 'Editor' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Creation Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="invite" {...register('method')} className="w-4 h-4" />
                  <span className="text-sm text-gray-900 dark:text-white">Send invite email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="password" {...register('method')} className="w-4 h-4" />
                  <span className="text-sm text-gray-900 dark:text-white">Set password manually</span>
                </label>
              </div>
            </div>

            {method === 'invite' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                An email will be sent to the user with a link to set their password. The link expires in 48 hours.
              </p>
            )}

            {method === 'password' && (
              <>
                <Input
                  label="Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Min 12 characters, uppercase, lowercase, number, and special character required.
                </p>
                <Input
                  label="Confirm Password"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  required
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  The user will be required to change this password on first login.
                </p>
              </>
            )}

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                Create User
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/users/create/page.tsx frontend/app/admin/users/create/layout.tsx
git commit -m "feat: add create user page with password/invite methods"
```

---

## Task 19: Edit User Page

**Files:**
- Create: `frontend/app/admin/users/[id]/page.tsx`
- Create: `frontend/app/admin/users/[id]/layout.tsx`

- [ ] **Step 1: Create the passthrough layout**

Create `frontend/app/admin/users/[id]/layout.tsx`:

```typescript
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Create the edit user page**

Create `frontend/app/admin/users/[id]/page.tsx`:

```typescript
// app/admin/users/[id]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const editUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'EDITOR']),
  isActive: z.boolean(),
  forcePasswordChange: z.boolean(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    if (!data.password || data.password === '') return true;
    const result = passwordSchema.safeParse(data.password);
    return result.success;
  },
  { message: 'Password does not meet requirements', path: ['password'] }
).refine(
  (data) => {
    if (!data.password || data.password === '') return true;
    return data.password === data.confirmPassword;
  },
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

type EditUserFormData = z.infer<typeof editUserSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);
  const { user: currentUser } = useAuthStore();
  const isSelf = currentUser?.id === id;

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (data?.data) {
      reset({
        email: data.data.email,
        role: data.data.role as 'ADMIN' | 'EDITOR',
        isActive: data.data.isActive,
        forcePasswordChange: data.data.forcePasswordChange,
        password: '',
        confirmPassword: '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (formData: EditUserFormData) => {
      const updateData: Record<string, unknown> = {
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        forcePasswordChange: formData.forcePasswordChange,
      };
      if (formData.password && formData.password !== '') {
        updateData.password = formData.password;
      }
      return usersApi.update(id, updateData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      addNotification({ type: 'success', message: 'User updated successfully' });
      router.push('/admin/users');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to update user';
      addNotification({ type: 'error', message });
    },
  });

  const onSubmit = async (formData: EditUserFormData) => {
    await mutation.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div>
        <p className="text-gray-600 dark:text-gray-400">User not found</p>
        <Button onClick={() => router.back()} className="mt-4">Back</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit User</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />

            <Select
              label="Role"
              {...register('role')}
              error={errors.role?.message}
              options={[
                { value: 'EDITOR', label: 'Editor' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              disabled={isSelf}
            />
            {isSelf && (
              <p className="text-xs text-gray-500 dark:text-gray-400">You cannot change your own role.</p>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="w-4 h-4"
                disabled={isSelf}
              />
              <label htmlFor="isActive" className="text-sm text-gray-900 dark:text-white">
                Active
              </label>
              {isSelf && (
                <span className="text-xs text-gray-500 dark:text-gray-400">(You cannot deactivate yourself)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="forcePasswordChange"
                {...register('forcePasswordChange')}
                className="w-4 h-4"
              />
              <label htmlFor="forcePasswordChange" className="text-sm text-gray-900 dark:text-white">
                Force password change on next login
              </label>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Reset Password (optional)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Leave blank to keep the current password.
              </p>
              <div className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Min 12 characters, uppercase, lowercase, number, and special character required.
                </p>
                <Input
                  label="Confirm New Password"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={isSubmitting}>
                Update User
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/users/[id]/page.tsx frontend/app/admin/users/[id]/layout.tsx
git commit -m "feat: add edit user page with password reset"
```

---

## Task 20: Login Page — Handle forcePasswordChange

**Files:**
- Modify: `frontend/app/admin/login/page.tsx`

- [ ] **Step 1: Update login to check forcePasswordChange**

In `frontend/app/admin/login/page.tsx`, update the `onSuccess` callback in the mutation:

Replace the existing `onSuccess`:

```typescript
    onSuccess: (data) => {
      setUser(data.data.user);
      addNotification({
        type: 'success',
        message: 'Login successful',
      });
      if (data.data.user.forcePasswordChange) {
        router.push('/admin/change-password');
      } else {
        router.push('/admin/dashboard');
      }
    },
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/admin/login/page.tsx
git commit -m "feat: redirect to change-password on login if forcePasswordChange is set"
```

---

## Task 21: Update Existing Seed to Work with New Schema

**Files:**
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Update the seed script**

In `backend/prisma/seed.ts`, the existing admin creation code sets `passwordHash` as a required field. Since `passwordHash` is now nullable but the seed user should have a password, update the create data to include the new fields:

Find the `prisma.user.create` block and update the `data` to include:

```typescript
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        forcePasswordChange: false,
      },
    });
```

- [ ] **Step 2: Commit**

```bash
git add backend/prisma/seed.ts
git commit -m "fix: update seed to include new user management fields"
```

---

## Task 22: End-to-End Verification

- [ ] **Step 1: Start the dev stack**

```bash
make dev
```

- [ ] **Step 2: Run the migration**

```bash
make migrate
```

- [ ] **Step 3: Run backend tests**

```bash
make test-be
```

Expected: All tests pass.

- [ ] **Step 4: Run frontend type check and lint**

```bash
make shell-fe
npx tsc --noEmit
npx next lint
```

Expected: No errors.

- [ ] **Step 5: Manual smoke test**

1. Log in as admin at http://localhost:3000/admin/login
2. Verify "Users" appears in sidebar
3. Navigate to Users page — see stats and the admin user in the table
4. Create a user with password method — verify they appear in the list
5. Create a user with invite method — verify "Invite Pending" badge
6. Edit a user — change role, toggle active
7. Test "Change Password" in the header
8. Log in as the password-created user — verify force change password redirect
9. Set new password — verify redirect to dashboard

- [ ] **Step 6: Commit any fixes found during verification**

```bash
git add -A
git commit -m "fix: address issues found during user management verification"
```
