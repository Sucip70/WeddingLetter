import { z } from 'zod';
import { LIMITS } from '../config/constants.js';
import { layoutInputSchema } from '../templates/layout.js';

export const templateBaseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().toLowerCase().min(2).max(30),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  price: z.number().int().min(0).max(10_000_000),
  includedWeeks: z.number().int().min(1).max(LIMITS.maxWeeks),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  thumbnailUrl: z.string().url().max(500).nullable().optional(),
  layoutSchema: layoutInputSchema,
});
export const templateCreateSchema = templateBaseSchema;
export const templateUpdateSchema = templateBaseSchema.partial();

export const addOnUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  price: z.number().int().min(0).max(10_000_000).optional(),
});

const couponBase = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, 'Kode kupon 3–30 karakter: huruf, angka, - atau _'),
  type: z.enum(['PERCENT', 'NOMINAL']),
  value: z.number().int().min(1),
  quota: z.number().int().min(1).nullable().optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
export const couponCreateSchema = couponBase.refine((c) => c.type !== 'PERCENT' || c.value <= 100, { message: 'Persentase maksimal 100', path: ['value'] });
export const couponUpdateSchema = couponBase.partial().omit({ code: true });

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const refundSchema = z.object({ force: z.boolean().default(false) });
export const markPaidSchema = z.object({ note: z.string().trim().max(200).optional() });
export const resumeSchema = z.object({ extraDays: z.number().int().min(0).max(365).default(0) });
export const extendSchema = z.object({ weeks: z.number().int().min(1).max(LIMITS.maxWeeks) });
export const setExpirySchema = z.object({ expiresAt: z.coerce.date() });
export const userRoleSchema = z.object({ role: z.enum(['USER', 'ADMIN']) });

export const assetPresignSchema = z.object({
  kind: z.enum(['image', 'audio']),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
});
