import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
vi.mock('./assets/lavender-cover.webp', () => ({ default: { src: '/_next/static/media/lavender-cover.webp' } }));
vi.mock('./assets/lavender-gate.webp', () => ({ default: { src: '/_next/static/media/lavender-gate.webp' } }));
vi.mock('./assets/lavender-sample.webp', () => ({ default: { src: '/_next/static/media/lavender-sample.webp' } }));
import { LavenderCover, LavenderBlock, LavenderGate, LavenderPortrait, LAVENDER_CANVAS, lavenderPalette, lavenderCanvasSize } from './lavender-stationery';
import { Gate } from './gates';
import { TemplateThumb } from '../template-thumb';
import { resolveTemplateSamplePhotos } from '../../lib/template-sample-photos';
import type { Theme } from '../../lib/types';

const props = { kind: 'bingkai' as const, photo: '/uploads/couple.webp', names: 'Andi & Sinta', kicker: 'Undangan Pernikahan', dateText: '28 · 11 · 2026', guest: { dear: 'Kepada Yth.', name: 'Ibu Ratna & Keluarga' }, openLabel: 'Buka undangan', animated: false };
const theme: Theme = { preset: 'lavender', motif: 'lavender', gate: 'sakura', fx: 'premium', primary: '#62446e', secondary: '#b4a17e', background: '#f8f3eb', text: '#49344f', headingFont: 'serif', bodyFont: 'source' };
describe('Herbarium Lavender stationery', () => {
  it('fills each catalog size without side gutters, while the live canvas stays unchanged', () => {
    for (const [width, height] of [[126, 220], [260, 390], [390, 680], [293, 366]]) {
      const fit = lavenderCanvasSize(width, height, true);
      expect(390 * fit.scale).toBeCloseTo(width);
      expect(fit.height * fit.scale).toBeCloseTo(height);
    }
    expect(lavenderCanvasSize(320, 520).height).toBe(LAVENDER_CANVAS.height);
    const css = readFileSync(new URL('./lavender-stationery.module.css', import.meta.url), 'utf8');
    expect(css).toContain('border-image-slice:239 80 280 80 fill');
    expect(css).toContain('aspect-ratio:390/600');
  });
  it('preserves palette choices while mapping the old default to the approved ink', () => {
    expect(lavenderPalette('#6b3fa0', '#2d2147')).toMatchObject({ '--p': '#62446e', '--tx': '#49344f' });
    expect(lavenderPalette('#8a3f93', '#34163a')).toMatchObject({ '--p': '#8a3f93', '--tx': '#34163a' });
  });
  it('keeps live photos and text separate from the bundled raster', () => {
    const html = renderToStaticMarkup(createElement(LavenderCover, props));
    for (const s of ['lavender-cover.webp', '/uploads/couple.webp', 'Andi &amp; Sinta', 'Ibu Ratna &amp; Keluarga', '<button']) expect(html).toContain(s);
    for (const s of ['<svg', '/samples/', '.tmp', 'lavender-sample']) expect(html).not.toContain(s);
  });
  it('keeps one reference composition and never uses an arched photo mount', () => {
    expect(LAVENDER_CANVAS.height / LAVENDER_CANVAS.width).toBeCloseTo(956 / 440);
    const css = readFileSync(new URL('./lavender-stationery.module.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.portrait\s*\{[^}]*border-radius:2px/);
    expect(css).not.toContain('115px 115px');
    expect(css).not.toContain('@container (max-height');
  });
  it('supports long names, absent photos, Berdua and passive thumbnails', () => {
    expect(renderToStaticMarkup(createElement(LavenderCover, { ...props, names: 'Alexandra Putri & Muhammad Rasyid' }))).toContain('data-long="true"');
    expect(renderToStaticMarkup(createElement(LavenderCover, { ...props, photo: undefined }))).toContain('data-photo="false"');
    const two = renderToStaticMarkup(createElement(LavenderCover, { ...props, kind: 'berdua', groom: '/groom.webp', bride: '/bride.webp' }));
    expect((two.match(/<figure/g) || []).length).toBe(2);
    expect(renderToStaticMarkup(createElement(LavenderCover, { ...props, decorative: true, thumbnail: true }))).not.toContain('<button');
    expect(renderToStaticMarkup(createElement(LavenderPortrait, { label: 'Andi' }))).toBe('');
  });
  it('routes the Lavender gate without a manifest and with only one native seal button', () => {
    const html = renderToStaticMarkup(createElement(Gate, { kind: 'sakura', phase: 'closed', embedded: true, motif: 'lavender', names: props.names, kicker: props.kicker, guest: 'Ibu Ratna', pattern: 'none', headingFamily: 'serif', dateText: props.dateText, onOpen: () => undefined }));
    expect(html).toContain('data-lavender="gate"'); expect(html).toContain('lavender-gate.webp');
    expect((html.match(/<button/g) || []).length).toBe(1); expect(html).not.toContain('role="button"'); expect(html).not.toContain('<svg');
    expect(renderToStaticMarkup(createElement(LavenderGate, { names: props.names, kicker: props.kicker, guest: null, phase: 'opening', onOpen: () => undefined }))).toContain('disabled');
  });
  it('renders quiet content without old SVG ornament stacking', () => {
    const html = renderToStaticMarkup(<LavenderBlock title="Waktu & Tempat">Live event data</LavenderBlock>);
    expect(html).toContain('Live event data'); expect(html).toContain('Waktu &amp; Tempat'); expect(html).not.toContain('<svg');
  });
  it('updates the catalog preview, resolves a bundled sample, and preserves published photo overrides', () => {
    const photos = resolveTemplateSamplePhotos({ theme });
    expect(photos.cover).toContain('lavender-sample.webp');
    expect(resolveTemplateSamplePhotos({ theme, samplePhotos: { cover: '/custom.webp' } }).cover).toBe('/custom.webp');
    const html = renderToStaticMarkup(createElement(TemplateThumb, { theme, coverLayouts: ['ornamen', 'bingkai'], imageUrl: '/obsolete-thumbnail.webp' }));
    expect(html).toContain('data-lavender="cover"'); expect(html).toContain('lavender-sample.webp'); expect(html).not.toContain('obsolete-thumbnail');
  });
});
