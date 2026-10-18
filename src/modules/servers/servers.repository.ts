import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, gt, notExists, or } from 'drizzle-orm';

import type { Database } from '@infrastructure/database/database.types.js';
import { rentals } from '@infrastructure/database/schema/rentals.js';
import { serverSlots } from '@infrastructure/database/schema/server-slots.js';
import { servers, type Server } from '@infrastructure/database/schema/servers.js';

@Injectable()
export class ServersRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findActiveById(id: Server['id']) {
    const [server] = await this.db
      .select()
      .from(servers)
      .where(and(eq(servers.id, id), eq(servers.isActive, true)))
      .limit(1);

    return server ?? null;
  }

  async listMapMarkers() {
    return this.db
      .select({
        id: servers.id,
        name: servers.name,
        latitude: servers.latitude,
        longitude: servers.longitude,
        locationName: servers.locationName,
        hourlyRate: servers.hourlyRate,
        currency: servers.currency,
        cpuModel: servers.cpuModel,
        cpuCores: servers.cpuCores,
        ramGb: servers.ramGb,
        storageGb: servers.storageGb,
      })
      .from(servers)
      .where(eq(servers.isActive, true))
      .orderBy(asc(servers.name));
  }

  async listAvailableSlots(serverId: Server['id'], now = new Date()) {
    const openRentalForSlot = this.db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.slotId, serverSlots.id),
          or(
            eq(rentals.status, 'active'),
            and(
              eq(rentals.status, 'pending_payment'),
              gt(rentals.paymentExpiresAt, now),
            ),
          ),
        ),
      );

    return this.db
      .select({
        id: serverSlots.id,
        slotNumber: serverSlots.slotNumber,
        label: serverSlots.label,
      })
      .from(serverSlots)
      .where(
        and(
          eq(serverSlots.serverId, serverId),
          eq(serverSlots.isEnabled, true),
          notExists(openRentalForSlot),
        ),
      )
      .orderBy(asc(serverSlots.slotNumber));
  }

  async countAvailableSlots(serverId: Server['id'], now = new Date()) {
    const slots = await this.listAvailableSlots(serverId, now);
    return slots.length;
  }
}
