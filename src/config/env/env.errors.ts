export const ENV_ERRORS = {
  PORT: 'PORT must be an integer between 1 and 65535',

  DB_USER: 'DB_USER is required',
  DB_PASSWORD: 'DB_PASSWORD is required',
  DB_NAME: 'DB_NAME is required',
  DB_PORT: 'DB_PORT must be an integer between 1 and 65535',

  DATABASE_URL: 'DATABASE_URL must be a valid connection URL',

  REDIS_HOST: 'REDIS_HOST is required',
  REDIS_PORT: 'REDIS_PORT must be an integer between 1 and 65535',

  JWT_SECRET_MIN: (minimum: number | bigint) =>
    `JWT_SECRET must contain at least ${minimum} characters`,

  STRIPE_SECRET_KEY: 'STRIPE_SECRET_KEY is required',
  STRIPE_WEBHOOK_SECRET: 'STRIPE_WEBHOOK_SECRET is required',

  FIREBASE_PROJECT_ID: 'FIREBASE_PROJECT_ID is required',
  FIREBASE_CLIENT_EMAIL: 'FIREBASE_CLIENT_EMAIL must be a valid email address',
  FIREBASE_PRIVATE_KEY: 'FIREBASE_PRIVATE_KEY is required',

  LOGGER_HTTP_AUTO_LOGGING:
    'LOGGER_HTTP_AUTO_LOGGING must be either true or false',

  QUEUE_DASHBOARD_USERNAME: 'QUEUE_DASHBOARD_USERNAME is required',
  QUEUE_DASHBOARD_PASSWORD_MIN: (minimum: number | bigint) =>
    `QUEUE_DASHBOARD_PASSWORD must contain at least ${minimum} characters`,
  QUEUE_DASHBOARD_PASSWORD_MAX: (maximum: number | bigint) =>
    `QUEUE_DASHBOARD_PASSWORD must contain at most ${maximum} characters`,
} as const;
