import { Body, Controller, Post } from '@nestjs/common';

import { ZodResponse } from 'nestjs-zod';

import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ZodResponse({ type: AuthResponseDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ZodResponse({ type: AuthResponseDto })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
