import { artworkManifestSchema, seasonalArtworkFor } from './artwork.js';
import { normalizeLayout } from './layout.js';

describe('template artwork schema', () => {
  it('normalizes the recommended presentation defaults without arbitrary CSS', () => {
    const manifest = artworkManifestSchema.parse({ designId: 'spring-botanical-02', artworkVersion: 1, assets: {} });
    expect(manifest.presentation.backgroundFit).toBe('cover');
    expect(manifest.presentation.backgroundPosition).toBe('center-top');
    expect(manifest.presentation.showOnPhotoCover).toBe(false);
  });

  it('rejects unsafe URLs, storage traversal, and unbounded numeric presentation values', () => {
    const invalid = artworkManifestSchema.safeParse({
      designId: 'spring-botanical-02', artworkVersion: 1,
      assets: { coverBackground: { default: { url: 'javascript:alert(1)', storageKey: 'templates/x/v1/../../x.webp', contentType: 'image/webp', width: 100, height: 100, sizeBytes: 10 } } },
      presentation: { opacity: 4 },
    });
    expect(invalid.success).toBe(false);
  });

  it.each(['sakura-anime', 'semi', 'gugur', 'salju'])('provides a valid compatibility manifest for %s', (designId) => {
    const manifest = seasonalArtworkFor(designId);
    expect(manifest?.designId).toBe(designId);
    expect(manifest?.assets.coverBackground?.default?.url).toMatch(/^\/themes\/seasonal\/.+-bg\.webp$/);
  });

  it('survives layout normalization so the order snapshot receives the exact version', () => {
    const artwork = seasonalArtworkFor('semi')!;
    const layout = normalizeLayout({ theme: { preset: 'semi' }, artwork }, 'musim');
    expect(layout.artwork).toEqual(artwork);
    expect(layout.artwork?.artworkVersion).toBe(1);
  });
});
