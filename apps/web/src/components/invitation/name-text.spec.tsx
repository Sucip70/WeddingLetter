import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { COVER_LAYOUTS } from '../../lib/cover-layouts';
import { CoverLayout, type CoverProps } from './cover';
import { HEADING } from './motifs';
import { ORNAMENTS } from './ornaments';

const props: CoverProps = {
  kind: 'terbagi', photo: '/sample.webp', groom: '/groom.webp', bride: '/bride.webp',
  kicker: 'Undangan Pernikahan', names: 'Cipto & Gracie', groomName: 'Cipto', brideName: 'Gracie',
  dateText: '23 · 12 · 2028', guest: { dear: 'Kepada Yth.', name: 'Bapak/Ibu/Saudara/i' },
  openLabel: 'Buka Undangan', heading: HEADING.script, animated: false, premium: true,
  base: null, decor: null, corners: null, orn: ORNAMENTS.romantic, frame: 'square',
  photoRadius: '1rem', buttonRadius: '999px', letterFont: 'var(--font-script)', layerHeight: 810,
  decorative: true,
};

describe('decorative couple-name clipping protection', () => {
  it.each(Object.keys(COVER_LAYOUTS).filter((kind) => kind !== 'ornamen'))(
    'keeps safe glyph space on the %s cover', (kind) => {
      const html = renderToStaticMarkup(createElement(CoverLayout, { ...props, kind: kind as CoverProps['kind'] }));
      const headings = html.match(/<h1\b[^>]*>/g) ?? [];
      expect(headings.length).toBeGreaterThan(0);
      for (const heading of headings) expect(heading).toContain('wl-name-text');
    },
  );

  it.each(['Cipto & Gracie', 'Gilang & Gabriella', 'Ggggyyyy & Jjjjffff', 'GraceAmeliaPutriTanpaSpasiYangSangatPanjang'])(
    'preserves the complete text for %s with the premium shimmer', (names) => {
      const html = renderToStaticMarkup(createElement(CoverLayout, { ...props, names }));
      expect(html).toContain('wl-name-text');
      expect(html).toContain('wl-shimmer');
      expect(html).toContain('line-height:1.3');
      expect(html).toContain(names.replaceAll('&', '&amp;'));
    },
  );

  it('reserves paint space on every edge and allows long names to wrap', () => {
    const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');
    const rule = css.match(/\.wl-name-text\s*\{([^}]+)\}/)?.[1];
    expect(rule).toContain('padding: 0.2em 0.3em');
    expect(rule).toContain('max-inline-size: 100%');
    expect(rule).toContain('overflow-wrap: anywhere');
    expect(rule).toContain('box-decoration-break: clone');
  });
});
