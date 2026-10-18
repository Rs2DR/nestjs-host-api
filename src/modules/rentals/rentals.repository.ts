import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';

import type { Database } from '@infrastructure/database/database.types.js';
import { payments } from '@infrastructure/database/schema/payments.js';
import {
  type Rental,
  rentals,
} from '@infrastructure/database/schema/rentals.js';
import { serverSlots } from '@infrastructure/database/schema/server-slots.js';
import { servers } from '@infrastructure/database/schema/servers.js';
import { userDevices } from '@infrastructure/database/schema/user-devices.js';
import { and, asc, desc, eq, gt, lte, notExists, or } from 'drizzle-orm';

export interface CreateReservationInput {
  userId: string;
  slotId: string;
  hours: number;
  paymentExpiresAt: Date;
}

type CreateReservationResult =
  | { rental: Rental; reason?: never }
  | { rental: null; reason: 'not_found' | 'taken' };

@Injectable()
export class RentalsRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async create(
    input: CreateReservationInput,
  ): Promise<CreateReservationResult> {
    return this.db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(rentals)
        .set({ status: 'cancelled', updatedAt: now })
        .where(
          and(
            eq(rentals.slotId, input.slotId),
            eq(rentals.status, 'pending_payment'),
            lte(rentals.paymentExpiresAt, now),
          ),
        );

      const [slot] = await tx
        .select({
          id: serverSlots.id,
          serverId: servers.id,
          hourlyRate: servers.hourlyRate,
          currency: servers.currency,
        })
        .from(serverSlots)
        .innerJoin(servers, eq(serverSlots.serverId, servers.id))
        .where(
          and(
            eq(serverSlots.id, input.slotId),
            eq(serverSlots.isEnabled, true),
            eq(servers.isActive, true),
          ),
        )
        .limit(1);

      if (!slot) {
        return { rental: null, reason: 'not_found' };
      }

      const [occupied] = await tx
        .select({ id: rentals.id })
        .from(rentals)
        .where(
          and(
            eq(rentals.slotId, input.slotId),
            or(
              eq(rentals.status, 'active'),
              and(
                eq(rentals.status, 'pending_payment'),
                gt(rentals.paymentExpiresAt, now),
              ),
            ),
          ),
        )
        .limit(1);

      if (occupied) {
        return { rental: null, reason: 'taken' };
      }

      const totalAmount = slot.hourlyRate * input.hours;
      if (
        !Number.isSafeInteger(totalAmount) ||
        totalAmount <= 0 ||
        totalAmount > 2_147_483_647
      ) {
        throw new Error(
          'Calculated rental amount is outside the supported range',
        );
      }

      const [rental] = await tx
        .insert(rentals)
        .values({
          userId: input.userId,
          serverId: slot.serverId,
          slotId: slot.id,
          status: 'pending_payment',
          hours: input.hours,
          hourlyRate: slot.hourlyRate,
          totalAmount,
          currency: slot.currency.toLowerCase(),
          paymentExpiresAt: input.paymentExpiresAt,
        })
        .returning();

      return rental ? { rental } : { rental: null, reason: 'not_found' };
    });
  }

  async findById(id: string): Promise<Rental | null> {
    const [rental] = await this.db
      .select()
      .from(rentals)
      .where(eq(rentals.id, id))
      .limit(1);

    return rental ?? null;
  }

  async activate(id: string): Promise<Rental | null> {
    const current = await this.findById(id);
    if (!current) return null;
    if (current.status === 'active') return current;
    if (
      current.status !== 'pending_payment' ||
      !current.paymentExpiresAt ||
      current.paymentExpiresAt <= new Date()
    ) {
      return null;
    }

    const startedAt = new Date();
    const endsAt = new Date(
      startedAt.getTime() + current.hours * 60 * 60 * 1000,
    );

    const [activated] = await this.db
      .update(rentals)
      .set({ status: 'active', startedAt, endsAt, updatedAt: startedAt })
      .where(
        and(
          eq(rentals.id, id),
          eq(rentals.status, 'pending_payment'),
          gt(rentals.paymentExpiresAt, startedAt),
        ),
      )
      .returning();

    if (activated) return activated;

    const latest = await this.findById(id);
    return latest?.status === 'active' ? latest : null;
  }

  async cancelReservation(id: string): Promise<boolean> {
    const [cancelled] = await this.db
      .update(rentals)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(rentals.id, id), eq(rentals.status, 'pending_payment')))
      .returning({ id: rentals.id });

    return Boolean(cancelled);
  }

  async cancelPendingIfExpired(id: string, now = new Date()): Promise<boolean> {
    const successfulPayment = this.db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.rentalId, id), eq(payments.status, 'succeeded')));

    const [cancelled] = await this.db
      .update(rentals)
      .set({ status: 'cancelled', updatedAt: now })
      .where(
        and(
          eq(rentals.id, id),
          eq(rentals.status, 'pending_payment'),
          lte(rentals.paymentExpiresAt, now),
          notExists(successfulPayment),
        ),
      )
      .returning({ id: rentals.id });

    return Boolean(cancelled);
  }

  async expireIfDue(id: string, now = new Date()): Promise<Rental | null> {
    const [rental] = await this.db
      .update(rentals)
      .set({ status: 'expired', updatedAt: now })
      .where(
        and(
          eq(rentals.id, id),
          eq(rentals.status, 'active'),
          lte(rentals.endsAt, now),
        ),
      )
      .returning();

    return rental ?? null;
  }

  async findReminderDetails(id: string) {
    const [details] = await this.db
      .select({
        rentalId: rentals.id,
        userId: rentals.userId,
        status: rentals.status,
        endsAt: rentals.endsAt,
        serverId: servers.id,
        serverName: servers.name,
        slotLabel: serverSlots.label,
      })
      .from(rentals)
      .innerJoin(servers, eq(rentals.serverId, servers.id))
      .innerJoin(serverSlots, eq(rentals.slotId, serverSlots.id))
      .where(eq(rentals.id, id))
      .limit(1);

    return details ?? null;
  }

  async listDeviceTokens(userId: string): Promise<string[]> {
    const devices = await this.db
      .select({ token: userDevices.fcmToken })
      .from(userDevices)
      .where(eq(userDevices.userId, userId));

    return devices.map(({ token }) => token);
  }

  async listForUser(userId: string) {
    return this.db
      .select({
        id: rentals.id,
        status: rentals.status,
        hours: rentals.hours,
        hourlyRate: rentals.hourlyRate,
        totalAmount: rentals.totalAmount,
        currency: rentals.currency,
        startedAt: rentals.startedAt,
        endsAt: rentals.endsAt,
        server: {
          id: servers.id,
          name: servers.name,
          locationName: servers.locationName,
        },
        slot: {
          id: serverSlots.id,
          slotNumber: serverSlots.slotNumber,
          label: serverSlots.label,
        },
      })
      .from(rentals)
      .innerJoin(servers, eq(rentals.serverId, servers.id))
      .innerJoin(serverSlots, eq(rentals.slotId, serverSlots.id))
      .where(eq(rentals.userId, userId))
      .orderBy(desc(rentals.createdAt), asc(rentals.id));
  }
}
