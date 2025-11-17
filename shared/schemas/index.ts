// shared/schemas/index.ts
// Shared Zod validation schemas between frontend and backend

import { z } from 'zod';

export const localeSchema = z.enum(['EN', 'SK', 'DE', 'CZ']);

export const emailSchema = z.string().email('Invalid email address');

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

