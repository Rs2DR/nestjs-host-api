import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq } from 'drizzle-orm';

import type { Database } from '@infrastructure/database/database.types.js';
import { payments, type Payment } from '@infrastructure/database/schema/payments.js';
import { rentals } from '@infrastructure/database/schema/rentals.js';

@Injectable()
export class PaymentsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async createPending(
    rentalId: string,
    amount: number,
    currency: string,
  ): Promise<Payment> {
    const [payment] = await this.db
      .insert(payments)
      .values({
        rentalId,
        amount,
        currency: currency.toLowerCase(),
        status: 'pending',
      })
      .returning();

    if (!payment) {
      throw new Error('Unable to create a payment record');
    }

    return payment;
  }

  async setPaymentIntentId(
    paymentId: string,
    paymentIntentId: string,
  ): Promise<Payment | null> {
    const [payment] = await this.db
      .update(payments)
      .set({ stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
      .where(eq(payments.id, paymentId))
      .returning();

    return payment ?? null;
  }

  async findByIntentId(paymentIntentId: string) {
    const [row] = await this.db
      .select({ payment: payments, rental: rentals })
      .from(payments)
      .innerJoin(rentals, eq(payments.rentalId, rentals.id))
      .where(eq(payments.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    return row ?? null;
  }

  async markSucceeded(paymentId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1)
        .for('update');

      if (!payment || payment.status === 'refunded') return;

      await tx
        .update(payments)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(payments.id, paymentId));
    });
  }

  async markFailed(
    paymentIntentId: string,
    cancelled: boolean,
  ): Promise<string | null> {
    return this.db.transaction(async (tx) => {
      const [payment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.stripePaymentIntentId, paymentIntentId))
        .limit(1)
        .for('update');

      if (
        !payment ||
        payment.status === 'succeeded' ||
        payment.status === 'refunded'
      ) {
        return null;
      }

      const status = cancelled ? 'cancelled' : 'failed';
      if (payment.status !== status) {
        await tx
          .update(payments)
          .set({ status, updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
      }

      return payment.rentalId;
    });
  }

  async markCreationFailed(paymentId: string): Promise<void> {
    await this.db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(and(eq(payments.id, paymentId), eq(payments.status, 'pending')));
  }

  async markRefunded(paymentId: string, refundId: string): Promise<void> {
    await this.db
      .update(payments)
      .set({
        status: 'refunded',
        stripeRefundId: refundId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));
  }
}
