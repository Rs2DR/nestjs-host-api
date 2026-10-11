import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function main() {
  const examples = [
    {
      slug: 'ams-edge-01',
      name: 'Amsterdam Edge 01',
      description: 'Low-latency compute server in Amsterdam.',
      locationName: 'Amsterdam, Netherlands',
      latitude: 52.3676,
      longitude: 4.9041,
      cpuModel: 'AMD EPYC 9354P',
      cpuCores: 16,
      ramGb: 128,
      storageGb: 2000,
      storageType: 'NVMe SSD',
      bandwidthMbps: 10_000,
      hourlyRate: 250,
      currency: 'eur',
      isActive: true,
    },
    {
      slug: 'fra-edge-01',
      name: 'Frankfurt Edge 01',
      description: 'General purpose compute server in Frankfurt.',
      locationName: 'Frankfurt, Germany',
      latitude: 50.1109,
      longitude: 8.6821,
      cpuModel: 'AMD EPYC 9354P',
      cpuCores: 32,
      ramGb: 256,
      storageGb: 4000,
      storageType: 'NVMe SSD',
      bandwidthMbps: 25_000,
      hourlyRate: 400,
      currency: 'eur',
      isActive: true,
    },
  ] as const;

  for (const server of examples) {
    const [savedServer] = await db
      .insert(schema.servers)
      .values(server)
      .onConflictDoUpdate({
        target: schema.servers.slug,
        set: { ...server, updatedAt: new Date() },
      })
      .returning({ id: schema.servers.id });

    if (!savedServer) {
      throw new Error(`Unable to seed server ${server.slug}`);
    }

    for (let slotNumber = 1; slotNumber <= 8; slotNumber += 1) {
      await db
        .insert(schema.serverSlots)
        .values({
          serverId: savedServer.id,
          slotNumber,
          label: `Slot ${slotNumber}`,
        })
        .onConflictDoNothing({
          target: [schema.serverSlots.serverId, schema.serverSlots.slotNumber],
        });
    }
  }

  console.log('Demo servers and slots seeded successfully.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
