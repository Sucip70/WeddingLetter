import { describe, expect, it, vi } from 'vitest';
import { catalogKey, installCatalogEntry, resolveCatalog } from './catalog.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { StorageService } from '../storage/storage.service.js';

describe('portable catalog', () => {
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
