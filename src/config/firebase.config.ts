import type { ConfigService } from '@nestjs/config';

export function createFirebaseConfig(configService: ConfigService) {
  return {
    credential: {
      projectId: configService.getOrThrow<string>('FIREBASE_PROJECT_ID'),

      clientEmail: configService.getOrThrow<string>('FIREBASE_CLIENT_EMAIL'),

      privateKey: configService
        .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
        .replace(/\\n/g, '\n'),
    },

    databaseURL: configService.get<string>('FIREBASE_DATABASE_URL'),
  };
}
