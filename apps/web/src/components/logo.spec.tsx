import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Logo, LogoMark } from './logo';

describe('Surat Janji brand', () => {
  it('uses the approved raster mark without an inline SVG', () => {
    const html = renderToStaticMarkup(createElement(LogoMark));
    expect(html).toContain('/brand/logo-mark.png');
    expect(html).toContain('alt=""');
    expect(html).not.toContain('<svg');
  });
  it('preserves the home link and accessible brand name', () => {
    const html = renderToStaticMarkup(createElement(Logo, { href: '/templates' }));
    expect(html).toContain('href="/templates"');
    expect(html).toContain('aria-label="WeddingLetter — beranda"');
    expect(html).toContain('WeddingLetter</span>');
  });
  it('uses the light raster variant on dark surfaces and accepts custom sizes', () => {
    expect(renderToStaticMarkup(createElement(Logo, { light: true }))).toContain('/brand/logo-mark-light.png');
    expect(renderToStaticMarkup(createElement(LogoMark, { className: 'h-12 w-12' }))).toContain('h-12 w-12');
  });
});
