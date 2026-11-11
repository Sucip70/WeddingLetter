import { z } from 'zod';
import { BadRequestException } from '@nestjs/common';
import { LIMITS } from '../config/constants.js';
import { layoutIncludes, layoutInputSchema, normalizeLayout } from '../templates/layout.js';
import { ARTWORK_SLOTS, ARTWORK_VARIANTS, DEFAULT_ARTWORK_PRESENTATION, artworkFallbackSchema, artworkPresentationSchema } from '../templates/artwork.js';

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

export function assertPublishableLayout(layoutSchema: unknown, category: string) {
  const layout = normalizeLayout(layoutSchema, category);
  if (!layoutIncludes(layout, 'mempelai') || !layoutIncludes(layout, 'tanggal_lokasi')) {
    throw new BadRequestException('Template yang dipublikasikan harus memuat section Mempelai dan Tanggal & lokasi');
  }
}

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

export const assetPresignSchema = z
  .object({
    kind: z.enum(['image', 'audio']),
    purpose: z.enum(['template-thumbnail', 'template-sample', 'template-audio', 'demo-photo', 'music-library']).optional(),
    designId: z.string().regex(/^[a-z0-9-]{2,80}$/).optional(),
    templateId: z.string().regex(/^[A-Za-z0-9_-]{2,120}$/).optional(),
    slot: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/).optional(),
    contentType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    const audioPurpose = value.purpose === 'template-audio' || value.purpose === 'music-library';
    if (value.purpose && (value.kind === 'audio') !== audioPurpose) {
      ctx.addIssue({ code: 'custom', path: ['purpose'], message: 'Purpose tidak sesuai jenis aset' });
    }
  });

export const artworkDraftSchema = z.object({
  designId: z.string().regex(/^[a-z0-9-]{2,80}$/).optional(),
});

export const artworkUploadSchema = z.object({
  slot: z.enum(ARTWORK_SLOTS),
  variant: z.enum(ARTWORK_VARIANTS).default('default'),
  contentType: z.enum(['image/webp', 'image/png', 'image/avif']),
  sizeBytes: z.number().int().positive().max(12 * 1024 * 1024),
});

export const artworkConfirmSchema = z.object({
  slot: z.enum(ARTWORK_SLOTS),
  variant: z.enum(ARTWORK_VARIANTS).default('default'),
  storageKey: z.string().max(300),
});

export const artworkPublishSchema = z.object({
  presentation: artworkPresentationSchema.default(DEFAULT_ARTWORK_PRESENTATION),
  fallback: artworkFallbackSchema,
});
