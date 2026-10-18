import { z } from 'zod';

import { ENV_ERRORS } from './env.errors.js';

const requiredString = (error: string) => z.string().trim().min(1, error);

const portSchema = (error: string) =>
  z.coerce.number().int(error).min(1, error).max(65535, error);

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: portSchema(ENV_ERRORS.PORT).default(3000),

  DB_USER: requiredString(ENV_ERRORS.DB_USER),
  DB_PASSWORD: requiredString(ENV_ERRORS.DB_PASSWORD),
  DB_NAME: requiredString(ENV_ERRORS.DB_NAME),
  DB_PORT: portSchema(ENV_ERRORS.DB_PORT).default(5432),

  DATABASE_URL: z.url(ENV_ERRORS.DATABASE_URL),

  REDIS_HOST: requiredString(ENV_ERRORS.REDIS_HOST),
  REDIS_PORT: portSchema(ENV_ERRORS.REDIS_PORT).default(6379),

  JWT_SECRET: z.string().min(32, {
    error: ({ minimum }) => ENV_ERRORS.JWT_SECRET_MIN(minimum),
  }),

  STRIPE_SECRET_KEY: requiredString(ENV_ERRORS.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: requiredString(ENV_ERRORS.STRIPE_WEBHOOK_SECRET),

  FIREBASE_PROJECT_ID: requiredString(ENV_ERRORS.FIREBASE_PROJECT_ID),

  FIREBASE_CLIENT_EMAIL: z.email({
    error: ENV_ERRORS.FIREBASE_CLIENT_EMAIL,
  }),

  FIREBASE_PRIVATE_KEY: requiredString(ENV_ERRORS.FIREBASE_PRIVATE_KEY),

  LOGGER_HTTP_AUTO_LOGGING: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),

  QUEUE_DASHBOARD_USERNAME: requiredString(ENV_ERRORS.QUEUE_DASHBOARD_USERNAME),

  QUEUE_DASHBOARD_PASSWORD: z
    .string()
    .min(8, {
      error: ({ minimum }) => ENV_ERRORS.QUEUE_DASHBOARD_PASSWORD_MIN(minimum),
    })
    .max(128, {
      error: ({ maximum }) => ENV_ERRORS.QUEUE_DASHBOARD_PASSWORD_MAX(maximum),
    }),
});
