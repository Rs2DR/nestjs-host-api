import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserDevice } from '@infrastructure/database/schema/user-devices.js';
import { NewUser, User } from '@infrastructure/database/schema/users.js';

import { USER_ERRORS } from './users.constants.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: User['id']) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return user;
  }

  async findByEmail(email: User['email']) {
    return this.usersRepository.findByEmail(email);
  }

  async createUser(data: NewUser) {
    const existingUser = await this.usersRepository.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException(USER_ERRORS.EMAIL_ALREADY_EXISTS);
    }

    return this.usersRepository.create(data);
  }

  async getProfile(id: User['id']) {
    const user = await this.findById(id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async registerDevice(userId: User['id'], fcmToken: UserDevice['fcmToken']) {
    return this.usersRepository.registerDevice(userId, fcmToken);
  }

  async removeDevice(userId: User['id'], fcmToken: UserDevice['fcmToken']) {
    return this.usersRepository.removeDevice(userId, fcmToken);
  }
}
