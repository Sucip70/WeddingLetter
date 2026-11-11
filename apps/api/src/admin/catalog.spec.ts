import { describe, expect, it, vi } from 'vitest';
import { catalogKey, installCatalogEntry, resolveCatalog } from './catalog.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { StorageService } from '../storage/storage.service.js';

describe('portable catalog', () => {
  it('validates published templates after resolving portable artwork URLs', async () => {
    const upsert = vi.fn();
    const prisma = { template: { upsert } } as unknown as PrismaService;
    const storage = { head: vi.fn().mockResolvedValue({}), publicUrl: (key: string) => `https://staging.example/${key}` } as unknown as StorageService;
    const key = 'templates/semi/v3/divider.webp';
    const data = {
      name: 'Standard Musim Semi', category: 'musim', tier: 'STANDARD', price: 75_000, includedWeeks: 4, status: 'PUBLISHED',
      layoutSchema: {
        sections: ['mempelai', 'tanggal_lokasi'],
        artwork: { designId: 'semi', artworkVersion: 3, assets: { divider: { default: { url: `storage://${key}`, storageKey: key, contentType: 'image/webp', width: 100, height: 100, sizeBytes: 1000 } } } },
      },
    };
    await installCatalogEntry(prisma, storage, { kind: 'template', id: 'spring', data });
    expect(upsert).toHaveBeenCalledOnce();
    await expect(installCatalogEntry(prisma, storage, { kind: 'template', id: 'spring', data: { ...data, layoutSchema: { ...data.layoutSchema, sections: ['mempelai'] } } })).rejects.toThrow('Tanggal & lokasi');
    expect(upsert).toHaveBeenCalledOnce();
  });
  it('resolves nested portable references using the destination hostname', () => {
    const keys = new Set<string>();
    expect(resolveCatalog({ photos: ['storage://templates/test/v1/a.webp'] }, { publicUrl: (key) => `https://staging.example/${key}` }, keys)).toEqual({ photos: ['https://staging.example/templates/test/v1/a.webp'] });
    expect([...keys]).toEqual(['templates/test/v1/a.webp']);
  });
  it('rejects traversal keys', () => {
    expect(catalogKey.safeParse('templates/../secret').success).toBe(false);
    expect(catalogKey.safeParse('/absolute').success).toBe(false);
  });
  it('does not write catalog data when an uploaded object is missing', async () => {
    const upsert = vi.fn();
    const prisma = { demoPhoto: { upsert } } as unknown as PrismaService;
    const storage = { head: vi.fn().mockResolvedValue(null), publicUrl: (key: string) => key } as unknown as StorageService;
    await expect(installCatalogEntry(prisma, storage, { kind: 'demoPhoto', id: 'cover', data: { storageKey: 'system/demo/cover.webp' } })).rejects.toThrow('Upload aset');
    expect(upsert).not.toHaveBeenCalled();
  });
});
