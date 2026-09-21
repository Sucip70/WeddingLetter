import { BadRequestException } from '@nestjs/common';
import { applyPalette, normalizeLayout } from './layout.js';
import { BASIC_PALETTES, DESIGNS, GATE_KINDS, GROUP_ORDER, autoPalettes, designById } from './themes.js';

const HEX = /^#[0-9a-f]{6}$/i;

describe('registry desain', () => {
  it('id unik, format id aman, dan grup dikenal', () => {
    const ids = DESIGNS.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const design of DESIGNS) {
      expect(design.id).toMatch(/^[a-z0-9-]{2,30}$/);
      expect(GROUP_ORDER).toContain(design.group);
    }
  });

  it('setiap grup punya desain dan warna berupa hex 6 digit', () => {
    for (const group of GROUP_ORDER) expect(DESIGNS.some((x) => x.group === group)).toBe(true);
    for (const design of DESIGNS) {
      for (const color of [design.primary, design.secondary, design.background, design.text]) expect(color).toMatch(HEX);
    }
  });
});

describe('gerbang pembuka', () => {
  it('setiap desain punya gerbang bawaan yang valid; semua jenis gerbang dipakai minimal satu desain', () => {
    for (const design of DESIGNS) expect(GATE_KINDS).toContain(design.gate);
    const used = new Set(DESIGNS.map((x) => x.gate));
    expect([...used].sort()).toEqual([...GATE_KINDS].sort());
  });

  it('normalizeLayout: gerbang bawaan none; nilai sah dipakai; nilai asing dibuang tanpa melempar', () => {
    expect(normalizeLayout({ theme: { preset: 'jawa' } }).theme.gate).toBe('none');
    expect(normalizeLayout({ theme: { preset: 'jawa', gate: 'door' } }).theme.gate).toBe('door');
    expect(normalizeLayout({ theme: { preset: 'jawa', gate: 'none' } }).theme.gate).toBe('none');
    expect(() => normalizeLayout({ theme: { preset: 'jawa', gate: 'meriam' } })).not.toThrow();
    expect(normalizeLayout({ theme: { preset: 'jawa', gate: 'meriam' } }).theme.gate).toBe('none');
  });

  it('pemilihan gerbang sesuai rekomendasi tema (contoh)', () => {
    expect(designById('sihir')!.gate).toBe('portal');
    expect(designById('hollywood')!.gate).toBe('curtain');
    expect(designById('dongeng')!.gate).toBe('book');
    expect(designById('gugur')!.gate).toBe('leaves');
  });
});

describe('palet warna', () => {
  it('delapan palet Basic valid dan id unik', () => {
    expect(BASIC_PALETTES).toHaveLength(8);
    expect(new Set(BASIC_PALETTES.map((p) => p.id)).size).toBe(8);
    for (const p of BASIC_PALETTES) for (const c of [p.primary, p.secondary, p.background, p.text]) expect(c).toMatch(HEX);
  });

  it('palet pertama Basic = warna bawaan desain rustic, jadi tidak ada entri "bawaan" tambahan', () => {
    const layout = normalizeLayout({ theme: { preset: 'rustic' }, palettes: BASIC_PALETTES }, 'klasik');
    expect(layout.palettes).toHaveLength(8);
    expect(layout.palettes.some((p) => p.id === 'bawaan')).toBe(false);
  });

  it('desain lain mendapat varian otomatis + entri "bawaan"; desain warna tetap tidak', () => {
    const jawa = designById('jawa')!;
    const layout = normalizeLayout({ theme: { preset: 'jawa' }, palettes: autoPalettes(jawa) }, 'suku');
    expect(layout.palettes.map((p) => p.id)).toEqual(['bawaan', 'hangat', 'sejuk']);
    for (const p of layout.palettes) for (const c of [p.primary, p.secondary, p.background, p.text]) expect(c).toMatch(HEX);
    expect(autoPalettes(designById('natal')!)).toEqual([]);
  });

  it('applyPalette mengganti warna snapshot dan menolak id yang tidak ada', () => {
    const layout = normalizeLayout({ theme: { preset: 'rustic' }, palettes: BASIC_PALETTES }, 'klasik');
    const lavender = BASIC_PALETTES.find((p) => p.id === 'lavender')!;
    const applied = applyPalette(layout, 'lavender');
    expect(applied.theme.primary).toBe(lavender.primary);
    expect(applied.theme.background).toBe(lavender.background);
    expect(applied.theme.motif).toBe('rustic');
    expect(applyPalette(layout, undefined)).toBe(layout);
    expect(() => applyPalette(layout, 'tidak-ada')).toThrow(BadRequestException);
  });
});

describe('normalizeLayout: motif & fx', () => {
  it('motif mengikuti preset bila tidak diisi, fx bawaan none', () => {
    const layout = normalizeLayout({ theme: { preset: 'bali' } }, 'suku');
    expect(layout.theme.motif).toBe('bali');
    expect(layout.theme.fx).toBe('none');
    expect(layout.theme.primary).toBe(designById('bali')!.primary);
  });

  it('fx dan motif eksplisit dipakai; nilai fx tidak valid dibuang tanpa melempar', () => {
    expect(normalizeLayout({ theme: { preset: 'jawa', motif: 'bali', fx: 'premium' } }).theme).toMatchObject({ motif: 'bali', fx: 'premium' });
    expect(() => normalizeLayout({ theme: { preset: 'jawa', fx: 'gila' } })).not.toThrow();
  });

  it('URL preset lagu yang berbahaya ditolak (bukan https atau /audio/*.mp3)', () => {
    const layout = normalizeLayout({ musik: { allowed: true, presets: [{ name: 'x', url: 'javascript:alert(1)' }] } });
    expect(layout.musik.presets).toEqual([]);
  });
});
