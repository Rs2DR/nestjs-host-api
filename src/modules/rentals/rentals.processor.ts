import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import type { Job } from 'bullmq';

import { RENTALS_JOBS, RENTALS_QUEUE } from './rentals.constants.js';
import { RentalsService } from './rentals.service.js';

interface RentalJobData {
  rentalId: string;
}

@Processor(RENTALS_QUEUE)
@Injectable()
export class RentalsProcessor extends WorkerHost {
  constructor(private readonly rentalsService: RentalsService) {
    super();
  }

  async process(job: Job<RentalJobData>): Promise<void> {
    switch (job.name) {
      case RENTALS_JOBS.CANCEL_PENDING:
        await this.rentalsService.expirePendingRental(job.data.rentalId);
        return;

      case RENTALS_JOBS.EXPIRE:
        await this.rentalsService.expireRental(job.data.rentalId);
        return;

      case RENTALS_JOBS.REMIND:
        await this.rentalsService.queueRentalReminder(job.data.rentalId);
        return;

      default:
        throw new Error(`Unknown rental job: ${job.name}`);
    }
  }
}
