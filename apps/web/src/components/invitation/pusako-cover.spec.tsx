import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import type { CoverProps } from './raster-cover';
import { RasterCover } from './raster-cover';
import { PUSAKO_CANVAS, isPusakoStationery } from './pusako-cover';

const artwork = { designId: 'pusako-minang', assets: { topDecoration: { default: { url: '/mini-gonjong.webp' } }, photoFrame: { default: { url: '/legacy-frame.webp' } } } } as ArtworkManifest;
const props: CoverProps = { kind: 'bingkai', artwork, photo: '/uploads/couple.webp', names: 'Andi & Sinta', kicker: 'Undangan Pernikahan', dateText: '28 · 11 · 2026', guest: { dear: 'Kepada Yth.', name: 'Bapak/Ibu Rahmat & Keluarga' }, openLabel: 'Buka undangan', animated: false };
const render = (p: Partial<CoverProps> = {}) => renderToStaticMarkup(createElement(RasterCover, { ...props, ...p }));
describe('Pusako Songket — approved width-scaled composition', () => {
  it('limits the new composition to the approved stationery family', () => {
    for (const kind of ['ornamen', 'bingkai', 'berdua']) expect(isPusakoStationery('pusako-minang', kind)).toBe(true);
    for (const kind of ['penuh', 'terbagi']) expect(isPusakoStationery('pusako-minang', kind)).toBe(false);
    expect(isPusakoStationery('noor-e-nikah', 'bingkai')).toBe(false);
    expect(render()).toContain('data-cover-design="pusako-songket"');
  });
  it('uses the same master canvas rather than viewport-height compression', () => {
    expect(PUSAKO_CANVAS.height / PUSAKO_CANVAS.width).toBeCloseTo(956 / 440);
    expect(render()).toContain('width:390px;height:847.3636363636364px;transform:scale(1)');
  });
  it('keeps raster artwork separate from dynamic text and uploaded photos', () => {
    const html = render();
    for (const value of ['pusako-cover-paper.webp', 'pusako-cover-divider.webp', '/uploads/couple.webp', 'Andi &amp; Sinta', 'Bapak/Ibu Rahmat &amp; Keluarga']) expect(html).toContain(value);
    for (const value of ['legacy-frame', '<svg', '/samples/', '.tmp']) expect(html).not.toContain(value);
    expect(render({ guest: null })).not.toContain('Kepada Yth.');
  });
  it('supports long names, no photo and two user portraits', () => {
    expect(render({ names: 'Alexandra Putri & Muhammad Rasyid' })).toContain('data-long="true"');
    const empty = render({ photo: undefined });
    expect(empty).toContain('data-photo="false"'); expect(empty).toContain('mini-gonjong'); expect(empty).not.toContain('<figure');
    expect((render({ kind: 'berdua', groom: '/groom.webp', bride: '/bride.webp' }).match(/<figure/g) || []).length).toBe(2);
  });
  it('keeps catalog previews non-interactive and the live CTA native', () => {
    expect(render()).toContain('<button'); expect(render({ decorative: true })).not.toContain('<button');
  });
});
