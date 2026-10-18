import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationRequestedEvent } from './events/notification-requested.event.js';
import { NOTIFICATIONS_EVENTS } from './notifications.constants.js';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class NotificationsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(NOTIFICATIONS_EVENTS.REQUESTED)
  async handleNotificationRequested(
    event: NotificationRequestedEvent,
  ): Promise<void> {
    if (event.tokens.length === 0) {
      return;
    }

    await this.notificationsService.enqueuePush(
      {
        tokens: event.tokens,
        title: event.title,
        body: event.body,
        data: event.data,
      },
      event.delay,
    );
  }
}
