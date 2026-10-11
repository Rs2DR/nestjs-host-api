import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { IdSchema } from '@common/schemas/common.schema.js';

export const RentalPaymentResponseSchema = z.object({
  rentalId: IdSchema,
  paymentIntentId: z.string().min(1),
  clientSecret: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  paymentExpiresAt: z.date(),
});

export class RentalPaymentResponseDto extends createZodDto(
  RentalPaymentResponseSchema,
) {}
