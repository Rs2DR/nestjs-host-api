import { EmailSchema, PasswordSchema } from '@common/schemas/common.schema.js';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export class LoginDto extends createZodDto(LoginSchema) {}
