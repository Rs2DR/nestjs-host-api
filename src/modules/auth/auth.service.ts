import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from '@common/interfaces/jwt-payload.interfaces.js';
import { User } from '@infrastructure/database/schema/users.js';
import { UsersService } from '@modules/users/users.service.js';
import * as bcrypt from 'bcrypt';

import { AUTH_ERRORS } from './auth.constants.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, name } = dto;

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException(AUTH_ERRORS.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser({
      name,
      email,
      passwordHash: hashedPassword,
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_DATA);
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
