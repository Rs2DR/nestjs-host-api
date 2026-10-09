import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { servers } from './servers.js';
import { users } from './users.js';

export const RENTAL_STATUSES = [
  'pending_payment',
  'active',
  'completed',
  'cancelled',
  'payment_failed',
  'reservation_expired',
] as const;

export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const rentalStatusEnum = p.pgEnum('rental_status', RENTAL_STATUSES);

export const rentals = p.pgTable(
  'rentals',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    userId: p
      .uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
      }),
    serverId: p
      .uuid('server_id')
      .notNull()
      .references(() => servers.id, {
        onDelete: 'restrict',
      }),
    status: rentalStatusEnum('status').notNull().default('pending_payment'),
    hours: p.integer('hours').notNull(),

    hourlyPrice: p
      .numeric('hourly_price', {
        precision: 12,
        scale: 4,
      })
      .notNull(),
    totalAmount: p
      .numeric('total_amount', {
        precision: 12,
        scale: 2,
      })
      .notNull(),
    currency: p.char('currency', { length: 3 }).notNull(),

    reservationExpiresAt: p
      .timestamp('reservation_expires_at', {
        withTimezone: true,
      })
      .notNull(),
    startedAt: p.timestamp('started_at', {
      withTimezone: true,
    }),
    endsAt: p.timestamp('ends_at', {
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
  (table) => [
    p
      .uniqueIndex('rentals_one_open_per_server_idx')
      .on(table.serverId)
      .where(sql`${table.status} IN ('pending_payment', 'active')`),
    p.check('rentals_hours_check', sql`${table.hours} > 0`),
    p.check('rentals_hourly_price_check', sql`${table.hourlyPrice} > 0`),
    p.check('rentals_total_amount_check', sql`${table.totalAmount} >= 0`),
    p.check(
      'rentals_period_check',
      sql`${table.endsAt} IS NULL OR ${table.startedAt} IS NULL OR ${table.endsAt} > ${table.startedAt}`,
    ),
  ],
);

export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;
