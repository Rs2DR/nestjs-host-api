import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must contain at least 32 characters'),

  STRIPE_SECRET_KEY: z.string(),

  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.email(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_DATABASE_URL: z.url().optional(),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535),

  LOGGER_HTTP_AUTO_LOGGING: z.coerce.boolean(),
});
