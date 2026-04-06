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
