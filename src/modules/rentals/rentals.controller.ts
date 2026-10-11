import { Controller, Get } from '@nestjs/common';

import { Auth } from '@common/decorators/auth.decorator.js';
import { CurrentUser } from '@common/decorators/user.decorator.js';
import type { JwtPayload } from '@common/interfaces/jwt-payload.interfaces.js';
import { ZodResponse } from 'nestjs-zod';

import { RentalListResponseDto } from './dto/rental-list-response.dto.js';
import { RentalsService } from './rentals.service.js';

@Auth()
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get('me')
  @ZodResponse({ type: RentalListResponseDto })
  listForCurrentUser(@CurrentUser('sub') userId: JwtPayload['sub']) {
    return this.rentalsService.listForUser(userId);
  }
}
