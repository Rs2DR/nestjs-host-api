import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { rentals } from './rentals.js';

export const paymentStatusEnum = p.pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
]);

export const payments = p.pgTable(
  'payments',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    rentalId: p
      .uuid('rental_id')
      .notNull()
      .unique()
      .references(() => rentals.id, { onDelete: 'restrict' }),
    stripePaymentIntentId: p.varchar('stripe_payment_intent_id', { length: 255 }).unique(),
    stripeRefundId: p.varchar('stripe_refund_id', { length: 255 }).unique(),
    amount: p.integer('amount').notNull(),
    currency: p.varchar('currency', { length: 3 }).notNull(),
    status: paymentStatusEnum('status').notNull().default('pending'),
    createdAt: p.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: p
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    p.index('payments_status_created_idx').on(table.status, table.createdAt),
    p.check('payments_amount_positive_check', sql`${table.amount} > 0`),
    p.check(
      'payments_currency_lowercase_check',
      sql`${table.currency} = lower(${table.currency})`,
    ),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
