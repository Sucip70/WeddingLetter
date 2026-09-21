import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DEMO_SLOTS, SLOT_IDS, defaultKey } from './demo-photos.slots.js';
import { DemoPhotosService, KEY_RE, uploadDefaultFile } from './demo-photos.service.js';

interface Row {
  slot: string;
  storageKey: string;
  updatedAt: Date;
}

function setup(existing: string[] = []) {
  const rows = new Map<string, Row>(existing.map((k) => [k.split('=')[0]!, { slot: k.split('=')[0]!, storageKey: k.split('=')[1]!, updatedAt: new Date(1000) }]));
  const uploaded: string[] = [];
  const deleted: string[] = [];
  const present = new Set<string>(['assets/mine.jpg']);
  const prisma = {
    demoPhoto: {
      findMany: async () => [...rows.values()],
      findUnique: async ({ where }: { where: { slot: string } }) => rows.get(where.slot) ?? null,
      upsert: async ({ where, create, update }: { where: { slot: string }; create: Row; update: { storageKey: string } }) => {
        const row = rows.get(where.slot);
        rows.set(where.slot, row ? { ...row, ...update, updatedAt: new Date(2000) } : { ...create, updatedAt: new Date(2000) });
      },
      delete: async ({ where }: { where: { slot: string } }) => void rows.delete(where.slot),
    },
  };
  const storage = {
    publicUrl: (key: string) => `https://cdn.test/${key}`,
    head: async (key: string) => (present.has(key) ? { sizeBytes: 10 } : null),
    put: async (key: string) => void uploaded.push(key),
    delete: async (key: string) => void deleted.push(key),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { svc: new DemoPhotosService(prisma as any, storage as any), rows, uploaded, deleted, storage };
}

describe('slot foto demo', () => {
  it('id slot unik dan setiap slot berbasis berkas bawaan benar-benar ada di assets/demo', () => {
    expect(new Set(SLOT_IDS).size).toBe(SLOT_IDS.length);
    for (const slot of DEMO_SLOTS.filter((s) => s.hasDefault)) {
      expect(existsSync(fileURLToPath(new URL(`../../assets/demo/${slot.slot}.svg`, import.meta.url)))).toBe(true);
    }
  });

  it('kunci bawaan mengikuti pola assets/demo-<slot>.svg', () => {
    expect(defaultKey('groom')).toBe('assets/demo-groom.svg');
  });

  it('uploadDefaultFile mengirim SVG ke kunci bawaan', async () => {
    const puts: [string, number, string][] = [];
    await uploadDefaultFile({ put: async (k: string, b: Buffer, t: string) => void puts.push([k, b.length, t]) }, 'bride');
    expect(puts).toHaveLength(1);
    expect(puts[0]![0]).toBe('assets/demo-bride.svg');
    expect(puts[0]![1]).toBeGreaterThan(500);
    expect(puts[0]![2]).toBe('image/svg+xml');
  });
});

describe('DemoPhotosService', () => {
  it('publicMap hanya memuat slot terisi dengan URL bertanda versi', async () => {
    const { svc } = setup(['groom=assets/demo-groom.svg']);
    expect(await svc.publicMap()).toEqual({ groom: 'https://cdn.test/assets/demo-groom.svg?v=1000' });
  });

  it('list menampilkan semua slot, menandai bawaan vs foto sendiri vs kosong', async () => {
    const { svc } = setup(['groom=assets/demo-groom.svg', 'bride=assets/mine.jpg']);
    const list = await svc.list();
    expect(list).toHaveLength(DEMO_SLOTS.length);
    expect(list.find((s) => s.slot === 'groom')).toMatchObject({ isDefault: true, url: expect.stringContaining('demo-groom.svg') });
    expect(list.find((s) => s.slot === 'bride')).toMatchObject({ isDefault: false });
    expect(list.find((s) => s.slot === 'cover')).toMatchObject({ url: null, isDefault: false });
  });

  it('set: menolak slot asing, kunci tidak valid, dan file yang belum terunggah', async () => {
    const { svc } = setup();
    await expect(svc.set('xyz', 'assets/mine.jpg')).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.set('groom', '../etc/passwd')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.set('groom', 'assets/belum.jpg')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('set: mengganti foto menghapus unggahan lama tetapi mempertahankan berkas bawaan', async () => {
    const { svc, rows, deleted } = setup(['groom=assets/demo-groom.svg']);
    await svc.set('groom', 'assets/mine.jpg');
    expect(rows.get('groom')!.storageKey).toBe('assets/mine.jpg');
    expect(deleted).toEqual([]); // bawaan tidak dihapus

    const second = setup(['groom=assets/old.jpg']);
    await second.svc.set('groom', 'assets/mine.jpg');
    expect(second.deleted).toEqual(['assets/old.jpg']);
  });

  it('reset: mengunggah ulang bawaan, memasang kunci bawaan, dan menghapus unggahan admin', async () => {
    const { svc, rows, uploaded, deleted } = setup(['gallery2=assets/mine.jpg']);
    await svc.reset('gallery2');
    expect(uploaded).toEqual(['assets/demo-gallery2.svg']);
    expect(rows.get('gallery2')!.storageKey).toBe('assets/demo-gallery2.svg');
    expect(deleted).toEqual(['assets/mine.jpg']);
    await expect(svc.reset('cover')).rejects.toBeInstanceOf(BadRequestException); // tanpa bawaan
  });

  it('clear: mengosongkan slot dan menghapus unggahan admin (bawaan dipertahankan)', async () => {
    const custom = setup(['bride=assets/mine.jpg']);
    await custom.svc.clear('bride');
    expect(custom.rows.has('bride')).toBe(false);
    expect(custom.deleted).toEqual(['assets/mine.jpg']);

    const def = setup(['bride=assets/demo-bride.svg']);
    await def.svc.clear('bride');
    expect(def.rows.has('bride')).toBe(false);
    expect(def.deleted).toEqual([]);
  });

  it('KEY_RE hanya menerima gambar JPG/PNG/WebP di folder assets', () => {
    expect(KEY_RE.test('assets/abc_1-2.jpg')).toBe(true);
    expect(KEY_RE.test('assets/abc.webp')).toBe(true);
    expect(KEY_RE.test('assets/abc.svg')).toBe(false);
    expect(KEY_RE.test('uploads/abc.jpg')).toBe(false);
    expect(KEY_RE.test('assets/../abc.jpg')).toBe(false);
  });
});
