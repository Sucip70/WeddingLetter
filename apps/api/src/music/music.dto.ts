import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

const trackBase = z.object({
  title: z.string().trim().min(1).max(120),
  // Komposer / pemain / label.
  artist: z.string().trim().min(1).max(120),
  licenseType: z.enum(['PUBLIC_DOMAIN', 'CC0', 'ROYALTY_FREE', 'CC_BY', 'OTHER']),
  licenseNote: optionalText(300),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .transform((v) => (v === '' ? null : v))
    .pipe(z.string().url().nullable())
    .optional(),
  attribution: optionalText(300),
  minTier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  durationSec: z.number().int().min(1).max(3600).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

// `key` = hasil POST /admin/assets/presign (kind "audio") setelah file selesai diunggah.
export const trackCreateSchema = trackBase.extend({
  key: z.string().regex(/^assets\/[A-Za-z0-9_-]+\.(mp3|m4a|aac|ogg)$/, 'Kunci file tidak valid'),
});
export const trackUpdateSchema = trackBase.partial().extend({ status: z.enum(['ACTIVE', 'ARCHIVED']).optional() });

export type TrackCreate = z.infer<typeof trackCreateSchema>;
export type TrackUpdate = z.infer<typeof trackUpdateSchema>;
