import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HOME_PREVIEW_SIZE, HomeTemplatePreview, homePreviewScale } from './home-template-preview';

describe('Home mobile template preview', () => {
  it.each([128, 240, 270, 390])('scales the entire phone canvas to a %spx card', (width) => {
    const scale = homePreviewScale(width);
    expect(HOME_PREVIEW_SIZE.width * scale).toBeCloseTo(width);
    expect(HOME_PREVIEW_SIZE.height * scale).toBeCloseTo(width * 810 / 390);
  });
  it('reserves the mobile aspect ratio and isolates preview interactions', () => {
    const html = renderToStaticMarkup(<HomeTemplatePreview>Preview</HomeTemplatePreview>);
    expect(html).toContain('aspect-[390/810]');
    expect(html).toContain('width:390px;height:810px');
    expect(html).toContain('inert=""');
    expect(html).toContain('aria-hidden="true"');
  });
});
