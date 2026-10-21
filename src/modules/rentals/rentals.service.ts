import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationRequestedEvent } from '@modules/notifications/events/notification-requested.event.js';
import { NOTIFICATIONS_EVENTS } from '@modules/notifications/notifications.constants.js';
import type { Queue } from 'bullmq';

import {
  RENTALS_EVENTS,
  RENTALS_JOBS,
  RENTALS_QUEUE,
  RENTAL_ERRORS,
  RENTAL_PAYMENT_RESERVATION_MS,
  RENTAL_REMINDER_BEFORE_END_MS,
} from './rentals.constants.js';
import {
  RentalActivatedEvent,
  RentalCancelledEvent,
  RentalExpiredEvent,
} from './rentals.events.js';
import { RentalsRepository } from './rentals.repository.js';

interface CreateRentalInput {
  userId: string;
  slotId: string;
  hours: number;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  return error.code === '23505';
}

@Injectable()
export class RentalsService {
  constructor(
    private readonly rentalsRepository: RentalsRepository,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(RENTALS_QUEUE) private readonly rentalsQueue: Queue,
  ) {}

  async createReservation(input: CreateRentalInput) {
    const paymentExpiresAt = new Date(
      Date.now() + RENTAL_PAYMENT_RESERVATION_MS,
    );

    let result: Awaited<ReturnType<RentalsRepository['create']>>;
    try {
      result = await this.rentalsRepository.create({
        ...input,
        paymentExpiresAt,
      });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(RENTAL_ERRORS.SLOT_TAKEN);
      }
      throw error;
    }

    if (!result.rental) {
      if (result.reason === 'taken') {
        throw new ConflictException(RENTAL_ERRORS.SLOT_TAKEN);
      }
      throw new NotFoundException(RENTAL_ERRORS.SLOT_NOT_FOUND);
    }
    const rental = result.rental;

    try {
      await this.rentalsQueue.add(
        RENTALS_JOBS.CANCEL_PENDING,
        { rentalId: rental.id },
        {
          jobId: this.pendingJobId(rental.id),
          delay: Math.max(0, paymentExpiresAt.getTime() - Date.now()),
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      );
    } catch (error: unknown) {
      await this.cancelReservation(rental.id);
      throw new InternalServerErrorException(
        'Unable to schedule reservation expiration',
        { cause: error },
      );
    }

    return rental;
  }

  async activateAfterPayment(rentalId: string) {
    const rental = await this.rentalsRepository.activate(rentalId);
    if (!rental) return null;

    if (rental.status === 'active' && rental.endsAt) {
      await this.eventEmitter.emitAsync(
        RENTALS_EVENTS.ACTIVATED,
        new RentalActivatedEvent(rental.id, rental.endsAt),
      );

      this.queueRentalReminder(rentalId);
    }

    return rental;
  }

  async cancelReservation(rentalId: string): Promise<void> {
    const cancelled = await this.rentalsRepository.cancelReservation(rentalId);
    if (!cancelled) return;

    await this.eventEmitter.emitAsync(
      RENTALS_EVENTS.CANCELLED,
      new RentalCancelledEvent(rentalId),
    );
  }

  async expirePendingRental(rentalId: string): Promise<void> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental || rental.status !== 'pending_payment') return;

    const remainingMs = rental.paymentExpiresAt
      ? rental.paymentExpiresAt.getTime() - Date.now()
      : 0;

    if (remainingMs > 0) {
      await this.rentalsQueue.add(
        RENTALS_JOBS.CANCEL_PENDING,
        { rentalId },
        {
          jobId: `rental-pending-expiry-recheck-${rentalId}-${Date.now()}`,
          delay: remainingMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      );
      return;
    }

    const cancelled =
      await this.rentalsRepository.cancelPendingIfExpired(rentalId);

    if (cancelled) {
      await this.eventEmitter.emitAsync(
        RENTALS_EVENTS.CANCELLED,
        new RentalCancelledEvent(rentalId),
      );
    }
  }

  async expireRental(rentalId: string): Promise<void> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental || rental.status !== 'active' || !rental.endsAt) return;

    const remainingMs = rental.endsAt.getTime() - Date.now();
    if (remainingMs > 0) {
      await this.rentalsQueue.add(
        RENTALS_JOBS.EXPIRE,
        { rentalId },
        {
          jobId: `rental-expire-recheck-${rentalId}-${Date.now()}`,
          delay: remainingMs,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      );
      return;
    }

    const expired = await this.rentalsRepository.expireIfDue(rentalId);
    if (expired) {
      await this.eventEmitter.emitAsync(
        RENTALS_EVENTS.EXPIRED,
        new RentalExpiredEvent(rentalId),
      );
    }
  }

  async queueRentalReminder(rentalId: string): Promise<void> {
    const details = await this.rentalsRepository.findReminderDetails(rentalId);
    if (!details || details.status !== 'active' || !details.endsAt) return;

    const reminderAt = details.endsAt.getTime() - RENTAL_REMINDER_BEFORE_END_MS;
    const delay = reminderAt - Date.now();

    if (details.endsAt.getTime() <= Date.now()) return;

    const tokens = await this.rentalsRepository.listDeviceTokens(
      details.userId,
    );
    await this.eventEmitter.emitAsync(
      NOTIFICATIONS_EVENTS.REQUESTED,
      new NotificationRequestedEvent(
        tokens,
        'Your server rental ends soon',
        `Rental for ${details.serverName}, slot ${details.slotLabel} ends in about one hour.`,
        {
          type: 'rental-ending-soon',
          rentalId,
          serverId: details.serverId,
        },
        delay,
      ),
    );
  }

  async listForUser(userId: string) {
    const rentals = await this.rentalsRepository.listForUser(userId);

    return rentals.map((rental) => ({
      id: rental.id,
      status: rental.status,
      hours: rental.hours,
      hourlyRate: rental.hourlyRate,
      totalAmount: rental.totalAmount,
      currency: rental.currency,
      startedAt: rental.startedAt?.toISOString() ?? null,
      endsAt: rental.endsAt?.toISOString() ?? null,
      server: {
        id: rental.server.id,
        name: rental.server.name,
        locationName: rental.server.locationName,
      },
      slot: {
        id: rental.slot.id,
        slotNumber: rental.slot.slotNumber,
        label: rental.slot.label,
      },
    }));
  }

  private pendingJobId(rentalId: string): string {
    return `rental-pending-expiry-${rentalId}`;
  }
}
