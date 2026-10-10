import { BadRequestException } from '@nestjs/common';
import { applyPalette, normalizeLayout } from './layout.js';
import { BASIC_DESIGN_IDS, BASIC_PALETTES, basicPalettes, DESIGNS, GATE_KINDS, GROUP_ORDER, autoPalettes, designById } from './themes.js';

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

describe('paket Basic', () => {
  it('desain Basic ada di registry: rustic, floral, elegant, buket', () => {
    expect([...BASIC_DESIGN_IDS]).toEqual(['rustic', 'floral', 'elegant', 'buket']);
    for (const id of BASIC_DESIGN_IDS) expect(designById(id)).toBeDefined();
  });
});

describe('Buket Pengantin', () => {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [16, 8, 0].map((s) => {
      const v = ((n >> s) & 255) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

  it('desain klasik bergerbang "bouquet", tersedia di Basic, dan paket Basic memakai palet desain (bukan 8 warna bumi)', () => {
    const d = designById('buket')!;
    expect(d.group).toBe('klasik');
    expect(d.gate).toBe('bouquet');
    expect(BASIC_DESIGN_IDS).toContain('buket');
    expect(basicPalettes('buket')).toEqual(autoPalettes(d));
    expect(basicPalettes('rustic')).toBe(BASIC_PALETTES);
  });

  it('latar tetap putih di semua palet dan warna utama cukup kontras (judul & tombol) di atas putih', () => {
    const palettes = autoPalettes(designById('buket')!);
    expect(palettes.length).toBeGreaterThanOrEqual(5);
    for (const p of palettes) {
      expect(p.background.toLowerCase()).toBe('#ffffff');
      expect(contrast(p.primary, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.text, '#ffffff')).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('gerbang pembuka', () => {
  it('setiap desain punya gerbang bawaan yang valid; semua jenis gerbang dipakai minimal satu desain', () => {
    for (const design of DESIGNS) expect(GATE_KINDS).toContain(design.gate);
    // 'glass' (jendela kaca patri) tidak lagi jadi bawaan desain mana pun, tapi tetap bisa dipilih admin di builder dan
    // dipakai template lama.
    const builderOnly = ['glass'];
    const used = new Set(DESIGNS.map((x) => x.gate));
    expect([...used, ...builderOnly].sort()).toEqual([...GATE_KINDS].sort());
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

  it.each(['elegant', 'kristiani', 'buket'])('%s memakai palet pilihan tangan (bukan geseran rona): id unik, warna valid, latar terang & teks gelap', (id) => {
    const palettes = autoPalettes(designById(id)!);
    expect(palettes.length).toBeGreaterThan(0);
    expect(new Set(palettes.map((p) => p.id)).size).toBe(palettes.length);
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    };
    for (const p of palettes) {
      for (const c of [p.primary, p.secondary, p.background, p.text]) expect(c).toMatch(HEX);
      expect(p.id).not.toBe('bawaan');
      expect(lum(p.background)).toBeGreaterThan(0.85);
      expect(lum(p.text)).toBeLessThan(0.25);
    }
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
