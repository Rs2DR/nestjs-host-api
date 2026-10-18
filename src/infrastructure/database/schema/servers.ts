import { sql } from 'drizzle-orm'
import * as p from 'drizzle-orm/pg-core'

export const servers = p.pgTable(
	'servers',
	{
		id: p.uuid('id').primaryKey().defaultRandom(),
		slug: p.varchar('slug', { length: 120 }).notNull().unique(),
		name: p.varchar('name', { length: 255 }).notNull(),
		description: p.text('description').notNull().default(''),
		locationName: p.varchar('location_name', { length: 255 }).notNull(),
		latitude: p.doublePrecision('latitude').notNull(),
		longitude: p.doublePrecision('longitude').notNull(),
		cpuModel: p.varchar('cpu_model', { length: 255 }).notNull(),
		cpuCores: p.integer('cpu_cores').notNull(),
		ramGb: p.integer('ram_gb').notNull(),
		storageGb: p.integer('storage_gb').notNull(),
		storageType: p
			.varchar('storage_type', { length: 32 })
			.notNull()
			.default('NVMe SSD'),
		bandwidthMbps: p.integer('bandwidth_mbps').notNull(),
		hourlyRate: p.integer('hourly_rate').notNull(),
		currency: p.varchar('currency', { length: 3 }).notNull().default('eur'),
		isActive: p.boolean('is_active').notNull().default(true),
		createdAt: p
			.timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: p
			.timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdateFn(() => new Date())
	},
	table => [
		p.index('servers_is_active_idx').on(table.isActive),
		p.check(
			'servers_name_not_empty_check',
			sql`length(trim(${table.name})) > 0`
		),
		p.check(
			'servers_slug_not_empty_check',
			sql`length(trim(${table.slug})) > 0`
		),
		p.check(
			'servers_latitude_range_check',
			sql`${table.latitude} >= -90 AND ${table.latitude} <= 90`
		),
		p.check(
			'servers_longitude_range_check',
			sql`${table.longitude} >= -180 AND ${table.longitude} <= 180`
		),
		p.check('servers_cpu_cores_positive_check', sql`${table.cpuCores} > 0`),
		p.check('servers_ram_positive_check', sql`${table.ramGb} > 0`),
		p.check('servers_storage_positive_check', sql`${table.storageGb} > 0`),
		p.check(
			'servers_bandwidth_positive_check',
			sql`${table.bandwidthMbps} > 0`
		),
		p.check('servers_hourly_rate_positive_check', sql`${table.hourlyRate} > 0`),
		p.check(
			'servers_currency_lowercase_check',
			sql`${table.currency} = lower(${table.currency})`
		)
	]
)

export type Server = typeof servers.$inferSelect
export type NewServer = typeof servers.$inferInsert
