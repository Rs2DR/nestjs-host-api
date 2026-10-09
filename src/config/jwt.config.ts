import type { ConfigService } from '@nestjs/config';
import type { JwtModuleOptions } from '@nestjs/jwt';

export function createJwtConfig(
  configService: ConfigService,
): JwtModuleOptions {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),

    signOptions: {
      expiresIn: '15m',
    },
  };
}
