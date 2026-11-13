import { describe, expect, it } from 'vitest';
import { artworkManifestSchema } from './artwork.js';
import { normalizeLayout } from './layout.js';
import { withLegacyBotanicalArtwork } from './artwork-snapshot.js';

const artwork = (designId: string, version = 1) => artworkManifestSchema.parse({
  designId, artworkVersion: version,
  assets: { stationeryBackground: { default: {
    url: `https://cdn.example.com/templates/${designId}/v${version}/paper.webp`,
    storageKey: `templates/${designId}/v${version}/paper.webp`,
    contentType: 'image/webp', width: 850, height: 1850, sizeBytes: 1000,
  } } },
});

describe('legacy botanical invitation artwork', () => {
  it.each(['garden', 'lavender', 'wisteria', 'marigold', 'hortensia'])('restores missing %s artwork without altering the saved layout', (designId) => {
    const snapshot = normalizeLayout({ theme: { preset: designId, motif: designId }, sections: ['cover', 'mempelai'] });
    const before = structuredClone(snapshot);
    const manifest = artwork(designId);
    const result = withLegacyBotanicalArtwork(snapshot, { artwork: manifest });
    expect(result.artwork).toEqual(manifest);
    const { artwork: _artwork, ...rest } = result;
    expect(rest).toEqual(before);
    expect(snapshot).toEqual(before);
  });
  it('never upgrades or mixes an existing customer artwork version', () => {
    const snapshot = normalizeLayout({ theme: { preset: 'garden' }, artwork: artwork('garden', 1) });
    expect(withLegacyBotanicalArtwork(snapshot, { artwork: artwork('garden', 2) })).toBe(snapshot);
  });
  it('does not change unrelated designs or accept a different design', () => {
    const rustic = normalizeLayout({ theme: { preset: 'rustic' } });
    expect(withLegacyBotanicalArtwork(rustic, { artwork: artwork('garden') })).toBe(rustic);
    const garden = normalizeLayout({ theme: { preset: 'garden' } });
    expect(withLegacyBotanicalArtwork(garden, { artwork: artwork('lavender') })).toBe(garden);
  });
  it.each([undefined, null, [], {}, { artwork: { designId: 'garden', assets: { stationeryBackground: { default: { url: 'javascript:alert(1)' } } } } }])('keeps the snapshot intact when there is no valid fallback: %j', (current) => {
    const snapshot = normalizeLayout({ theme: { preset: 'garden' } });
    expect(withLegacyBotanicalArtwork(snapshot, current)).toBe(snapshot);
  });
});
