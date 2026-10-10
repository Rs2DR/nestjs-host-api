import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import type { Queue } from 'bullmq';

import type { NotificationJob } from './interfaces/notification-job.interface.js';
import {
  NOTIFICATIONS_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications.constants.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE)
    private readonly notificationsQueue: Queue<NotificationJob>,
  ) {}

  async enqueuePush(notification: NotificationJob, delay = 0): Promise<void> {
    await this.notificationsQueue.add(
      NOTIFICATIONS_JOBS.SEND_PUSH,
      notification,
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    );
  }
}
