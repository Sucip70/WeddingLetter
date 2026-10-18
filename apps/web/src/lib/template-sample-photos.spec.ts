import { describe, expect, it } from 'vitest';
import { resolveTemplateSamplePhotos, SEKAR_KERATON_SAMPLE_PHOTOS } from './template-sample-photos';

describe('resolveTemplateSamplePhotos', () => {
  it('adds the complete Sekar Keraton set and keeps unused global slots', () => {
    const global = { cover: '/global-cover.webp', groom: '/global-groom.webp', gallery3: '/global-gallery-3.webp' };

    expect(resolveTemplateSamplePhotos({ artwork: { designId: 'jawa-sekar-keraton' } }, global)).toEqual({
      ...global,
      ...SEKAR_KERATON_SAMPLE_PHOTOS,
    });
  });

  it('keeps the approved Sekar Keraton set ahead of stale per-template photos', () => {
    const photos = resolveTemplateSamplePhotos(
      {
        artwork: { designId: 'jawa-sekar-keraton' },
        samplePhotos: { cover: 'https://cdn.example.com/cover.webp', gallery1: 'https://cdn.example.com/walking.webp' },
      },
      { cover: '/global-cover.webp', gallery1: '/global-walking.webp' },
    );

    expect(photos.cover).toBe('/samples/sekar-keraton/cover.webp');
    expect(photos.groom).toBe('/samples/sekar-keraton/groom-v2.webp');
    expect(photos.bride).toBe('/samples/sekar-keraton/bride-v2.webp');
    expect(photos.gallery1).toBe('/samples/sekar-keraton/gallery-walking.webp');
    expect(photos.gallery2).toBe('/samples/sekar-keraton/gallery-romantic.webp');
  });

  it('does not add Sekar Keraton photos to unrelated designs', () => {
    const global = { cover: '/global-cover.webp', groom: '/global-groom.webp' };
    expect(resolveTemplateSamplePhotos({ artwork: { designId: 'semi' } }, global)).toEqual(global);
    expect(resolveTemplateSamplePhotos({}, global)).toEqual(global);
  });
});
