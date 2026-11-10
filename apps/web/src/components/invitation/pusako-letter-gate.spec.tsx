import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest, ArtworkSlot } from '../../lib/types';
import { PusakoLetterGate } from './pusako-letter-gate';
import { pusakoLetterAssets, pusakoLetterNames, pusakoLetterRecipient } from './pusako-letter-assets';

const artwork = {
  designId: 'pusako-minang',
  assets: Object.fromEntries(Object.entries({
    gateBackground: 'gate-tile', gateTransition: 'gate-post-left', gateForeground: 'gate-post-right',
    gateInteractive: 'gate-gonjong', cardFrame: 'info-card', divider: 'divider', bottomDecoration: 'footer',
  }).map(([slot, file]) => [slot, { default: { url: `/themes/pusako-minang/${file}.webp` } }])),
} as ArtworkManifest;

const render = (props: Partial<Parameters<typeof PusakoLetterGate>[0]> = {}) => renderToStaticMarkup(createElement(PusakoLetterGate, {
  artwork, phase: 'closed', names: 'Andi & Sinta', kicker: 'UNDANGAN PERNIKAHAN', guest: null,
  dateText: 'Sabtu, 26 Desember 2026', onOpen: () => undefined, ...props,
}));

describe('Pusako Surat Bersegel', () => {
  it('keeps couple names, actual date and recipient as live text, not artwork', () => {
    const html = render({ guest: 'Ibu Ratna & Keluarga' });
    expect(html).toContain('Ibu Ratna &amp; Keluarga');
    expect(html).toContain('Sabtu, 26 Desember 2026');
    expect(html).toContain('aria-label="Andi &amp; Sinta"');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('Rahmat');
  });
  it('shows a neutral recipient even when a catalog preview has no personal link', () => {
    expect(pusakoLetterRecipient(null)).toBe('Bapak/Ibu/Saudara/i');
    expect(pusakoLetterRecipient('   ')).toBe('Bapak/Ibu/Saudara/i');
    expect(pusakoLetterRecipient('  Bapak Rahmat  ')).toBe('Bapak Rahmat');
    expect(render()).toContain('Kepada Yth.');
    expect(render()).toContain('Bapak/Ibu/Saudara/i');
  });
  it('supports long Indonesian names and splits them at the ampersand', () => {
    const names = 'Alexandra Putri & Muhammad Rasyid';
    expect(pusakoLetterNames(names)).toEqual({ text: names, parts: ['Alexandra Putri', 'Muhammad Rasyid'], long: true });
    expect(pusakoLetterNames(' Andi  &Sinta ')).toEqual({ text: 'Andi &Sinta', parts: ['Andi', 'Sinta'], long: false });
    expect(render({ names })).toContain('data-long="true"');
    expect(render({ names })).toContain('Muhammad Rasyid');
  });
  it('has one native opening button and disables it during opening', () => {
    expect((render().match(/<button/g) ?? []).length).toBe(1);
    expect(render()).not.toContain('role="button"');
    expect(render({ phase: 'opening' })).toMatch(/<button[^>]+disabled=""/);
    expect(render({ previewState: 'open' })).toContain('inert=""');
    expect(render({ onOpen: undefined })).toMatch(/<button[^>]+disabled=""/);
  });
  it('does not invent a date when event data is missing', () => {
    expect(render({ dateText: undefined })).not.toContain('26 Desember');
  });
  it('uses the optimized approved package without overwriting published/custom sources', () => {
    expect(pusakoLetterAssets(artwork).card).toBe('/themes/pusako-minang/surat-bersegel-01/letter-card.webp');
    for (const slot of ['gateBackground', 'gateInteractive', 'cardFrame'] as ArtworkSlot[]) {
      const custom = { ...artwork, assets: { ...artwork.assets, [slot]: { mobile: { url: `https://cdn.example.com/${slot}.webp` } } } } as ArtworkManifest;
      expect(Object.values(pusakoLetterAssets(custom))).toContain(`https://cdn.example.com/${slot}.webp`);
    }
  });
});
