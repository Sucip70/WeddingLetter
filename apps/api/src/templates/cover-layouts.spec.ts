import { BadRequestException } from '@nestjs/common';
import { COVER_KINDS, GENERIC_COVERS, THEME_COVERS, THEME_COVER_BY_DESIGN, availableCoverLayouts } from './cover-layouts.js';
import { normalizeLayout, validateInvitationData, withCoverLayouts } from './layout.js';
import { DESIGN_IDS } from './themes.js';

describe('tata letak sampul', () => {
  it('daftar id unik, layout tema hanya merujuk desain yang ada', () => {
    expect(new Set(COVER_KINDS).size).toBe(COVER_KINDS.length);
    for (const [design, kind] of Object.entries(THEME_COVER_BY_DESIGN)) {
      expect(DESIGN_IDS).toContain(design);
      expect(THEME_COVERS).toContain(kind);
    }
    // setiap layout tema dipakai minimal satu desain
    expect(new Set(Object.values(THEME_COVER_BY_DESIGN))).toEqual(new Set(THEME_COVERS));
  });

  it('Basic tanpa pilihan; Standard hanya layout umum; Premium + layout khusus tema (bila ada)', () => {
    expect(availableCoverLayouts('BASIC', 'rustic')).toEqual([]);
    expect(availableCoverLayouts('STANDARD', 'sihir')).toEqual([...GENERIC_COVERS]);
    expect(availableCoverLayouts('PREMIUM', 'sihir')).toEqual([...GENERIC_COVERS, 'portal']);
    expect(availableCoverLayouts('PREMIUM', 'hollywood')).toEqual([...GENERIC_COVERS, 'poster']);
    expect(availableCoverLayouts('PREMIUM', 'rustic')).toEqual([...GENERIC_COVERS]); // tanpa layout khusus
    expect(availableCoverLayouts('STANDARD', 'jawa')).not.toContain('gapura');
  });

  it('withCoverLayouts mengisi daftar sesuai paket & motif template', () => {
    const base = normalizeLayout({ theme: { preset: 'jawa' }, sections: ['cover'] });
    expect(base.coverLayouts).toEqual([]);
    expect(withCoverLayouts(base, 'PREMIUM').coverLayouts).toContain('gapura');
    expect(withCoverLayouts(base, 'BASIC').coverLayouts).toEqual([]);
  });

  describe('validasi data undangan', () => {
    const layout = withCoverLayouts(normalizeLayout({ theme: { preset: 'sihir' }, sections: ['cover'] }), 'PREMIUM');
    const validate = (tata_letak: unknown, l = layout) => validateInvitationData(l.sections, l, { cover: { tata_letak } }, (r) => r);

    it('menerima layout yang tersedia', () => {
      expect(validate('portal').data.cover).toEqual({ tata_letak: 'portal' });
      expect(validate('bingkai').data.cover).toEqual({ tata_letak: 'bingkai' });
    });

    it('menolak layout khusus tema yang bukan milik desain ini, atau id asing', () => {
      expect(() => validate('gapura')).toThrow(BadRequestException);
      expect(() => validate('meriam')).toThrow(/tidak tersedia/);
    });

    it('Basic (tanpa pilihan) menolak layout apa pun, dan kosong tetap boleh', () => {
      const basic = withCoverLayouts(normalizeLayout({ theme: { preset: 'rustic' }, sections: ['cover'] }), 'BASIC');
      expect(() => validate('penuh', basic)).toThrow(BadRequestException);
      expect(validateInvitationData(basic.sections, basic, { cover: {} }, (r) => r).data.cover?.tata_letak).toBeUndefined();
    });
  });
});
