import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('./assets/marigold-cover.webp', () => ({ default: { src: '/_next/static/media/marigold-cover.webp' } }));
vi.mock('./assets/marigold-gate.webp', () => ({ default: { src: '/_next/static/media/marigold-gate.webp' } }));
vi.mock('./assets/lavender-sample.webp', () => ({ default: { src: '/_next/static/media/lavender-sample.webp' } }));
import { LavenderCover, LavenderGate, lavenderCanvasSize } from './lavender-stationery';
import { marigoldPalette } from './marigold-stationery';
import { Gate } from './gates';
import { TemplateThumb } from '../template-thumb';
import type { Theme } from '../../lib/types';
const theme: Theme = { preset: 'marigold', motif: 'marigold', gate: 'sakura', fx: 'premium', primary: '#b8500f', secondary: '#f6b83a', background: '#fffaf0', text: '#4a2410', headingFont: 'serif', bodyFont: 'source' };
const props = { design: 'marigold' as const, kind: 'bingkai' as const, photo: '/uploads/couple.webp', names: 'Andi & Sinta', kicker: 'Undangan Pernikahan', dateText: '28 · 11 · 2026', guest: { dear: 'Kepada Yth.', name: 'Bapak/Ibu Rahmat & Keluarga' }, openLabel: 'Buka Undangan', animated: false };
describe('Marigold Senja — Pita Senja', () => {
  it('uses separate text-free Marigold artwork and real uploaded photos', () => {
    const html = renderToStaticMarkup(createElement(LavenderCover, props));
    for (const s of ['data-stationery="marigold"', 'marigold-cover.webp', '/uploads/couple.webp', 'Andi &amp; Sinta', 'Bapak/Ibu Rahmat &amp; Keluarga']) expect(html).toContain(s);
    for (const s of ['<svg', '.tmp/', 'review-gate-cover.png', 'wisteria-cover.webp']) expect(html).not.toContain(s);
    expect(renderToStaticMarkup(createElement(LavenderCover, { ...props, names: 'Alexandra Putri & Muhammad Rasyid' }))).toContain('data-long="true"');
    expect(renderToStaticMarkup(createElement(LavenderCover, { ...props, photo: undefined }))).toContain('data-photo="false"');
  });
  it('has one native opening button, with names/date in the band and no gate photo', () => {
    const html = renderToStaticMarkup(createElement(Gate, { kind: 'sakura', motif: 'marigold', phase: 'closed', embedded: true, names: props.names, kicker: props.kicker, dateText: props.dateText, guest: 'Ibu Ratna', pattern: 'none', headingFamily: 'serif', onOpen: () => undefined }));
    expect(html).toContain('marigold-gate.webp'); expect(html).toContain('Ibu Ratna'); expect(html).toContain(props.dateText);
    expect((html.match(/<button/g) || []).length).toBe(1); expect(html).not.toContain('role="button"'); expect(html).not.toContain('<img'); expect(html).not.toContain('<svg');
    expect(renderToStaticMarkup(createElement(LavenderGate, { design: 'marigold', phase: 'opening', names: props.names, kicker: props.kicker, guest: null, onOpen: () => undefined }))).toContain('disabled');
  });
  it('replaces stale thumbnails with the finished invitation and fits card dimensions', () => {
    const html = renderToStaticMarkup(createElement(TemplateThumb, { theme, coverLayouts: ['bingkai'], imageUrl: '/obsolete.webp' }));
    expect(html).toContain('data-stationery="marigold"'); expect(html).toContain('marigold-cover.webp'); expect(html).not.toContain('obsolete.webp'); expect(html).not.toContain('<button');
    for (const [w, h] of [[126, 220], [260, 390], [390, 680]]) { const fit = lavenderCanvasSize(w, h, true); expect(fit.scale * 390).toBeCloseTo(w); expect(fit.scale * fit.height).toBeCloseTo(h); }
  });
  it('preserves user palette choices and maps only the old default', () => {
    expect(marigoldPalette(theme.primary, theme.text)).toMatchObject({ '--p': '#9c3e1e', '--tx': '#552810' });
    expect(marigoldPalette('#a8461f', '#47200f')).toMatchObject({ '--p': '#a8461f', '--tx': '#47200f' });
  });
});
