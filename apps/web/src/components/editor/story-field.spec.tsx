import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StoryField } from './story-field';
import { serializeYearlyStory } from '../../lib/invitation-content';

describe('story editor', () => {
  it('keeps legacy paragraphs editable and offers yearly conversion', () => {
    const html = renderToStaticMarkup(createElement(StoryField, { value: 'Cerita lama kami', label: 'Cerita kami', onChange: () => undefined }));
    expect(html).toContain('Cerita lama kami');
    expect(html).toContain('Bagi per tahun');
    expect(html).toContain('Gunakan teks default');
  });
  it('shows separate editable year, title and narrative fields', () => {
    const value = serializeYearlyStory([{ year: '2022', title: 'Pertemuan', text: 'Awal kisah kami.' }, { year: '2026', title: 'Menikah', text: 'Dengan restu keluarga.' }]);
    const html = renderToStaticMarkup(createElement(StoryField, { value, label: 'Cerita kami', onChange: () => undefined }));
    for (const text of ['2022', '2026', 'Pertemuan', 'Menikah', 'Tambah tahun', 'Jadikan satu cerita', 'Naik', 'Turun']) expect(html).toContain(text);
    expect(html).not.toContain('yearly-story');
  });
});
