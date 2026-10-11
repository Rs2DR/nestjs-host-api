import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { IdSchema } from '@common/schemas/common.schema.js';

const PriceSchema = z.number().int().positive();
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string(),
});

export const ServerMarkerSchema = z.object({
  id: IdSchema,
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  locationName: z.string(),
  hourlyRate: PriceSchema,
  currency: z.string().length(3),
  cpuModel: z.string(),
  cpuCores: z.number().int().positive(),
  ramGb: z.number().int().positive(),
  storageGb: z.number().int().positive(),
});

export class ServerMapResponseDto extends createZodDto(
  z.array(ServerMarkerSchema),
) {}

export const ServerDetailSchema = z.object({
  id: IdSchema,
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  ...LocationSchema.shape,
  cpuModel: z.string(),
  cpuCores: z.number().int().positive(),
  ramGb: z.number().int().positive(),
  storageGb: z.number().int().positive(),
  storageType: z.string(),
  bandwidthMbps: z.number().int().positive(),
  hourlyRate: PriceSchema,
  currency: z.string().length(3),
  availableSlots: z.number().int().nonnegative(),
});

export class ServerDetailResponseDto extends createZodDto(ServerDetailSchema) {}

export const AvailableSlotSchema = z.object({
  id: IdSchema,
  slotNumber: z.number().int().positive(),
  label: z.string(),
});

export class AvailableSlotsResponseDto extends createZodDto(
  z.array(AvailableSlotSchema),
) {}
