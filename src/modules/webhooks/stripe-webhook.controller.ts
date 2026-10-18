import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';

import { StripeService } from '@infrastructure/stripe/stripe.service.js';
import { PaymentsService } from '@modules/payments/payments.service.js';
import type { Request } from 'express';
import type Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!request.rawBody || !signature) {
      throw new BadRequestException('Missing Stripe signature or raw body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(
        request.rawBody,
        signature,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.paymentsService.handleSuccessfulPayment(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.payment_failed':
        await this.paymentsService.handleFailedPayment(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case 'payment_intent.canceled':
        await this.paymentsService.handleFailedPayment(
          event.data.object as Stripe.PaymentIntent,
          true,
        );
        break;
      default:
        break;
    }

    return { received: true };
  }
}
