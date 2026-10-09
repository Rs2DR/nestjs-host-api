import { ConfigurableModuleBuilder } from '@nestjs/common';

import { PaymentsModuleOptions } from './interfaces/payments-module-options.interface.js';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<PaymentsModuleOptions>()
    .setClassMethodName('forRoot')
    .setExtras({ isGlobal: false }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }))
    .build();
