import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import basicAuth from 'express-basic-auth';

import { QUEUE_DASHBOARD_ROUTE } from './queue.constants.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
          tls: {
            rejectUnauthorized: false,
          },
        },
      }),
    }),

    BullBoardModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        route: QUEUE_DASHBOARD_ROUTE,
        adapter: ExpressAdapter,
        middleware: basicAuth({
          challenge: true,
          users: {
            [configService.getOrThrow<string>('QUEUE_DASHBOARD_USERNAME')]:
              configService.getOrThrow<string>('QUEUE_DASHBOARD_PASSWORD'),
          },
        }),
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
