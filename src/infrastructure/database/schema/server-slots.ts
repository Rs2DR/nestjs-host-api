import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { servers } from './servers.js';

export const serverSlots = p.pgTable(
  'server_slots',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    serverId: p
      .uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    slotNumber: p.integer('slot_number').notNull(),
    label: p.varchar('label', { length: 100 }).notNull(),
    isEnabled: p.boolean('is_enabled').notNull().default(true),
    createdAt: p.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: p
      .timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    p.unique('server_slots_server_number_unique').on(
      table.serverId,
      table.slotNumber,
    ),
    p.index('server_slots_server_id_idx').on(table.serverId),
    p.check('server_slots_number_positive_check', sql`${table.slotNumber} > 0`),
    p.check(
      'server_slots_label_not_empty_check',
      sql`length(trim(${table.label})) > 0`,
    ),
  ],
);

export type ServerSlot = typeof serverSlots.$inferSelect;
export type NewServerSlot = typeof serverSlots.$inferInsert;
