import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { StorageService } from '../storage/storage.service.js';
import { assertPublishableLayout, templateBaseSchema } from './admin.dto.js';
import { DEMO_SLOTS } from '../demo-photos/demo-photos.slots.js';
import { parseBody } from '../auth/auth.dto.js';
import { isDeepStrictEqual } from 'node:util';

export const catalogKey = z.string().regex(/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)+$/).refine((key) => !key.split('/').includes('..'));
export const catalogEntrySchema = z.object({
  kind: z.enum(['template', 'demoPhoto', 'musicTrack', 'addOn']),
  id: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
  data: z.record(z.string(), z.unknown()),
});

// Portable catalog files contain storage:// keys, never a source provider hostname.
export function resolveCatalog(value: unknown, storage: Pick<StorageService, 'publicUrl'>, keys = new Set<string>()): unknown {
  if (typeof value === 'string' && value.startsWith('storage://')) {
    const key = catalogKey.parse(value.slice(10));
    keys.add(key);
    return storage.publicUrl(key);
  }
  if (Array.isArray(value)) return value.map((item) => resolveCatalog(item, storage, keys));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveCatalog(item, storage, keys)]));
  return value;
}

const musicSchema = z.object({
  title: z.string().min(1).max(120), artist: z.string().min(1).max(120),
  licenseType: z.enum(['PUBLIC_DOMAIN', 'CC0', 'ROYALTY_FREE', 'CC_BY', 'OTHER']),
  licenseNote: z.string().nullable(), sourceUrl: z.string().nullable(), attribution: z.string().nullable(),
  minTier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']), storageKey: catalogKey,
  sizeBytes: z.number().int().positive(), durationSec: z.number().int().positive().nullable(),
  sortOrder: z.number().int(), status: z.enum(['ACTIVE', 'ARCHIVED']),
});
const addOnSchema = z.object({ code: z.string().min(1), name: z.string().min(1), type: z.enum(['FLAT', 'PER_UNIT']), price: z.number().int().nonnegative(), unit: z.string().nullable() });

export function parseCatalogTemplate(resolved: unknown) {
  const data = parseBody(templateBaseSchema, resolved);
  if (data.status === 'PUBLISHED') assertPublishableLayout(data.layoutSchema, data.category);
  return data;
}

export async function installCatalogEntry(prisma: PrismaService, storage: StorageService, entry: z.infer<typeof catalogEntrySchema>) {
  const keys = new Set<string>();
  const resolved = resolveCatalog(entry.data, storage, keys);
  const template = entry.kind === 'template' ? parseCatalogTemplate(resolved) : undefined;
  if (entry.kind === 'demoPhoto' || entry.kind === 'musicTrack') keys.add(catalogKey.parse(entry.data.storageKey));
  for (const key of keys) if (!await storage.head(key)) throw new BadRequestException(`Upload aset terlebih dahulu: ${key}`);

  switch (entry.kind) {
    case 'template': {
      const data = template!;
      // The installed manifest is an immutable layout snapshot. Subsequent artwork drafts
      // can be published through the existing artwork API without source database IDs.
      return prisma.template.upsert({ where: { id: entry.id }, create: { id: entry.id, ...data }, update: { ...data, artworkVersionId: null } });
    }
    case 'demoPhoto': {
      if (!DEMO_SLOTS.some(({ slot }) => slot === entry.id)) throw new BadRequestException('Slot demo tidak valid');
      const data = parseBody(z.object({ storageKey: catalogKey }), resolved);
      return prisma.demoPhoto.upsert({ where: { slot: entry.id }, create: { slot: entry.id, ...data }, update: data });
    }
    case 'musicTrack': {
      const data = parseBody(musicSchema, resolved);
      return prisma.musicTrack.upsert({ where: { id: entry.id }, create: { id: entry.id, ...data }, update: data });
    }
    case 'addOn': {
      const data = parseBody(addOnSchema, resolved);
      return prisma.addOn.upsert({ where: { code: data.code }, create: data, update: data });
    }
  }
}

export async function verifyCatalogEntry(prisma: PrismaService, storage: StorageService, entry: z.infer<typeof catalogEntrySchema>) {
  const expected = resolveCatalog(entry.data, storage) as Record<string, unknown>;
  let actual: unknown;
  switch (entry.kind) {
    case 'template': {
      const row = await prisma.template.findUnique({ where: { id: entry.id } });
      actual = row ? templateBaseSchema.parse(row) : null;
      break;
    }
    case 'demoPhoto': actual = await prisma.demoPhoto.findUnique({ where: { slot: entry.id } }); break;
    case 'musicTrack': actual = await prisma.musicTrack.findUnique({ where: { id: entry.id } }); break;
    case 'addOn': actual = await prisma.addOn.findUnique({ where: { code: String(expected.code) } }); break;
  }
  const schemaExpected = entry.kind === 'template' ? templateBaseSchema.parse(expected) : expected;
  const subset = actual && typeof actual === 'object' ? Object.fromEntries(Object.keys(schemaExpected).map((key) => [key, (actual as Record<string, unknown>)[key]])) : null;
  if (!isDeepStrictEqual(subset, schemaExpected)) throw new BadRequestException(`Katalog tujuan berbeda: ${entry.kind}/${entry.id}`);
  return { ok: true };
}
