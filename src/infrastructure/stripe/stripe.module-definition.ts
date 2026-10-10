import { ConfigurableModuleBuilder } from '@nestjs/common';

import { StripeModuleOptions } from './interfaces/stripe-module-options.interface.js';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<StripeModuleOptions>()
    .setClassMethodName('forRoot')
    .setExtras({ isGlobal: false }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }))
    .build();
