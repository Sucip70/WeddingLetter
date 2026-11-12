import { describe, expect, it } from 'vitest';
import { initialInvitationContent, parseYearlyStory, serializeYearlyStory, DEFAULT_INVITATION_TEXT } from './invitation-content';

describe('invitation default content and yearly stories', () => {
  it('only initializes fields enabled on the selected template', () => {
    const data = initialInvitationContent([{ id: 'cerita', title: 'Cerita', fields: [{ key: 'kutipan', label: 'Doa', type: 'textarea', required: false }] }]);
    expect(data).toEqual({ cerita: { kutipan: DEFAULT_INVITATION_TEXT.cerita.kutipan } });
    expect(initialInvitationContent([])).toEqual({});
  });
  it('round trips ordered entries including Indonesian text and newlines', () => {
    const entries = [{ year: '2022', title: 'Pertemuan', text: 'Awal cerita\nBerjumpa kembali' }, { year: '2026', title: 'Pernikahan', text: 'Dengan restu keluarga.' }];
    expect(parseYearlyStory(serializeYearlyStory(entries))).toEqual(entries);
  });
  it('preserves legacy plain stories and rejects malformed structures', () => {
    for (const value of ['Cerita lama', '[{"year":"2020"}]', '{"type":"yearly-story","entries":[null]}', '{"type":"yearly-story","entries":[{"year":2022,"title":"A","text":"B"}]}']) expect(parseYearlyStory(value)).toBeNull();
  });
});
