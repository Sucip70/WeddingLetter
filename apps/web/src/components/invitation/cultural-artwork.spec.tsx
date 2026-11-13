import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import revisions from '../../../public/themes/cultural-revisions.json';
import type { ArtworkManifest, ArtworkSlot } from '@/lib/types';
import { culturalRevisionSource } from './cultural-artwork';
import { RasterCover } from './raster-cover';
import { JaliGate } from './jali-gate';
import { LenteraGate } from './lentera-gate';
import { ToranGate } from './toran-gate';

function published(designId: keyof typeof revisions.designs): ArtworkManifest {
  return {
    designId,
    assets: Object.fromEntries(Object.entries(revisions.designs[designId]).map(([slot, source]) => [slot, {
      default: { ...source, url: `https://media.example.com/${designId}/${slot}.webp` },
    }])),
  } as ArtworkManifest;
}

describe('cultural revision manifest', () => {
  it.each(['jawa-sekar-keraton', 'pusako-minang', 'noor-e-nikah', 'vivaha-rani'] as const)('uses published cover assets for %s', (designId) => {
    const artwork = published(designId);
    const html = renderToStaticMarkup(createElement(RasterCover, {
      artwork, kind: 'bingkai', photo: '/user.webp', names: 'Andi & Sinta', kicker: 'Undangan',
      guest: null, dateText: '28 · 11 · 2026', openLabel: 'Buka undangan', animated: false,
    }));
    expect(html).toContain(`https://media.example.com/${designId}/stationeryBackground.webp`);
    if ('stationeryDivider' in artwork.assets) expect(html).toContain(`https://media.example.com/${designId}/stationeryDivider.webp`);
    expect(html).not.toContain('/stationery-01/');
    expect(html).not.toContain('/_next/static/media/');
  });

  it('uses the published Noor cloth and jali, Hong Xi cloud, and Vivaha doors', () => {
    const props = { phase: 'closed' as const, names: 'Andi & Sinta', kicker: 'Undangan', guest: null };
    const noor = renderToStaticMarkup(createElement(JaliGate, { ...props, artwork: published('noor-e-nikah') }));
    for (const slot of ['gateCloth', 'gateLattice']) expect(noor).toContain(`https://media.example.com/noor-e-nikah/${slot}.webp`);
    const hong = renderToStaticMarkup(createElement(LenteraGate, { ...props, artwork: published('hong-xi') }));
    expect(hong).toContain('https://media.example.com/hong-xi/gateCta.webp');
    const vivaha = renderToStaticMarkup(createElement(ToranGate, { ...props, artwork: published('vivaha-rani') }));
    expect(vivaha).toContain('https://media.example.com/vivaha-rani/gateDoors.webp');
  });

  it('preserves mobile/default/desktop selection and uses local fallback for older snapshots', () => {
    const artwork = published('vivaha-rani');
    artwork.assets.gateDoors!.mobile = { ...artwork.assets.gateDoors!.default!, url: 'https://media.example.com/mobile.webp' };
    expect(culturalRevisionSource(artwork, 'gateDoors')?.url).toBe('https://media.example.com/mobile.webp');
    expect(culturalRevisionSource({ ...artwork, assets: {} }, 'gateDoors')?.url).toBe(revisions.designs['vivaha-rani'].gateDoors.url);
    expect(culturalRevisionSource({ ...artwork, designId: 'horas-nauli', assets: {} }, 'gateDoors' as ArtworkSlot)).toBeUndefined();
  });

  it('resolves an older published snapshot fallback on its own storage provider', () => {
    const source = { ...revisions.designs['vivaha-rani'].gateDoors, storageKey: 'templates/vivaha-rani/v1/old.webp', url: 'https://staging.example/media/templates/vivaha-rani/v1/old.webp' };
    const artwork = { designId: 'vivaha-rani', assets: { divider: { default: source } } } as ArtworkManifest;
    expect(culturalRevisionSource(artwork, 'gateDoors')?.url).toBe(`https://staging.example/media/${revisions.designs['vivaha-rani'].gateDoors.storageKey}`);
  });
});
