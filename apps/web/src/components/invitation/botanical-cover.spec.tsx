import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BotanicalCover, botanicalCoverSize, type BotanicalCoverProps } from './botanical-cover';

const props: BotanicalCoverProps = {
  kind: 'bingkai', photo: '/couple.webp', groom: '/groom.webp', bride: '/bride.webp',
  names: 'Cipto & Gracie', kicker: 'Undangan Pernikahan', dateText: '23 · 12 · 2028',
  guest: { dear: 'Kepada Yth.', name: 'Bapak/Ibu/Saudara/i' }, openLabel: 'Buka Undangan', animated: false,
};
const render = (patch: Partial<BotanicalCoverProps> = {}) => renderToStaticMarkup(createElement(BotanicalCover, { ...props, ...patch }));

describe('shared botanical cover layouts', () => {
  it.each(['garden', 'lavender', 'wisteria', 'marigold', 'hortensia'])('preserves published artwork for %s', (design) => {
    const storageKey = `templates/${design}/v1/paper.webp`;
    const html = render({ design, artwork: { designId: design, assets: { stationeryBackground: { default: {
      url: `https://cdn.example.com/${storageKey}`, storageKey, contentType: 'image/webp', width: 850, height: 1850, sizeBytes: 1000,
    } } } } as BotanicalCoverProps['artwork'] });
    expect(html).toContain(`https://cdn.example.com/${storageKey}`);
    expect(html).toContain(`data-botanical-cover="${design}"`);
  });
  it.each([[390, 700], [390, 844], [320, 568], [430, 620], [126, 220], [293, 366]])('fits %sx%s without vertical overflow or gutters', (width, height) => {
    const fit = botanicalCoverSize(width, height);
    expect(fit.width * fit.scale).toBeCloseTo(width);
    expect(fit.height * fit.scale).toBeCloseTo(height);
    expect(fit.height).toBeGreaterThanOrEqual(700 - 1e-9);
    expect(fit.width).toBeGreaterThanOrEqual(390 - 1e-9);
  });
  it('makes full-photo layouts edge-to-edge, not framed stationery portraits', () => {
    const html = render({ kind: 'penuh' });
    expect(html).toContain('absolute inset-0 h-full w-full object-cover');
    expect(html).not.toContain('background-image');
    expect(html).not.toContain('pb-11');
  });
  it('puts the names in the top group for the top-name layout', () => {
    const html = render({ kind: 'penuh-atas' });
    expect(html).toContain('pt-[11%]');
    expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('Bapak/Ibu/Saudara/i'));
    expect(html).not.toContain('border px-6');
  });
  it('renders a round medallion and a split fading background with an independent front card', () => {
    expect(render({ kind: 'medali' })).toContain('overflow-hidden rounded-full');
    const split = render({ kind: 'terbagi' });
    expect(split).toContain('mask-image:linear-gradient(#000 60%, transparent)');
    expect(split).toContain('top-[49%]');
    expect(split).toContain('bottom-[5%]');
  });
  it('renders separate portraits and a passive thumbnail without interactive controls', () => {
    const html = render({ kind: 'berdua', decorative: true, thumbnail: true });
    expect(html).toContain('src="/groom.webp"');
    expect(html).toContain('src="/bride.webp"');
    expect(html).not.toContain('<button');
  });
});
