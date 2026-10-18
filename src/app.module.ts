import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';

import { envSchema } from '@config/env/env.schema.js';
import { createFirebaseConfig } from '@config/firebase.config.js';
import { createJwtConfig } from '@config/jwt.config.js';
import { createLoggerConfig } from '@config/logger.config.js';
import { createStripeConfig } from '@config/stripe.config.js';
import { DatabaseModule } from '@infrastructure/database/database.module.js';
import { FirebaseModule } from '@infrastructure/firebase/firebase.module.js';
import { QueueModule } from '@infrastructure/queue/queue.module.js';
import { StripeModule } from '@infrastructure/stripe/stripe.module.js';
import { AuthModule } from '@modules/auth/auth.module.js';
import { NotificationsModule } from '@modules/notifications/notifications.module.js';
import { PaymentsModule } from '@modules/payments/payments.module.js';
import { RentalsModule } from '@modules/rentals/rentals.module.js';
import { ServersModule } from '@modules/servers/servers.module.js';
import { UsersModule } from '@modules/users/users.module.js';
import { WebhooksModule } from '@modules/webhooks/webhooks.module.js';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      validationSchema: envSchema,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: createJwtConfig,
    }),
    FirebaseModule.forRootAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: createFirebaseConfig,
    }),
    StripeModule.forRootAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: createStripeConfig,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createLoggerConfig,
    }),
    PaymentsModule,
    RentalsModule,
    ServersModule,
    NotificationsModule,
    QueueModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    WebhooksModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
