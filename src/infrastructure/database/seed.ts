import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema/index.js';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle({ client: pool });

async function main() {
  console.log('⏳ Clearing data...');
  await db.execute(
    `TRUNCATE TABLE parking_sessions, parking_spots, parking_lots, vehicles, users RESTART IDENTITY CASCADE;`,
  );

  console.log('🌱 Injecting ?...');

  console.log('🌱 Injecting ?...');

  console.log('✅ Base records seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => pool.end());
