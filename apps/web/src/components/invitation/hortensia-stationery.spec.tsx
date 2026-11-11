import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('./assets/hortensia-cover.webp', () => ({ default: { src: '/_next/static/media/hortensia-cover.webp' } }));
vi.mock('./assets/hortensia-gate.webp', () => ({ default: { src: '/_next/static/media/hortensia-gate.webp' } }));
vi.mock('./assets/hortensia-sample.webp', () => ({ default: { src: '/_next/static/media/hortensia-sample.webp' } }));
import { HortensiaCover, HortensiaGate, HortensiaBlock, HortensiaClosing, HORTENSIA_CANVAS, hortensiaCanvasSize, hortensiaPalette } from './hortensia-stationery';
import { Gate } from './gates';
import { TemplateThumb } from '../template-thumb';
import { resolveTemplateSamplePhotos } from '../../lib/template-sample-photos';
import type { Theme } from '../../lib/types';
const props = { kind: 'bingkai' as const, photo: '/uploads/couple.webp', names: 'Andi & Sinta', kicker: 'Undangan Pernikahan', dateText: '28 · 11 · 2026', guest: { dear: 'Kepada Yth.', name: 'Ibu Ratna & Keluarga' }, openLabel: 'Buka undangan', animated: false };
const theme: Theme = { preset: 'hortensia', motif: 'hortensia', gate: 'sakura', fx: 'premium', primary: '#0f7a8c', secondary: '#6fd4e0', background: '#f4fbfc', text: '#0f2f3a', headingFont: 'serif', bodyFont: 'source' };
describe('Hortensia Atelier', () => {
  it('renders uploaded photos and live copy over text-free bundled raster, never sample people or SVG', () => {
    const html = renderToStaticMarkup(createElement(HortensiaCover, props));
    for (const s of ['hortensia-cover.webp', '/uploads/couple.webp', 'Andi &amp; Sinta', 'Ibu Ratna &amp; Keluarga']) expect(html).toContain(s);
    for (const s of ['<svg', 'hortensia-sample', '.tmp', 'concept-gate-cover']) expect(html).not.toContain(s);
    expect(html.indexOf('<figure')).toBeLessThan(html.indexOf('<h1'));
  });
  it('keeps the live canvas constant and fills different thumbnail sizes without gutters', () => {
    expect(HORTENSIA_CANVAS.height / 390).toBeCloseTo(956 / 440);
    expect(hortensiaCanvasSize(320, 520).height).toBe(HORTENSIA_CANVAS.height);
    for (const [w, h] of [[126, 220], [260, 390], [390, 680]]) {
      const fit = hortensiaCanvasSize(w, h, true); expect(fit.scale * 390).toBeCloseTo(w); expect(fit.scale * fit.height).toBeCloseTo(h);
    }
  });
  it('supports long names, no photo and separately uploaded Berdua portraits', () => {
    expect(renderToStaticMarkup(createElement(HortensiaCover, { ...props, names: 'Alexandra Putri & Muhammad Rasyid' }))).toContain('data-long="true"');
    expect(renderToStaticMarkup(createElement(HortensiaCover, { ...props, photo: undefined }))).toContain('data-photo="false"');
    expect((renderToStaticMarkup(createElement(HortensiaCover, { ...props, kind: 'berdua', groom: '/groom.webp', bride: '/bride.webp' })).match(/<figure/g) || []).length).toBe(2);
    expect(renderToStaticMarkup(createElement(HortensiaCover, { ...props, decorative: true }))).not.toContain('<button');
  });
  it('routes the correct closed gate with one native accessible clasp', () => {
    const html = renderToStaticMarkup(createElement(Gate, { kind: 'sakura', phase: 'closed', embedded: true, motif: 'hortensia', names: props.names, kicker: props.kicker, guest: 'Ibu Ratna', pattern: 'none', headingFamily: 'serif', dateText: props.dateText, onOpen: () => undefined }));
    expect(html).toContain('data-hortensia="gate"'); expect(html).toContain('hortensia-gate.webp'); expect(html).toContain('Ibu Ratna');
    expect((html.match(/<button/g) || []).length).toBe(1); expect(html).not.toContain('role="button"'); expect(html).not.toContain('<svg');
    expect(renderToStaticMarkup(createElement(HortensiaGate, { names: props.names, kicker: props.kicker, guest: null, phase: 'opening', onOpen: () => undefined }))).toContain('disabled');
  });
  it('keeps square photo mounts and proportion-preserving footer paper', () => {
    const css = readFileSync(new URL('./hortensia-stationery.module.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.portrait\s*\{[^}]*border-radius:1px/); expect(css).toContain('border-image-slice:350 40 150 40 fill'); expect(css).toContain('aspect-ratio:390/600'); expect(css).toContain('prefers-reduced-motion');
  });
  it('uses live enabled section content rather than baking review text into artwork', () => {
    expect(renderToStaticMarkup(<HortensiaBlock title="Waktu & Tempat">Live event data</HortensiaBlock>)).toContain('Live event data');
    expect(renderToStaticMarkup(<HortensiaClosing names="Custom names" dateText="01 · 01 · 2027" thanks="Terima kasih" />)).toContain('Custom names');
  });
  it('preserves palette choices and template sample overrides', () => {
    expect(hortensiaPalette('#0f7a8c', '#0f2f3a')).toMatchObject({ '--p': '#12494d', '--tx': '#103c40' });
    expect(hortensiaPalette('#154e65', '#122f36')).toMatchObject({ '--p': '#154e65', '--tx': '#122f36' });
    expect(resolveTemplateSamplePhotos({ theme }).cover).toContain('hortensia-sample.webp');
    expect(resolveTemplateSamplePhotos({ theme, samplePhotos: { cover: '/published.webp' } }).cover).toBe('/published.webp');
    const html = renderToStaticMarkup(createElement(TemplateThumb, { theme, coverLayouts: ['ornamen', 'bingkai'], imageUrl: '/obsolete.webp' }));
    expect(html).toContain('data-hortensia="cover"'); expect(html).not.toContain('obsolete.webp');
  });
});
