import { IdSchema } from '@common/schemas/common.schema.js';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePaymentSchema = z.object({
  slotId: IdSchema,
  hours: z.coerce.number().int().min(1).max(720),
});

export class CreatePaymentDto extends createZodDto(CreatePaymentSchema) {}
