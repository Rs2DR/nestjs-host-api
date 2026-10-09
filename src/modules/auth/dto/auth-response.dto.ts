import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const AuthResponseSchema = z.object({
  accessToken: z.string({
    error: 'Invalid token format',
  }),
});

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
