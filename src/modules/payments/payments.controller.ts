import { Body, Controller, Post } from '@nestjs/common';

import { Auth } from '@common/decorators/auth.decorator.js';
import { CurrentUser } from '@common/decorators/user.decorator.js';
import { JwtPayload } from '@common/interfaces/jwt-payload.interfaces.js';
import { ZodResponse } from 'nestjs-zod';

import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentResponseDto } from './dto/payment-response.dto.js';
import { PaymentsService } from './payments.service.js';

@Auth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ZodResponse({ type: PaymentResponseDto })
  async createPaymentIntent(
    @CurrentUser('sub') userId: JwtPayload['sub'],
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      userId,
      dto.slotId,
      dto.hours,
    );
  }
}
