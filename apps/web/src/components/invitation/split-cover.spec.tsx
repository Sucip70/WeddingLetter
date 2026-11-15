import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoverLayout, type CoverProps } from './cover';
import { ORNAMENTS } from './ornaments';

const props: CoverProps = {
  kind: 'terbagi', photo: '/couple.webp', kicker: 'Undangan Pernikahan', names: 'Andi & Sinta',
  groomName: 'Andi', brideName: 'Sinta', dateText: '02 . 01 . 2027',
  guest: { dear: 'Kepada Yth.', name: 'Bapak/Ibu/Saudara/i' }, openLabel: 'Buka Undangan',
  heading: { family: 'script', size: '4.2rem', weight: 400 }, animated: false, premium: true,
  base: null, decor: null, corners: null, orn: ORNAMENTS.romantic, frame: 'garden',
  photoRadius: '12px', buttonRadius: '24px', letterFont: 'serif', layerHeight: '100%',
};

describe('split cover card fit', () => {
  it.each(Object.keys(ORNAMENTS).filter((key) => key !== 'romantic'))('preserves the existing split card for %s', (key) => {
    const html = renderToStaticMarkup(createElement(CoverLayout, { ...props, orn: ORNAMENTS[key as keyof typeof ORNAMENTS] }));
    expect(html).not.toContain('wl-split-content');
    expect(html).not.toContain('container-type:size');
    expect(html).toContain('font-size:calc(4.2rem * 0.9)');
  });
  it('bounds the name by both card width and height while retaining the open button', () => {
    const html = renderToStaticMarkup(createElement(CoverLayout, props));
    expect(html).toContain('container-type:size');
    expect(html).toContain('14cqw, 14cqh');
    expect(html).toContain('wl-split-content');
    expect(html).toContain('Buka Undangan');
  });
  it('reserves more room for longer names without changing other cover layouts', () => {
    const html = renderToStaticMarkup(createElement(CoverLayout, { ...props, names: 'Muhammad Alexander & Gabriella Putri' }));
    expect(html).toContain('11cqw, 11cqh');
    const other = renderToStaticMarkup(createElement(CoverLayout, { ...props, kind: 'bingkai' }));
    expect(other).not.toContain('wl-split-content');
    expect(other).not.toContain('14cqh');
  });
});
