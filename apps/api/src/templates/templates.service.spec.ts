import { describe, expect, it, vi } from 'vitest';
import type { Template } from '../generated/prisma/client.js';
import { artworkManifestSchema } from './artwork.js';
import { toListTemplate, toPublicTemplate } from './templates.service.js';
import { AdminService } from '../admin/admin.service.js';

function fixture(designId: string): Template {
  const storageKey = `templates/${designId}/v1/paper.webp`;
  return {
    id: designId, name: designId, category: 'klasik', tier: 'PREMIUM', price: 100000,
    includedWeeks: 4, status: 'PUBLISHED', showOnHome: false, homeOrder: 0,
    thumbnailUrl: null, createdById: null, artworkVersionId: null, createdAt: new Date(), updatedAt: new Date(),
    layoutSchema: {
      theme: { preset: designId, motif: designId }, sections: ['cover', 'mempelai', 'tanggal_lokasi'],
      artwork: artworkManifestSchema.parse({
        designId, artworkVersion: 1,
        assets: { stationeryBackground: { default: {
          url: `https://cdn.example.com/${storageKey}`, storageKey,
          contentType: 'image/webp', width: 850, height: 1850, sizeBytes: 200000,
        } } },
      }),
    },
  };
}

describe('thumbnail artwork in catalog responses', () => {
  it.each(['garden', 'lavender', 'wisteria', 'marigold', 'hortensia', 'semi', 'jawa-sekar-keraton'])(
    'preserves published artwork for %s in public and admin lists', async (designId) => {
      const template = fixture(designId);
      const detail = toPublicTemplate(template, []);
      const catalog = toListTemplate(template, []);
      expect(catalog.layout.artwork).toEqual(detail.layout.artwork);
      expect(catalog.layout.artwork?.assets.stationeryBackground?.default?.url).toBe(
        `https://cdn.example.com/templates/${designId}/v1/paper.webp`,
      );
      expect(catalog.layout.sections.every((s) => s.fields.length === 0)).toBe(true);
      expect(catalog.layout.musik.presets).toEqual([]);

      type Args = ConstructorParameters<typeof AdminService>;
      const prisma = { template: { findMany: vi.fn().mockResolvedValue([{ ...template, _count: { orders: 0 } }]) } };
      const admin = new AdminService(prisma as unknown as Args[0], {} as Args[1], {} as Args[2], {} as Args[3]);
      const [row] = await admin.listTemplates();
      expect(row.artwork).toEqual(detail.layout.artwork);
    },
  );

  it('continues supporting legacy templates without artwork', () => {
    const template = fixture('rustic');
    template.layoutSchema = { theme: { preset: 'rustic' }, sections: ['cover'] };
    expect(toListTemplate(template, []).layout.artwork).toBeUndefined();
  });
});
