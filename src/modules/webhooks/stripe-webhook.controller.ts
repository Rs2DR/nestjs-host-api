import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';

import { PaymentsService } from '@modules/payments/payments.service.js';
import type { Request } from 'express';
import type Stripe from 'stripe';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.paymentsService.constructWebhookEvent(
      request.rawBody,
      signature,
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // await this.parkingSessionsService.startSessionFromPayment(
        //   paymentIntent,
        // );

        break;
      }

      case 'payment_intent.payment_failed': {
        // Здесь можно добавить обработку неуспешной оплаты.
        break;
      }

      case 'payment_intent.processing': {
        // Оплата ещё обрабатывается.
        break;
      }

      default:
        break;
    }

    return { received: true };
  }
}
