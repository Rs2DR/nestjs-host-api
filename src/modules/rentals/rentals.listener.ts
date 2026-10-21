import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import type { Queue } from 'bullmq';

import {
  RENTALS_EVENTS,
  RENTALS_JOBS,
  RENTALS_QUEUE,
  RENTAL_REMINDER_BEFORE_END_MS,
} from './rentals.constants.js';
import {
  RentalActivatedEvent,
  RentalCancelledEvent,
  RentalExpiredEvent,
} from './rentals.events.js';

interface RentalJobData {
  rentalId: string;
}

@Injectable()
export class RentalsListener {
  constructor(
    @InjectQueue(RENTALS_QUEUE)
    private readonly rentalsQueue: Queue<RentalJobData>,
  ) {}

  @OnEvent(RENTALS_EVENTS.ACTIVATED)
  async handleActivated(event: RentalActivatedEvent): Promise<void> {
    await this.removeJob(`rental-pending-expiry-${event.rentalId}`);

    const now = Date.now();
    await Promise.all([
      this.rentalsQueue.add(
        RENTALS_JOBS.EXPIRE,
        { rentalId: event.rentalId },
        {
          jobId: `rental-expire-${event.rentalId}`,
          delay: Math.max(0, event.endsAt.getTime() - now),
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      ),
      this.rentalsQueue.add(
        RENTALS_JOBS.REMIND,
        { rentalId: event.rentalId },
        {
          jobId: `rental-remind-${event.rentalId}`,
          delay: Math.max(
            0,
            event.endsAt.getTime() - RENTAL_REMINDER_BEFORE_END_MS - now,
          ),
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      ),
    ]);
  }

  @OnEvent(RENTALS_EVENTS.CANCELLED)
  async handleCancelled(event: RentalCancelledEvent): Promise<void> {
    await Promise.all([
      this.removeJob(`rental-pending-expiry-${event.rentalId}`),
      this.removeJob(`rental-expire-${event.rentalId}`),
      this.removeJob(`rental-remind-${event.rentalId}`),
    ]);
  }

  @OnEvent(RENTALS_EVENTS.EXPIRED)
  async handleExpired(event: RentalExpiredEvent): Promise<void> {
    await Promise.all([
      this.removeJob(`rental-pending-expiry-${event.rentalId}`),
      this.removeJob(`rental-remind-${event.rentalId}`),
    ]);
  }

  private async removeJob(jobId: string): Promise<void> {
    const job = await this.rentalsQueue.getJob(jobId);
    if (!job) return;

    try {
      await job.remove();
    } catch {
      // A job that is already being processed will finish; DB status checks make it harmless.
    }
  }
}
