import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { JwtPayload } from '@common/interfaces/jwt-payload.interfaces.js';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user: JwtPayload | undefined = request.user;

    return data ? user?.[data] : user;
  },
);
