import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import { FirebaseService } from '@infrastructure/firebase/firebase.service.js';
import type { Job } from 'bullmq';

import type { NotificationJob } from './interfaces/notification-job.interface.js';
import {
  NOTIFICATIONS_JOBS,
  NOTIFICATIONS_QUEUE,
} from './notifications.constants.js';

@Injectable()
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  constructor(private readonly firebaseService: FirebaseService) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    switch (job.name) {
      case NOTIFICATIONS_JOBS.SEND_PUSH:
        await this.sendPush(job.data);
        return;

      default:
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }

  private async sendPush(notification: NotificationJob): Promise<void> {
    const results = await Promise.allSettled(
      notification.tokens.map((token) =>
        this.firebaseService.sendNotification(
          token,
          notification.title,
          notification.body,
          notification.data,
        ),
      ),
    );

    const failed = results.filter((result) => result.status === 'rejected');

    if (failed.length > 0) {
      throw new Error(
        `Failed to send ${failed.length} of ${results.length} notifications`,
      );
    }
  }
}
