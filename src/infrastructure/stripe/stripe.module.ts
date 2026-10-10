import { Module, Provider } from '@nestjs/common';

import Stripe from 'stripe';

import { StripeModuleOptions } from './interfaces/stripe-module-options.interface.js';
import { STRIPE_CLIENT } from './stripe.constants.js';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './stripe.module-definition.js';
import { StripeService } from './stripe.service.js';

const stripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [MODULE_OPTIONS_TOKEN],
  useFactory: (options: StripeModuleOptions) => {
    return new Stripe(options.apiKey, {
      apiVersion: options.apiVersion as any,
    });
  },
};

@Module({
  providers: [stripeProvider, StripeService],
  exports: [StripeService],
})
export class StripeModule extends ConfigurableModuleClass {}
