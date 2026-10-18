import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { serverSlots } from './server-slots.js';
import { servers } from './servers.js';
import { users } from './users.js';

export const rentalStatusEnum = p.pgEnum('rental_status', [
  'pending_payment',
  'active',
  'expired',
  'cancelled',
]);

export const rentals = p.pgTable(
  'rentals',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    userId: p
      .uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    serverId: p
      .uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'restrict' }),
    slotId: p
      .uuid('slot_id')
      .notNull()
      .references(() => serverSlots.id, { onDelete: 'restrict' }),
    status: rentalStatusEnum('status').notNull().default('pending_payment'),
    hours: p.integer('hours').notNull(),
    hourlyRate: p.integer('hourly_rate').notNull(),
    totalAmount: p.integer('total_amount').notNull(),
    currency: p.varchar('currency', { length: 3 }).notNull(),
    paymentExpiresAt: p.timestamp('payment_expires_at', { withTimezone: true }),
    startedAt: p.timestamp('started_at', { withTimezone: true }),
    endsAt: p.timestamp('ends_at', { withTimezone: true }),
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
  (table) => [
    p
      .uniqueIndex('rentals_one_open_rental_per_slot_unique')
      .on(table.slotId)
      .where(sql`${table.status} IN ('pending_payment', 'active')`),
    p.index('rentals_user_created_idx').on(table.userId, table.createdAt),
    p.index('rentals_status_end_time_idx').on(table.status, table.endsAt),
    p.check('rentals_hours_positive_check', sql`${table.hours} > 0`),
    p.check('rentals_hourly_rate_positive_check', sql`${table.hourlyRate} > 0`),
    p.check(
      'rentals_total_amount_positive_check',
      sql`${table.totalAmount} > 0`,
    ),
    p.check(
      'rentals_currency_lowercase_check',
      sql`${table.currency} = lower(${table.currency})`,
    ),
    p.check(
      'rentals_pending_has_expiry_check',
      sql`${table.status} <> 'pending_payment' OR ${table.paymentExpiresAt} IS NOT NULL`,
    ),
    p.check(
      'rentals_active_has_dates_check',
      sql`${table.status} <> 'active' OR (
        ${table.startedAt} IS NOT NULL AND
        ${table.endsAt} IS NOT NULL AND
        ${table.endsAt} > ${table.startedAt}
      )`,
    ),
  ],
);

export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;
