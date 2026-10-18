import type { ConfigService } from '@nestjs/config';

import { FirebaseModuleOptions } from '@infrastructure/firebase/interfaces/firebase-module-options.interface.js';

export function createFirebaseConfig(
  configService: ConfigService,
): FirebaseModuleOptions {
  return {
    credential: {
      projectId: configService.getOrThrow<string>('FIREBASE_PROJECT_ID'),

      clientEmail: configService.getOrThrow<string>('FIREBASE_CLIENT_EMAIL'),

      privateKey: configService
        .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
        .replace(/\\n/g, '\n'),
    },
  };
}
