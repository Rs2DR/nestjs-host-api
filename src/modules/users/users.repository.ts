import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';

import { type Database } from '@infrastructure/database/database.types.js';
import {
  UserDevice,
  userDevices,
} from '@infrastructure/database/schema/user-devices.js';
import { NewUser, User, users } from '@infrastructure/database/schema/users.js';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async findById(id: User['id']) {
    const result = await this.db.query.users.findFirst({
      where: {
        id,
      },
    });

    return result ?? null;
  }

  async findByEmail(email: User['email']) {
    const result = await this.db.query.users.findFirst({
      where: {
        email,
      },
    });

    return result ?? null;
  }

  async create(data: NewUser) {
    const [user] = await this.db.insert(users).values(data).returning();

    return user ?? null;
  }

  async registerDevice(userId: User['id'], fcmToken: UserDevice['fcmToken']) {
    const [device] = await this.db
      .insert(userDevices)
      .values({
        userId,
        fcmToken,
      })
      .onConflictDoUpdate({
        target: userDevices.fcmToken,

        set: {
          userId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return device ?? null;
  }

  async removeDevice(userId: User['id'], fcmToken: UserDevice['fcmToken']) {
    await this.db
      .delete(userDevices)
      .where(
        and(eq(userDevices.fcmToken, fcmToken), eq(userDevices.userId, userId)),
      )
      .returning();
  }
}
