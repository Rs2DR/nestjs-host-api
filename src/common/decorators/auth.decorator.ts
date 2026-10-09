import { UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { AuthGuard } from '@common/guards/auth.guard.js';

export function Auth() {
  return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('access-token'));
}
