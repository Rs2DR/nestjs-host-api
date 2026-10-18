import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { NOTIFICATIONS_QUEUE } from './notifications.constants.js';
import { NotificationsListener } from './notifications.listener.js';
import { NotificationsProcessor } from './notifications.processor.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATIONS_QUEUE,
    }),
  ],
  providers: [
    NotificationsService,
    NotificationsListener,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
