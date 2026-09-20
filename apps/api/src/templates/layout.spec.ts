import { BadRequestException } from '@nestjs/common';
import { effectiveSections, normalizeLayout, toAuthoring, validateInvitationData } from './layout.js';

// Bentuk seed lama: section berupa string & flag rsvp.
const legacy = {
  sections: ['cover', 'mempelai', 'tanggal_lokasi', 'galeri'],
  galeri: { maxPhotos: 4 },
  musik: { allowed: false },
  rsvp: { allowed: false },
};

describe('normalizeLayout', () => {
  it('menerima skema lama (section string) dan melengkapi field & tema', () => {
    const layout = normalizeLayout(legacy, 'rustic');
    expect(layout.sections.map((s) => s.id)).toEqual(['cover', 'mempelai', 'tanggal_lokasi', 'galeri']);
    expect(layout.sections[1]!.fields.find((f) => f.key === 'pria_nama')?.required).toBe(true);
    expect(layout.theme.preset).toBe('rustic');
    expect(layout.galeri).toEqual({ maxPhotos: 4, maxVideos: 0 });
  });

  it('membuang section tak dikenal & duplikat, tidak pernah melempar untuk data aneh', () => {
    expect(normalizeLayout({ sections: ['cover', 'cover', 'hack', 42] }).sections.map((s) => s.id)).toEqual(['cover']);
    expect(() => normalizeLayout('bukan objek')).not.toThrow();
    expect(normalizeLayout(null).sections).toEqual([]);
  });

  it('override field: nonaktif, wajib, label', () => {
    const layout = normalizeLayout({
      sections: [{ id: 'tanggal_lokasi', fields: [{ key: 'akad_maps', enabled: false }, { key: 'akad_lokasi', required: false, label: 'Gedung' }] }],
    });
    const fields = layout.sections[0]!.fields;
    expect(fields.some((f) => f.key === 'akad_maps')).toBe(false);
    expect(fields.find((f) => f.key === 'akad_lokasi')).toMatchObject({ required: false, label: 'Gedung' });
  });

  it('section dengan enabled:false tidak ikut', () => {
    expect(normalizeLayout({ sections: [{ id: 'cover', enabled: false }, { id: 'mempelai' }] }).sections.map((s) => s.id)).toEqual(['mempelai']);
  });

  it('tema: preset default dari kategori, warna kustom menimpa', () => {
    expect(normalizeLayout({}, 'floral').theme.primary).toBe('#c4587a');
    expect(normalizeLayout({ theme: { preset: 'elegant', primary: '#111111' } }).theme).toMatchObject({ preset: 'elegant', primary: '#111111' });
  });
});

describe('effectiveSections (add-on membuka section)', () => {
  const layout = normalizeLayout(legacy);
  it('menyisipkan RSVP & amplop digital di posisi baku, dan musik jika diizinkan', () => {
    const ids = effectiveSections({ ...layout, musik: { allowed: true, presets: [] } }, { rsvp: true, envelope: true }).map((s) => s.id);
    expect(ids).toEqual(['cover', 'musik', 'mempelai', 'tanggal_lokasi', 'galeri', 'rsvp', 'amplop_digital']);
  });
  it('tanpa add-on, section template apa adanya', () => {
    expect(effectiveSections(layout, {}).map((s) => s.id)).toEqual(['cover', 'mempelai', 'tanggal_lokasi', 'galeri']);
  });
  it('tidak menggandakan section yang sudah ada di template', () => {
    const withRsvp = normalizeLayout({ sections: ['mempelai', 'rsvp'] });
    expect(effectiveSections(withRsvp, { rsvp: true }).filter((s) => s.id === 'rsvp')).toHaveLength(1);
  });
});

