# User Management — Design Spec

## Overview

Add full user management to the admin panel: create, edit, deactivate users, password creation & change, email invites, forced password change, and editor role restrictions.

## 1. Database Changes

Modify the `User` model in `backend/prisma/schema.prisma`:

```
User
  id                  String    @id @default(cuid())
  email               String    @unique
  passwordHash        String?              ← nullable (invite-only users have no password yet)
  role                UserRole  @default(EDITOR)
  isActive            Boolean   @default(true)
  forcePasswordChange Boolean   @default(false)
  inviteToken         String?   @unique    ← SHA-256 hash of the token sent via email
  inviteExpiresAt     DateTime?            ← 48h from creation
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  lastLoginAt         DateTime?
```

- `passwordHash` nullable: invite-created users set password via invite link.
- `inviteToken` stored as SHA-256 hash; cleartext sent in email only.
- `isActive: false` blocks login entirely.
- `forcePasswordChange: true` redirects user to password-change screen after login.

## 2. Backend API

All user management endpoints under `/api/v1/admin/users`, protected by `authMiddleware` + `authorize('ADMIN')`.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | List users (paginated) + stats |
| GET | `/admin/users/:id` | Get single user |
| POST | `/admin/users` | Create user (with password or invite) |
| PUT | `/admin/users/:id` | Update user (email, role, isActive, forcePasswordChange) |
| PATCH | `/admin/users/:id/deactivate` | Soft delete (set isActive: false) |
| POST | `/admin/users/:id/resend-invite` | Resend invite email |

### Auth-related endpoints (not admin-only)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/change-password` | Self-service password change (any authenticated user) |
| POST | `/auth/accept-invite` | Set password via invite token (public) |

### Create user request body

```json
{
  "email": "user@example.com",
  "role": "EDITOR",
  "method": "password" | "invite",
  "password": "..." // required if method=password
}
```

- `method: "password"` — admin sets password, user can log in immediately. `forcePasswordChange` set to `true`.
- `method: "invite"` — generates invite token, sends email via Brevo. `passwordHash` stays null until invite is accepted.

### Update user request body

```json
{
  "email": "new@example.com",        // optional
  "role": "ADMIN",                   // optional
  "isActive": true,                  // optional
  "forcePasswordChange": true        // optional
}
```

- Admins cannot deactivate themselves.
- Admins cannot change their own role.
- Email uniqueness validated.

### Change password request body (self-service)

```json
{
  "currentPassword": "...",
  "newPassword": "..."
}
```

- Validates current password.
- Validates new password strength (existing `validatePasswordStrength`).
- Clears `forcePasswordChange` flag on success.

### Accept invite request body

```json
{
  "token": "...",
  "password": "..."
}
```

- Finds user by SHA-256(token), checks expiry.
- Validates password strength.
- Sets `passwordHash`, clears `inviteToken` and `inviteExpiresAt`.
- Sets `forcePasswordChange: false`.

### Stats response (returned alongside user list)

```json
{
  "stats": {
    "total": 5,
    "admins": 2,
    "editors": 3,
    "active": 4,
    "inactive": 1
  }
}
```

## 3. Auth Service Changes

Modify `auth.service.ts` login flow:

1. After finding user by email, check `isActive`. If `false`, throw `UnauthorizedError('Account is deactivated')`.
2. If `passwordHash` is null (invite pending), throw `UnauthorizedError('Please accept your invite first')`.
3. After successful login, include `forcePasswordChange` in the JWT payload and login response.

Modify `authMiddleware` or `authorize`:
- No changes needed — role check already works. Editor restriction is enforced by `authorize('ADMIN')` on user management routes.

## 4. Editor Role Restrictions

- User management routes use `authorize('ADMIN')` — editors are blocked.
- Frontend: hide "Users" sidebar link for editors.
- Frontend: redirect editors away from `/admin/users/*` routes.
- Self-service password change is available to all roles.

## 5. Invite Email

Use existing Brevo integration. Email contains:

- Subject: "You've been invited to BenoCode Admin"
- Body: Welcome message + link to `{FRONTEND_URL}/admin/accept-invite?token={cleartext_token}`
- Link expires in 48 hours.

## 6. Frontend Pages

### 6.1 User List — `/admin/users`

- Stats cards at top: Total Users, Admins, Editors, Active, Inactive
- Table columns: Email, Role (badge), Status (active/inactive badge), Last Login (relative time), Created, Actions
- Actions per row: Edit button, Deactivate/Activate toggle, Resend Invite (if invite pending)
- "Create User" button in header
- Pagination

### 6.2 Create User — `/admin/users/create`

- Form fields: Email, Role (select: ADMIN/EDITOR), Creation Method (radio: "Set password" / "Send invite")
- If "Set password": password + confirm password fields with strength indicator
- If "Send invite": no password fields, explanatory text
- Submit → redirect to user list with success notification

### 6.3 Edit User — `/admin/users/[id]`

- Form fields: Email, Role (select), Active (toggle), Force Password Change (toggle)
- "Reset Password" section: new password + confirm fields (optional — only filled if admin wants to reset)
- Cannot edit own role or deactivate self (fields disabled with tooltip)
- Submit → redirect to user list

### 6.4 Self-service Password Change

- Accessible from admin header (user dropdown or profile link)
- Modal or dedicated page: current password, new password, confirm new password
- Available to all roles

### 6.5 Force Password Change Screen

- After login, if `forcePasswordChange` is true, redirect to `/admin/change-password`
- Block navigation to other admin pages until password is changed
- Form: new password, confirm new password (no current password required — user is already authenticated, and the `forcePasswordChange` flag in their auth state proves they were just redirected)
- On success: clear flag, redirect to dashboard

### 6.6 Accept Invite Page — `/admin/accept-invite`

- Public page (no auth required)
- Reads `?token=` from URL
- Form: new password, confirm new password
- On success: redirect to login with success message
- On invalid/expired token: error message with contact admin instruction

### 6.7 Sidebar Update

- Add "Users" nav item (icon: people/users) — visible only to ADMIN role
- Position: after Dashboard, before Leads

## 7. Shared Schemas

Add to `/shared` package:
- User CRUD Zod schemas (create, update)
- Password change schema
- Invite accept schema

These are imported by both frontend (form validation) and backend (request validation).

## 8. Security Considerations

- Invite tokens: 48 bytes random, stored as SHA-256 hash, 48h expiry
- Password validation: existing rules (12+ chars, upper, lower, number, special)
- Admins cannot deactivate themselves or remove their own admin role
- Deactivated users' existing JWT tokens still work until expiry — add `isActive` check in `authMiddleware` (DB lookup on each request is too expensive; check on token refresh instead)
- Rate limit on accept-invite and change-password endpoints
