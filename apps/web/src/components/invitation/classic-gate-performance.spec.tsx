import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LetterGust } from './letter-gust';
import { BouquetGate, BOUQUET_T } from './bouquet-gate';
import { GATE_MS, REVEAL_DELAY_MS } from './gates';

const text = { names: 'Andi & Sinta', kicker: 'Undangan Pernikahan', guest: 'Tamu', headingFamily: 'serif' };

describe('lightweight classic gates', () => {
  it.each(['rustic', 'sakura'] as const)('%s uses a fade without a full-screen mask or procedural texture', (kind) => {
    const html = renderToStaticMarkup(createElement(LetterGust, { ...text, kind, phase: 'closed' }));
    expect(html).not.toContain('mask-image');
    expect(html).not.toContain('feTurbulence');
    expect(html).toContain(text.names.replace('&', '&amp;'));
    const opening = renderToStaticMarkup(createElement(LetterGust, { ...text, kind, phase: 'opening' }));
    const count = (opening.match(/<svg/g) ?? []).length;
    expect(count).toBeLessThanOrEqual(kind === 'rustic' ? 28 : 26);
  });

  it.each(['frost', 'leaves', 'taman'] as const)('keeps %s on its existing wipe, duration and particle budget', (kind) => {
    const html = renderToStaticMarkup(createElement(LetterGust, { ...text, kind, phase: 'closed' }));
    expect(html).toContain('mask-image');
    expect(GATE_MS[kind]).toBe(2700);
    const opening = renderToStaticMarkup(createElement(LetterGust, { ...text, kind, phase: 'opening' }));
    expect((opening.match(/<svg/g) ?? []).length).toBe(kind === 'frost' ? 64 : 84);
  });

  it('preserves the timing of every unrelated gate', () => {
    expect(Object.fromEntries(Object.entries(GATE_MS).filter(([kind]) => !['twine', 'sakura', 'bouquet'].includes(kind)))).toEqual({
      portal: 2500, ring: 3550, frost: 2700, leaves: 2700, taman: 2700,
      kayon: 1850, gonjong: 1650, ulos: 1700, paras: 1650, lentera: 1700, jali: 1650, toran: 1600,
    });
  });

  it('limits bouquet burst/trail layers and lets all particles finish before removal', () => {
    const html = renderToStaticMarkup(createElement(BouquetGate, text));
    expect((html.match(/class="bq-bit"/g) ?? []).length).toBe(14);
    expect((html.match(/class="bq-trail /g) ?? []).length).toBe(5);
    expect((BOUQUET_T.pop + 0.22 + 0.95) * 1000).toBeLessThan(GATE_MS.bouquet);
    for (const gate of ['twine', 'sakura', 'bouquet'] as const) {
      expect(GATE_MS[gate]).toBeLessThanOrEqual(2000);
      expect(REVEAL_DELAY_MS[gate]).toBeGreaterThan(0);
    }
  });
});
