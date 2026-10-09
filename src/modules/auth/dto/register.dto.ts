import {
  EmailSchema,
  NameSchema,
  PasswordSchema,
} from '@common/schemas/common.schema.js';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
