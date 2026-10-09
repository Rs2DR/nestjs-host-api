import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import Stripe from 'stripe';

import { type PaymentsModuleOptions } from './interfaces/payments-module-options.interface.js';
import { STRIPE_CLIENT, STRIPE_ERRORS } from './payments.constants.js';
import { MODULE_OPTIONS_TOKEN } from './payments.module-definition.js';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    @Inject(MODULE_OPTIONS_TOKEN)
    private readonly options: PaymentsModuleOptions,
  ) {}

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      metadata,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  constructWebhookEvent(rawBody: Buffer | undefined, signature: string) {
    if (!rawBody) {
      throw new BadRequestException(STRIPE_ERRORS.RAW_BODY_MISSING);
    }

    if (!signature) {
      throw new BadRequestException(STRIPE_ERRORS.SIGNATURE_MISSING);
    }

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.options.webhookSecret,
      );
    } catch {
      throw new BadRequestException(STRIPE_ERRORS.INVALID_WEBHOOK_SIGNATURE);
    }
  }
}
