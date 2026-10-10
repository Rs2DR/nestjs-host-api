import type { ConfigService } from '@nestjs/config';

import { StripeModuleOptions } from '@infrastructure/stripe/interfaces/stripe-module-options.interface.js';

export function createStripeConfig(
  configService: ConfigService,
): Promise<StripeModuleOptions> | StripeModuleOptions {
  return {
    apiKey: configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
    webhookSecret: configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
    apiVersion: '2026-08-26.dahlia',
  };
}
