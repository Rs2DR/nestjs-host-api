import { sql } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

export const SERVER_TYPES = ['virtual', 'dedicated', 'edge'] as const;

export type ServerType = (typeof SERVER_TYPES)[number];

export const SERVER_STATUSES = ['online', 'offline', 'maintenance'] as const;

export type ServerStatus = (typeof SERVER_STATUSES)[number];

export const serverTypeEnum = p.pgEnum('server_type', SERVER_TYPES);

export const serverStatusEnum = p.pgEnum('server_status', SERVER_STATUSES);

export const servers = p.pgTable(
  'servers',
  {
    id: p.uuid('id').primaryKey().defaultRandom(),
    name: p.varchar('name', { length: 150 }).notNull(),
    description: p.text('description'),
    type: serverTypeEnum('type').notNull().default('virtual'),

    city: p.varchar('city', { length: 100 }).notNull(),
    countryCode: p.char('country_code', { length: 2 }).notNull(),
    region: p.varchar('region', { length: 100 }),

    latitude: p.doublePrecision('latitude').notNull(),
    longitude: p.doublePrecision('longitude').notNull(),

    cpuModel: p.varchar('cpu_model', { length: 255 }),
    cpuCores: p.integer('cpu_cores').notNull(),
    ramGb: p.integer('ram_gb').notNull(),
    storageGb: p.integer('storage_gb').notNull(),
    storageType: p.varchar('storage_type', { length: 50 }).notNull(),
    bandwidthMbps: p.integer('bandwidth_mbps').notNull(),
    monthlyTrafficGb: p.integer('monthly_traffic_gb'),

    hourlyPrice: p
      .numeric('hourly_price', {
        precision: 12,
        scale: 4,
      })
      .notNull(),
    currency: p.char('currency', { length: 3 }).notNull().default('USD'),

    status: serverStatusEnum('status').notNull().default('online'),

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
    p.check(
      'servers_latitude_range_check',
      sql`${table.latitude} BETWEEN -90 AND 90`,
    ),
    p.check(
      'servers_longitude_range_check',
      sql`${table.longitude} BETWEEN -180 AND 180`,
    ),
    p.check('servers_cpu_cores_check', sql`${table.cpuCores} > 0`),
    p.check('servers_ram_gb_check', sql`${table.ramGb} > 0`),
    p.check('servers_storage_gb_check', sql`${table.storageGb} > 0`),
    p.check('servers_bandwidth_mbps_check', sql`${table.bandwidthMbps} > 0`),
    p.check('servers_hourly_price_check', sql`${table.hourlyPrice} > 0`),
  ],
);

export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;