describe('validateInvitationData', () => {
  const layout = normalizeLayout(legacy);
  const sections = effectiveSections(layout, {});
  const valid = {
    mempelai: { pria_nama: 'Andi', wanita_nama: 'Sinta' },
    tanggal_lokasi: { akad_tanggal: '2026-12-12T10:00', akad_lokasi: 'Gedung' },
  };

  it('data valid lolos, nilai dirapikan (trim) & field tak dikenal dibuang', () => {
    const { data } = validateInvitationData(sections, layout, {
      ...valid,
      mempelai: { pria_nama: '  Andi  ', wanita_nama: 'Sinta', sembarang: 'x' },
      rsvp: { pengantar: 'tidak ada section ini' },
    });
    expect(data.mempelai).toEqual({ pria_nama: 'Andi', wanita_nama: 'Sinta' });
    expect(data.rsvp).toBeUndefined();
  });

  it('field wajib kosong -> 400 dengan pesan per field; lenient melewatinya', () => {
    expect(() => validateInvitationData(sections, layout, {})).toThrow(BadRequestException);
    expect(() => validateInvitationData(sections, layout, {})).toThrow(/Nama panggilan mempelai pria wajib diisi/);
    expect(validateInvitationData(sections, layout, {}, undefined, { lenient: true }).data).toEqual({});
  });

  it('tanggal harus format lokal YYYY-MM-DDTHH:mm yang valid', () => {
    const bad = (v: string) => () => validateInvitationData(sections, layout, { ...valid, tanggal_lokasi: { akad_tanggal: v, akad_lokasi: 'x' } });
    expect(bad('2026-12-12')).toThrow(BadRequestException);
    expect(bad('2026-13-40T10:00')).toThrow(BadRequestException);
    expect(bad('besok')).toThrow(BadRequestException);
  });

  it('URL hanya http(s)', () => {
    const withMaps = (u: string) => () => validateInvitationData(sections, layout, { ...valid, tanggal_lokasi: { ...valid.tanggal_lokasi, akad_maps: u } });
    expect(withMaps('javascript:alert(1)')).toThrow(BadRequestException);
    expect(withMaps('https://maps.app.goo.gl/abc')).not.toThrow();
  });

  it('batas panjang teks', () => {
    expect(() => validateInvitationData(sections, layout, { ...valid, mempelai: { pria_nama: 'x'.repeat(41), wanita_nama: 'S' } })).toThrow(/maksimal 40/);
  });

  it('mengumpulkan rujukan media: foto field, galeri (tanpa duplikat), video', () => {
    const { mediaRefs } = validateInvitationData(sections, layout, {
      ...valid,
      cover: { foto: 'c1' },
      galeri: { foto: ['a', 'b', 'a'], video: ['v1'] },
    });
    expect(mediaRefs.photos).toEqual(['c1', 'a', 'b']);
    expect(mediaRefs.galleryPhotos).toEqual(['a', 'b']);
    expect(mediaRefs.videos).toEqual(['v1']);
  });

  it('lagu: preset:N harus ada; selain itu dianggap rujukan media', () => {
    const withMusic = { ...layout, musik: { allowed: true, presets: [{ name: 'Lagu A', url: 'https://x/a.mp3' }] } };
    const secs = effectiveSections(withMusic, {});
    expect(validateInvitationData(secs, withMusic, { ...valid, musik: { lagu: 'preset:0' } }).data.musik).toEqual({ lagu: 'preset:0' });
    expect(() => validateInvitationData(secs, withMusic, { ...valid, musik: { lagu: 'preset:5' } })).toThrow(/tidak ditemukan/);
    expect(validateInvitationData(secs, withMusic, { ...valid, musik: { lagu: 'custom1' } }).mediaRefs.songs).toEqual(['custom1']);
  });

  it('resolver media memetakan rujukan mentah ke id final', () => {
    const { data } = validateInvitationData(sections, layout, { ...valid, cover: { foto: 'client1' } }, (raw) => `real-${raw}`);
    expect(data.cover).toEqual({ foto: 'real-client1' });
  });
});

describe('toAuthoring (template builder)', () => {
  it('memuat semua section builder (9), aktif dulu sesuai urutan, dan round-trip ke normalizeLayout', () => {
    const authoring = toAuthoring(legacy, 'rustic');
    expect(authoring.sections).toHaveLength(9);
    expect(authoring.sections.slice(0, 4).map((s) => s.id)).toEqual(['cover', 'mempelai', 'tanggal_lokasi', 'galeri']);
    expect(authoring.sections.filter((s) => s.enabled).map((s) => s.id)).toEqual(['cover', 'mempelai', 'tanggal_lokasi', 'galeri']);
    // Menyimpan hasil builder apa adanya tidak mengubah skema efektif.
    const roundTrip = normalizeLayout({ ...authoring, sections: authoring.sections });
    expect(roundTrip.sections.map((s) => s.id)).toEqual(normalizeLayout(legacy).sections.map((s) => s.id));
    expect(roundTrip.sections[1]!.fields).toEqual(normalizeLayout(legacy).sections[1]!.fields);
  });
});
