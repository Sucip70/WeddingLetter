import { z } from 'zod';
import { LIMITS, USER_SELECTABLE_ADDONS } from '../config/constants.js';

export const mediaDeclSchema = z.object({
  // ID sementara dari browser; dipakai di `data` untuk merujuk file, lalu diganti id media final.
  clientId: z.string().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/, 'clientId tidak valid'),
  type: z.enum(['PHOTO', 'VIDEO', 'SONG']),
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
  weeks: z.number().int().min(1).max(LIMITS.maxWeeks).optional(),
});

// Dipakai bersama oleh kalkulator (POST /pricing/quote) dan pembuatan order (POST /orders).
export const orderInputSchema = z.object({
  templateId: z.string().min(1),
  weeks: z.number().int().min(1).max(LIMITS.maxWeeks),
  data: z.record(z.string(), z.unknown()).default({}),
  media: z.array(mediaDeclSchema).max(LIMITS.maxMediaPerInvitation).default([]),
  addOns: z.array(z.enum(USER_SELECTABLE_ADDONS)).max(USER_SELECTABLE_ADDONS.length).default([]),
  couponCode: z.string().trim().min(1).max(40).optional(),
  // Slug/link custom (butuh add-on CUSTOM_DOMAIN).
  customSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/, 'Link custom 3–30 karakter: huruf kecil, angka, atau tanda hubung')
    .optional(),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

export const extensionInputSchema = z.object({
  weeks: z.number().int().min(1).max(LIMITS.maxWeeks),
  couponCode: z.string().trim().min(1).max(40).optional(),
});
export type ExtensionOrderInput = z.infer<typeof extensionInputSchema>;
