import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

export const users = p.pgTable(
  'users',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    name: p.varchar({ length: 255 }).notNull(),
    email: p.varchar({ length: 255 }).notNull().unique(),
    passwordHash: p.varchar('password_hash', { length: 255 }).notNull(),
    createdAt: p.timestamp('created_at').notNull().defaultNow(),
    updatedAt: p
      .timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    p.check('users_name_not_empty_check', sql`length(trim(${table.name})) > 0`),
    p.check(
      'users_email_not_empty_check',
      sql`length(trim(${table.email})) > 0`,
    ),
    p.check(
      'users_password_hash_not_empty_check',
      sql`length(${table.passwordHash}) > 0`,
    ),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
