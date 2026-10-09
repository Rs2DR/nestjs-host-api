import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { users } from './users.js';

export const userDevices = p.pgTable(
  'user_devices',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    userId: p
      .uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),
    fcmToken: p.varchar('fcm_token', { length: 500 }).notNull().unique(),
    createdAt: p.timestamp('created_at').notNull().defaultNow(),
    updatedAt: p
      .timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    p.check(
      'user_devices_fcm_token_not_empty_check',
      sql`length(trim(${table.fcmToken})) > 0`,
    ),
  ],
);

export type UserDevice = typeof userDevices.$inferSelect;
export type NewUserDevice = typeof userDevices.$inferInsert;
