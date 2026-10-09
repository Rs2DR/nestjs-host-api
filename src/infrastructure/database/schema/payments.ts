import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { rentals } from './rentals.js';

export const PAYMENT_PROVIDERS = ['stripe'] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = [
  'pending',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentProviderEnum = p.pgEnum(
  'payment_provider',
  PAYMENT_PROVIDERS,
);

export const paymentStatusEnum = p.pgEnum('payment_status', PAYMENT_STATUSES);

export const payments = p.pgTable(
  'payments',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    rentalId: p
      .uuid('rental_id')
      .notNull()
      .references(() => rentals.id, {
        onDelete: 'restrict',
      }),
    provider: paymentProviderEnum('provider').notNull().default('stripe'),
    providerPaymentId: p
      .varchar('provider_payment_id', { length: 255 })
      .unique(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    amount: p
      .numeric('amount', {
        precision: 12,
        scale: 2,
      })
      .notNull(),
    currency: p.char('currency', { length: 3 }).notNull(),
    failureReason: p.text('failure_reason'),
    paidAt: p.timestamp('paid_at', {
      withTimezone: true,
    }),
    createdAt: p
      .timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: p
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [p.check('payments_amount_check', sql`${table.amount} > 0`)],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
