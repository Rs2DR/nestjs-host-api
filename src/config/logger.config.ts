import type { ConfigService } from '@nestjs/config';

import {
  LOGGER_LEVELS,
  LOGGER_NAME,
  LOGGER_REDACT_PATHS,
  LOGGER_TIME_FORMAT,
} from '@common/constants/logger.constants.js';
import type { Params } from 'nestjs-pino';

export function createLoggerConfig(configService: ConfigService): Params {
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');

  const isDevelopment = nodeEnv !== 'production';

  return {
    pinoHttp: {
      name: LOGGER_NAME,

      level: isDevelopment
        ? LOGGER_LEVELS.development
        : LOGGER_LEVELS.production,

      redact: {
        paths: [...LOGGER_REDACT_PATHS],
      },

      genReqId: (req, res) => {
        const requestId = req.headers['x-request-id'];

        if (typeof requestId === 'string' && requestId.length > 0) {
          res.setHeader('x-request-id', requestId);

          return requestId;
        }

        const generatedId = crypto.randomUUID();

        res.setHeader('x-request-id', generatedId);

        return generatedId;
      },

      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              colorizeObjects: true,

              singleLine: false,

              levelFirst: true,

              translateTime: LOGGER_TIME_FORMAT,

              ignore: 'pid,hostname',

              messageKey: 'msg',

              errorLikeObjectKeys: ['err', 'error'],
            },
          }
        : undefined,
    },
  };
}
