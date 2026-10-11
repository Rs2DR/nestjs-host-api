import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { IdSchema } from '@common/schemas/common.schema.js';

export const RentalListItemSchema = z.object({
  id: IdSchema,
  status: z.enum(['pending_payment', 'active', 'expired', 'cancelled']),
  hours: z.number().int().positive(),
  hourlyRate: z.number().int().positive(),
  totalAmount: z.number().int().positive(),
  currency: z.string().length(3),
  startedAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  createdAt: z.date(),
  server: z.object({
    id: IdSchema,
    name: z.string(),
    locationName: z.string(),
  }),
  slot: z.object({
    id: IdSchema,
    slotNumber: z.number().int().positive(),
    label: z.string(),
  }),
});

export class RentalListResponseDto extends createZodDto(
  z.array(RentalListItemSchema),
) {}
