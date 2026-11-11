import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
vi.mock('./assets/garden-cover.webp', () => ({ default: { src: '/_next/static/media/garden-cover.webp' } }));
vi.mock('./assets/garden-gate.webp', () => ({ default: { src: '/_next/static/media/garden-gate.webp' } }));
vi.mock('./assets/lavender-cover.webp', () => ({ default: { src: '/_next/static/media/lavender-cover.webp' } }));
vi.mock('./assets/lavender-gate.webp', () => ({ default: { src: '/_next/static/media/lavender-gate.webp' } }));
vi.mock('./assets/lavender-sample.webp', () => ({ default: { src: '/_next/static/media/sample.webp' } }));
import { LavenderCover, LavenderGate, lavenderCanvasSize } from './lavender-stationery';
import { gardenPalette } from './garden-stationery';
import { Gate } from './gates';
import { TemplateThumb } from '../template-thumb';
import { resolveTemplateSamplePhotos } from '../../lib/template-sample-photos';
import type { Theme } from '../../lib/types';

const props = { design: 'garden' as const, kind: 'bingkai' as const, photo: '/uploads/couple.webp', names: 'Andi & Sinta', kicker: 'Undangan Pernikahan', dateText: '28 · 11 · 2026', guest: { dear: 'Kepada Yth.', name: 'Ibu Ratna & Keluarga' }, openLabel: 'Buka undangan', animated: false };
const theme: Theme = { preset: 'garden', motif: 'garden', gate: 'taman', fx: 'premium', primary: '#4a6b2f', secondary: '#9fb4f0', background: '#f6f8ff', text: '#2a3722', headingFont: 'serif', bodyFont: 'serif' };
const render = (extra: Partial<Parameters<typeof LavenderCover>[0]> = {}) => renderToStaticMarkup(createElement(LavenderCover, { ...props, ...extra }));
describe('Serambi Botani — approved botanical stationery', () => {
  it('selects botanical raster artwork and real uploaded photo with live copy', () => {
    const html = render();
    for (const s of ['data-stationery="garden"', 'garden-cover.webp', '/uploads/couple.webp', 'Andi &amp; Sinta', 'Ibu Ratna &amp; Keluarga']) expect(html).toContain(s);
    for (const s of ['<svg', '.tmp/', 'sample.webp', 'hortensia']) expect(html).not.toContain(s);
    expect(render({ guest: null })).not.toContain('Ibu Ratna');
  });
  it('leaves Lavender selected by default', () => {
    const html = render({ design: undefined });
    expect(html).toContain('data-stationery="lavender"'); expect(html).not.toContain('garden-cover.webp');
  });
  it('handles long names, missing photos, two uploaded portraits and static thumbnails', () => {
    expect(render({ names: 'Alexandra Putri & Muhammad Rasyid' })).toContain('data-long="true"');
    expect(render({ photo: undefined })).toContain('data-photo="false"');
    expect((render({ kind: 'berdua', groom: '/groom.webp', bride: '/bride.webp' }).match(/<figure/g) || []).length).toBe(2);
    expect(render({ thumbnail: true, decorative: true })).not.toContain('<button');
    const view = readFileSync(new URL('./invitation-view.tsx', import.meta.url), 'utf8');
    // The custom cover owns live copy even without a photo; do not mount the generic cover too.
    expect(view).toContain('!lavender && !photoCover && !rasterCover && (');
  });
  it('routes the paired folio without a manifest and exposes one native opening button', () => {
    const html = renderToStaticMarkup(createElement(Gate, { kind: 'taman', phase: 'closed', embedded: true, names: props.names, kicker: props.kicker, dateText: props.dateText, guest: 'Ibu Ratna', pattern: 'none', motif: 'garden', headingFamily: 'serif', onOpen: () => undefined }));
    expect(html).toContain('garden-gate.webp'); expect(html).toContain('Buka Undangan');
    expect((html.match(/<button/g) || []).length).toBe(1); expect(html).not.toContain('role="button"'); expect(html).not.toContain('<svg');
    expect(renderToStaticMarkup(createElement(LavenderGate, { design: 'garden', names: props.names, kicker: props.kicker, guest: null, phase: 'opening', onOpen: () => undefined }))).toContain('disabled');
  });
  it('retains the approved green ink and custom palette choices', () => {
    expect(gardenPalette('#4a6b2f', '#2a3722')).toMatchObject({ '--p': '#284d3b', '--tx': '#264536' });
    expect(gardenPalette('#2a4f9a', '#10234a')).toMatchObject({ '--p': '#2a4f9a', '--tx': '#10234a' });
  });
  it('fills catalog sizes and preserves rectangular mounts and footer proportions', () => {
    const fit = lavenderCanvasSize(126, 220, true);
    expect(fit.scale * 390).toBeCloseTo(126); expect(fit.scale * fit.height).toBeCloseTo(220);
    const css = readFileSync(new URL('./lavender-stationery.module.css', import.meta.url), 'utf8');
    expect(css).toContain('aspect-ratio:390/620'); expect(css).toContain('border-image-slice:16% 7% 14% 7% fill');
    expect(css).toContain('wisteria-left'); expect(css).toContain('prefers-reduced-motion:reduce');
  });
  it('updates the real catalog instead of rendering the obsolete thumbnail URL', () => {
    expect(resolveTemplateSamplePhotos({ theme }).cover).toContain('sample.webp');
    expect(resolveTemplateSamplePhotos({ theme, samplePhotos: { cover: '/published.webp' } }).cover).toBe('/published.webp');
    const html = renderToStaticMarkup(createElement(TemplateThumb, { theme, coverLayouts: ['ornamen', 'bingkai'], imageUrl: '/old-thumbnail.webp' }));
    expect(html).toContain('data-stationery="garden"'); expect(html).not.toContain('old-thumbnail');
  });
});
