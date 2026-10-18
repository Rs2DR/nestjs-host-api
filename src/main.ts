import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { setupSwagger } from '@config/swagger.config.js';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.useLogger(app.get(Logger));

  app.useSecurityHeaders();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  setupSwagger(app);

  await app.listen(port);
}
await bootstrap();
