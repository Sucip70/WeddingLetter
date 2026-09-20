import { replaceRefs } from './media.service.js';

describe('replaceRefs (penggantian file)', () => {
  const data = {
    cover: { foto: 'old1', pembuka: 'old1 bukan rujukan karena ini teks panjang' },
    galeri: { foto: ['a', 'old1', 'b'], video: ['v1'] },
    musik: { lagu: 'preset:0' },
  };

  it('menukar rujukan tunggal dan di dalam daftar, tanpa menyentuh yang lain', () => {
    const out = replaceRefs(data, 'old1', 'new1') as typeof data;
    expect(out.cover.foto).toBe('new1');
    expect(out.galeri.foto).toEqual(['a', 'new1', 'b']);
    expect(out.galeri.video).toEqual(['v1']);
    expect(out.musik.lagu).toBe('preset:0');
  });

  it('hanya cocok persis (teks yang memuat id tidak diubah)', () => {
    const out = replaceRefs(data, 'old1', 'new1') as typeof data;
    expect(out.cover.pembuka).toBe('old1 bukan rujukan karena ini teks panjang');
  });

  it('tidak mengubah objek asli dan aman untuk data kosong/aneh', () => {
    replaceRefs(data, 'old1', 'new1');
    expect(data.cover.foto).toBe('old1');
    expect(replaceRefs(null, 'a', 'b')).toBeNull();
    expect(replaceRefs({}, 'a', 'b')).toEqual({});
  });
});
