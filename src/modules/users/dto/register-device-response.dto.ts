import { IdSchema } from '@common/schemas/common.schema.js';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const RegisterDeviceResponseSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  fcmToken: z.string(),
});

export class RegisterDeviceResponseDto extends createZodDto(
  RegisterDeviceResponseSchema,
) {}
