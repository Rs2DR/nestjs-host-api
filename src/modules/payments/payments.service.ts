import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { StripeService } from '@infrastructure/stripe/stripe.service.js';
import { RentalsService } from '@modules/rentals/rentals.service.js';
import type Stripe from 'stripe';

import { PAYMENT_ERRORS } from './payments.constants.js';
import { PaymentsRepository } from './payments.repository.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly rentalsService: RentalsService,
    private readonly stripeService: StripeService,
  ) {}

  async createPaymentIntent(userId: string, slotId: string, hours: number) {
    // Reserve the slot before making a payment request to Stripe.
    const rental = await this.rentalsService.createReservation({
      userId,
      slotId,
      hours,
    });

    let payment: Awaited<
      ReturnType<PaymentsRepository['createPending']>
    > | null = null;
    let paymentIntent: Stripe.PaymentIntent | null = null;

    try {
      payment = await this.paymentsRepository.createPending(
        rental.id,
        rental.totalAmount,
        rental.currency,
      );

      paymentIntent = await this.stripeService.createPaymentIntent({
        amount: payment.amount,
        currency: payment.currency,
        metadata: {
          rentalId: rental.id,
          userId: rental.userId,
          serverId: rental.serverId,
          slotId: rental.slotId,
          hours: String(rental.hours),
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Stripe did not return a client secret');
      }

      const savedPayment = await this.paymentsRepository.setPaymentIntentId(
        payment.id,
        paymentIntent.id,
      );

      if (!savedPayment) {
        throw new Error('Unable to save the Stripe payment intent');
      }

      return {
        rentalId: rental.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: payment.amount,
        currency: payment.currency,
        paymentExpiresAt: rental.paymentExpiresAt,
      };
    } catch (error: unknown) {
      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded' && payment) {
          try {
            const refund = await this.stripeService.refundPaymentIntent(
              paymentIntent.id,
            );
            await this.paymentsRepository.markRefunded(payment.id, refund.id);
          } catch {
            // Keep the database status truthful if the refund request fails.
            await this.paymentsRepository.markSucceeded(payment.id);
          }
        } else if (
          paymentIntent.status === 'requires_payment_method' ||
          paymentIntent.status === 'requires_confirmation' ||
          paymentIntent.status === 'requires_action'
        ) {
          try {
            await this.stripeService.cancelPaymentIntent(paymentIntent.id);
          } catch {
            // The reservation is still cancelled below.
          }
        }
      }

      if (payment) {
        await this.paymentsRepository.markCreationFailed(payment.id);
      }
      await this.rentalsService.cancelReservation(rental.id);

      throw new InternalServerErrorException(PAYMENT_ERRORS.CREATION_FAILED, {
        cause: error,
      });
    }
  }

  async handleSuccessfulPayment(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const row = await this.paymentsRepository.findByIntentId(paymentIntent.id);
    if (!row) {
      throw new NotFoundException(PAYMENT_ERRORS.NOT_FOUND);
    }

    const { payment, rental } = row;
    if (payment.status === 'refunded') return;

    // Stripe may deliver a duplicate success webhook after the rental has ended.
    if (payment.status === 'succeeded' && rental.status === 'expired') return;

    const metadataMatches =
      paymentIntent.metadata.rentalId === rental.id &&
      paymentIntent.metadata.userId === rental.userId &&
      paymentIntent.metadata.serverId === rental.serverId &&
      paymentIntent.metadata.slotId === rental.slotId &&
      paymentIntent.metadata.hours === String(rental.hours);

    const amountMatches =
      paymentIntent.amount_received === payment.amount &&
      paymentIntent.currency.toLowerCase() === payment.currency;

    if (!metadataMatches || !amountMatches) {
      await this.rentalsService.cancelReservation(rental.id);
      const refund = await this.stripeService.refundPaymentIntent(
        paymentIntent.id,
      );
      await this.paymentsRepository.markRefunded(payment.id, refund.id);
      return;
    }

    await this.paymentsRepository.markSucceeded(payment.id);

    // An expired/cancelled reservation cannot be activated. In this case the
    // charge is returned instead of granting an unavailable slot.
    const activatedRental = await this.rentalsService.activateAfterPayment(
      rental.id,
    );

    if (!activatedRental) {
      const refund = await this.stripeService.refundPaymentIntent(
        paymentIntent.id,
      );
      await this.paymentsRepository.markRefunded(payment.id, refund.id);
      await this.rentalsService.cancelReservation(rental.id);
    }
  }

  async handleFailedPayment(
    paymentIntent: Stripe.PaymentIntent,
    cancelled = false,
  ): Promise<void> {
    const rentalId = await this.paymentsRepository.markFailed(
      paymentIntent.id,
      cancelled,
    );

    if (rentalId) {
      await this.rentalsService.cancelReservation(rentalId);
    }
  }
}
