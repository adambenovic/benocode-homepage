// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BREVO_API_KEY: z.string(),
  BREVO_SENDER_EMAIL: z.string().email(),
  ADMIN_EMAIL: z.string().email(),
  CORS_ORIGIN: z.string().url(),
});

export const env = envSchema.parse(process.env);

