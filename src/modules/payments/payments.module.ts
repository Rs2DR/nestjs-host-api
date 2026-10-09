import { Module, Provider } from '@nestjs/common';

import Stripe from 'stripe';

import { PaymentsModuleOptions } from './interfaces/payments-module-options.interface.js';
import { STRIPE_CLIENT } from './payments.constants.js';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './payments.module-definition.js';
import { PaymentsService } from './payments.service.js';

const stripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: PaymentsModuleOptions) => {
    return new Stripe(options.apiKey, {
      apiVersion: options.apiVersion as any,
    });
  },
};

@Module({
  providers: [stripeProvider, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule extends ConfigurableModuleClass {}
