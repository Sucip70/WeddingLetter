import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import { hasUlosGate, UlosGate } from './ulos-gate';

const slots = ['gateBackground', 'gateInteractive', 'pageBackground', 'bottomDecoration', 'divider', 'topDecoration'];
const artwork = {
  designId: 'horas-nauli',
  assets: Object.fromEntries(slots.map((slot) => [slot, { default: { url: `/themes/horas-nauli/${slot}.webp` } }])),
} as ArtworkManifest;

const render = (props: Partial<Parameters<typeof UlosGate>[0]> = {}) => renderToStaticMarkup(createElement(UlosGate, {
  artwork, phase: 'closed', names: 'Andi & Sinta', kicker: 'UNDANGAN PERNIKAHAN', guest: null,
  dateText: 'Sabtu, 26 Desember 2026', cta: 'Ketuk simpul untuk membuka', ...props,
}));

describe('Horas Nauli Surat Ulos gate', () => {
  it('recognizes a complete raster package', () => {
    expect(hasUlosGate(artwork, 'horas-nauli')).toBe(true);
    expect(hasUlosGate(artwork, 'other')).toBe(false);
  });
  it('keeps names, date and recipient as live text and contains no SVG', () => {
    const html = render({ guest: 'Bapak Rahmat & Keluarga' });
    expect(html).toContain('Andi &amp; Sinta');
    expect(html).toContain('Sabtu, 26 Desember 2026');
    expect(html).toContain('Bapak Rahmat &amp; Keluarga');
    expect(html).not.toContain('<svg');
  });
  it('uses a neutral catalog recipient and supports long names', () => {
    expect(render()).toContain('Bapak/Ibu/Saudara/i');
    expect(render({ names: 'Alexandra Putri & Muhammad Rasyid' })).toContain('data-long="true"');
  });
  it('exposes both ribbon halves during opening', () => {
    const html = render({ phase: 'opening' });
    expect(html).toContain('data-phase="opening"');
    expect(html).toContain('ug-binding-l');
    expect(html).toContain('ug-binding-r');
  });
});


