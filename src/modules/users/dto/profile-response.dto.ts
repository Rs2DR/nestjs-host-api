import {
  EmailSchema,
  IdSchema,
  NameSchema,
} from '@common/schemas/common.schema.js';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const ProfileResponseSchema = z.object({
  id: IdSchema,
  name: NameSchema,
  email: EmailSchema,
});

export class ProfileResponseDto extends createZodDto(ProfileResponseSchema) {}
