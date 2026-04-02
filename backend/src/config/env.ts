// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CSRF_SECRET: z.string().min(32),
  BREVO_API_KEY: z.string(),
  BREVO_SENDER_EMAIL: z.string().email(),
  ADMIN_EMAIL: z.string().email(),
  // Supports comma-separated list of allowed origins
  CORS_ORIGIN: z.string(),
});

export const env = envSchema.parse(process.env);

