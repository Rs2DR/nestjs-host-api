import type { Level } from 'pino';

export const LOGGER_NAME = 'park-api';

export const LOGGER_LEVELS = {
  development: 'debug',
  production: 'info',
} as const satisfies Record<string, Level>;

export const LOGGER_TIME_FORMAT = 'yyyy-mm-dd HH:MM:ss.l o';

export const LOGGER_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'req.body.password',
  'req.body.passwordHash',
  'req.body.token',
  'req.body.accessToken',
  'req.body.refreshToken',
  'req.body.clientSecret',
] as const;
