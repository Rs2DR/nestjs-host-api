import { Inject, Injectable } from '@nestjs/common';

import type { App as FirebaseApp } from 'firebase-admin/app';
import { type Messaging, getMessaging } from 'firebase-admin/messaging';

import { FIREBASE_CLIENT } from './firebase.constants.js';

@Injectable()
export class FirebaseService {
  private readonly messaging: Messaging;

  constructor(
    @Inject(FIREBASE_CLIENT)
    private readonly firebaseApp: FirebaseApp,
  ) {
    this.messaging = getMessaging(this.firebaseApp);
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    return this.messaging.send({
      token,

      notification: {
        title,
        body,
      },

      data,
    });
  }
}
