import { Module, Provider } from '@nestjs/common';

import {
  type App as FirebaseApp,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';

import { FIREBASE_CLIENT } from './firebase.constants.js';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './firebase.module-definition.js';
import { FirebaseService } from './firebase.service.js';
import type { FirebaseModuleOptions } from './interfaces/firebase-module-options.interface.js';

const firebaseProvider: Provider = {
  provide: FIREBASE_CLIENT,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: FirebaseModuleOptions): FirebaseApp => {
    const apps = getApps();

    if (apps.length > 0) {
      return apps[0];
    }

    return initializeApp({
      credential: cert(options.credential),
    });
  },
};

@Module({
  providers: [firebaseProvider, FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule extends ConfigurableModuleClass {}
