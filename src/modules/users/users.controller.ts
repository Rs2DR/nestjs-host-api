import { Body, Controller, Delete, Get, Post } from '@nestjs/common';

import { Auth } from '@common/decorators/auth.decorator.js';
import { CurrentUser } from '@common/decorators/user.decorator.js';
import { JwtPayload } from '@common/interfaces/jwt-payload.interfaces.js';
import { ZodResponse } from 'nestjs-zod';

import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { RegisterDeviceResponseDto } from './dto/register-device-response.dto.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import { RemoveDeviceDto } from './dto/remove-device.dto.js';
import { UsersService } from './users.service.js';

@Auth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ZodResponse({ type: ProfileResponseDto })
  async getProfile(@CurrentUser('sub') userId: JwtPayload['sub']) {
    return this.usersService.getProfile(userId);
  }

  @Post('me/devices')
  @ZodResponse({ type: RegisterDeviceResponseDto })
  async registerDevice(
    @CurrentUser('sub') userId: JwtPayload['sub'],
    @Body() body: RegisterDeviceDto,
  ) {
    return this.usersService.registerDevice(userId, body.fcmToken);
  }

  @Delete('me/devices')
  async removeDevice(
    @CurrentUser('sub') userId: JwtPayload['sub'],
    @Body() body: RemoveDeviceDto,
  ) {
    return this.usersService.removeDevice(userId, body.fcmToken);
  }
}
