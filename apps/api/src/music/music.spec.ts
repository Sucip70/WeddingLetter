import { BadRequestException, ConflictException } from '@nestjs/common';
import { findPreset, normalizeLayout, validateInvitationData, withLibrary } from '../templates/layout.js';
import type { MusicPreset } from '../templates/layout.js';
import { trackCreateSchema } from './music.dto.js';
import { MusicService } from './music.service.js';

const row = (over: Record<string, unknown>) => ({
  id: 'trk1',
  title: 'Canon in D',
  artist: 'Pachelbel',
  licenseType: 'PUBLIC_DOMAIN',
  licenseNote: null,
  sourceUrl: null,
  attribution: null,
  minTier: 'BASIC',
  storageKey: 'assets/abc.mp3',
  sizeBytes: 1000,
  durationSec: 240,
  sortOrder: 0,
  status: 'ACTIVE',
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...over,
});

function service(rows: ReturnType<typeof row>[], opts: { used?: number; head?: { sizeBytes: number } | null } = {}) {
  const deleted: string[] = [];
  const prisma = {
    musicTrack: {
      findMany: async () => rows,
      findUnique: async ({ where }: { where: { id: string } }) => rows.find((r) => r.id === where.id) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => row(data),
      delete: async () => undefined,
    },
    $queryRaw: async () => [{ count: opts.used ?? 0 }],
  };
  const storage = {
    publicUrl: (key: string) => `https://cdn.test/${key}`,
    head: async () => (opts.head === undefined ? { sizeBytes: 5000 } : opts.head),
    delete: async (key: string) => void deleted.push(key),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { svc: new MusicService(prisma as any, storage as any), deleted };
}

describe('pustaka lagu per paket', () => {
  const rows = [
    row({ id: 'a', title: 'Canon in D', minTier: 'BASIC', sortOrder: 0 }),
    row({ id: 'b', title: 'Wedding March', minTier: 'BASIC', sortOrder: 1 }),
    row({ id: 'c', title: 'Bebas Royalti', artist: 'Studio X', minTier: 'STANDARD', licenseType: 'ROYALTY_FREE', storageKey: 'assets/c.mp3' }),
    row({ id: 'd', title: 'Eksklusif', minTier: 'PREMIUM', storageKey: 'assets/d.mp3', attribution: 'Musik: Eksklusif oleh Y (CC BY 4.0)' }),
  ];

  it('BASIC hanya melihat lagu BASIC; STANDARD + lagu STANDARD; PREMIUM semuanya', async () => {
    const { svc } = service(rows);
    const lib = await svc.libraryByTier();
    expect(lib.BASIC.map((p) => p.id)).toEqual(['a', 'b']);
    expect(lib.STANDARD.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(lib.PREMIUM.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('preset memuat nama "judul · artis", URL publik, dan kredit hanya bila ada', async () => {
    const { svc } = service(rows);
    const lib = await svc.libraryFor('PREMIUM');
    expect(lib[0]).toEqual({ id: 'a', name: 'Canon in D · Pachelbel', url: 'https://cdn.test/assets/abc.mp3' });
    expect(lib[3]!.credit).toBe('Musik: Eksklusif oleh Y (CC BY 4.0)');
    expect(lib[2]).not.toHaveProperty('credit');
  });

  it('lagu yang diarsipkan tidak dikembalikan (query hanya mengambil ACTIVE)', async () => {
    let where: unknown;
    const prisma = { musicTrack: { findMany: async (args: { where: unknown }) => ((where = args.where), []) } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await new MusicService(prisma as any, { publicUrl: () => '' } as any).libraryByTier();
    expect(where).toEqual({ status: 'ACTIVE' });
  });
});

describe('admin pustaka lagu', () => {
  it('menolak simpan bila file belum terunggah', async () => {
    const { svc } = service([], { head: null });
    await expect(svc.create({ key: 'assets/x.mp3', title: 't', artist: 'a', licenseType: 'CC0', minTier: 'BASIC', sortOrder: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hapus permanen ditolak bila masih dipakai undangan, dan diizinkan bila tidak', async () => {
    const used = service([row({})], { used: 2 });
    await expect(used.svc.remove('trk1')).rejects.toBeInstanceOf(ConflictException);
    expect(used.deleted).toEqual([]);
    const free = service([row({})], { used: 0 });
    await expect(free.svc.remove('trk1')).resolves.toEqual({ ok: true });
    expect(free.deleted).toEqual(['assets/abc.mp3']);
  });

  it('skema simpan: kunci harus dari unggahan aset, URL sumber divalidasi, string kosong jadi null', () => {
    const ok = trackCreateSchema.parse({ key: 'assets/abc123.mp3', title: 'Canon', artist: 'Pachelbel', licenseType: 'PUBLIC_DOMAIN', minTier: 'BASIC', sourceUrl: '', licenseNote: '' });
    expect(ok.sourceUrl).toBeNull();
    expect(ok.licenseNote).toBeNull();
    expect(trackCreateSchema.safeParse({ key: '../etc/passwd', title: 't', artist: 'a', licenseType: 'CC0', minTier: 'BASIC' }).success).toBe(false);
    expect(trackCreateSchema.safeParse({ key: 'assets/a.mp3', title: 't', artist: 'a', licenseType: 'CC0', minTier: 'BASIC', sourceUrl: 'bukan url' }).success).toBe(false);
    expect(trackCreateSchema.safeParse({ key: 'assets/a.mp3', title: 't', artist: 'a', licenseType: 'BEBAS', minTier: 'BASIC' }).success).toBe(false);
  });
});

describe('withLibrary & rujukan lagu', () => {
  const lib: MusicPreset[] = [
    { id: 'a', name: 'Canon in D · Pachelbel', url: 'https://cdn.test/a.mp3' },
    { id: 'b', name: 'Wedding March · Mendelssohn', url: 'https://cdn.test/b.mp3' },
  ];
  const base = normalizeLayout({ sections: ['cover', 'mempelai', 'tanggal_lokasi'], musik: { allowed: true, presets: [{ name: 'Khusus', url: 'https://cdn.test/own.mp3' }] } });

  it('lagu pustaka di depan, lagu khusus template setelahnya dengan id stabil c<urutan>', () => {
    const merged = withLibrary(base, lib);
    expect(merged.musik.presets.map((p) => p.id)).toEqual(['a', 'b', 'c0']);
  });

  it('template tanpa musik tidak diubah', () => {
    const silent = normalizeLayout({ musik: { allowed: false } });
    expect(withLibrary(silent, lib)).toBe(silent);
  });

  it('findPreset: berdasarkan id, atau urutan untuk data lama', () => {
    const merged = withLibrary(base, lib).musik.presets;
    expect(findPreset(merged, 'b')?.url).toBe('https://cdn.test/b.mp3');
    expect(findPreset(merged, '0')?.id).toBe('a');
    expect(findPreset(merged, 'zzz')).toBeUndefined();
    expect(findPreset(merged, '9')).toBeUndefined();
  });

  it('validasi data undangan menerima preset:<id> dan menolak id yang tidak ada', () => {
    const layout = withLibrary(base, lib);
    const secs = [...layout.sections, { id: 'musik' as const, title: 'Musik', fields: [{ key: 'lagu', label: 'Lagu', type: 'song' as const, required: false }] }];
    const data = { mempelai: { pria_nama: 'A', wanita_nama: 'B' }, tanggal_lokasi: { akad_tanggal: '2027-01-01T10:00', akad_lokasi: 'Gedung' } };
    expect(validateInvitationData(secs, layout, { ...data, musik: { lagu: 'preset:b' } }, (r) => r).data.musik).toEqual({ lagu: 'preset:b' });
    expect(() => validateInvitationData(secs, layout, { ...data, musik: { lagu: 'preset:hilang' } }, (r) => r)).toThrow(/tidak ditemukan/);
  });
});
