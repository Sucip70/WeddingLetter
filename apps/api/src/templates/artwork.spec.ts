import { artworkManifestSchema, horasNauliArtwork, pawiwahanAgungArtwork, pusakoMinangArtwork, RASTER_ARTWORK, seasonalArtworkFor, sekarKeratonArtwork } from './artwork.js';
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

  it('provides the complete app-owned Sekar Keraton raster manifest', () => {
    const artwork = sekarKeratonArtwork();
    expect(artwork.designId).toBe('jawa-sekar-keraton');
    expect(artwork.assets.coverBackground?.default?.url).toBe('/themes/sekar-keraton/page-background.webp');
    expect(artwork.assets.cardFrame?.default?.url).toBe('/themes/sekar-keraton/card-frame.webp');
    expect(artwork.assets.gateInteractive?.default?.url).toBe('/themes/sekar-keraton/kayon-wayang.webp');
    expect(artwork.assets.gateForeground).toBeUndefined();
  });

  it('provides the Pusako Minang raster manifest and registers both raster designs', () => {
    const artwork = pusakoMinangArtwork();
    expect(artwork.designId).toBe('pusako-minang');
    expect(artwork.assets.cardFrame?.default?.url).toBe('/themes/pusako-minang/info-card.webp');
    expect(artwork.assets.gateInteractive?.default?.url).toBe('/themes/pusako-minang/gate-gonjong.webp');
    expect(Object.keys(RASTER_ARTWORK).sort()).toEqual(['horas-nauli', 'jawa-sekar-keraton', 'pawiwahan-agung', 'pusako-minang']);
    expect(pawiwahanAgungArtwork().assets.gateInteractive?.default?.url).toBe('/themes/pawiwahan-agung/gate-tab.webp');
    expect(horasNauliArtwork().assets.gateInteractive?.default?.url).toBe('/themes/horas-nauli/gate-knot.webp');
    for (const make of Object.values(RASTER_ARTWORK)) expect(make().designId).toBeTruthy();
  });
});
