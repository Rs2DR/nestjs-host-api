import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

import { RENTALS_QUEUE } from './rentals.constants.js';
import { RentalsController } from './rentals.controller.js';
import { RentalsListener } from './rentals.listener.js';
import { RentalsProcessor } from './rentals.processor.js';
import { RentalsRepository } from './rentals.repository.js';
import { RentalsService } from './rentals.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: RENTALS_QUEUE }),
    BullBoardModule.forFeature({
      name: RENTALS_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [RentalsController],
  providers: [
    RentalsRepository,
    RentalsService,
    RentalsProcessor,
    RentalsListener,
  ],
  exports: [RentalsService],
})
export class RentalsModule {}
