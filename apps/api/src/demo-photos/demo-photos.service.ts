import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { DEMO_SLOTS, SLOT_IDS, defaultKey } from './demo-photos.slots.js';

const DEFAULTS_DIR = new URL('../../assets/demo/', import.meta.url);
export const KEY_RE = /^assets\/[A-Za-z0-9_-]+\.(jpe?g|png|webp)$/;

// Mengunggah berkas bawaan (SVG) untuk satu slot ke storage. Kunci tetap, jadi aman dijalankan berulang.
export async function uploadDefaultFile(storage: Pick<StorageService, 'put'>, slot: string) {
  const body = await readFile(fileURLToPath(new URL(`${slot}.svg`, DEFAULTS_DIR)));
  await storage.put(defaultKey(slot), body, 'image/svg+xml');
}

@Injectable()
export class DemoPhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private urlOf(key: string, updatedAt: Date) {
    return `${this.storage.publicUrl(key)}?v=${updatedAt.getTime()}`;
  }

  private assertSlot(slot: string) {
    if (!SLOT_IDS.includes(slot)) throw new NotFoundException('Slot foto tidak dikenal');
  }

  // Publik: peta slot -> URL untuk demo template. Slot kosong tidak disertakan.
  async publicMap(): Promise<Record<string, string>> {
    const rows = await this.prisma.demoPhoto.findMany();
    return Object.fromEntries(rows.filter((r) => SLOT_IDS.includes(r.slot)).map((r) => [r.slot, this.urlOf(r.storageKey, r.updatedAt)]));
  }

  async list() {
    const rows = new Map((await this.prisma.demoPhoto.findMany()).map((r) => [r.slot, r]));
    return DEMO_SLOTS.map((s) => {
      const row = rows.get(s.slot);
      return { ...s, url: row ? this.urlOf(row.storageKey, row.updatedAt) : null, isDefault: !!row && row.storageKey === defaultKey(s.slot) };
    });
  }

  // Ganti foto slot dengan berkas yang sudah diunggah admin lewat /admin/assets/presign.
  async set(slot: string, key: string) {
    this.assertSlot(slot);
    if (!KEY_RE.test(key)) throw new BadRequestException('Kunci file tidak valid');
    if (!(await this.storage.head(key))) throw new BadRequestException('File belum terunggah. Unggah dulu, lalu simpan.');
    await this.replace(slot, key);
    return this.list();
  }

  // Kembalikan ke foto bawaan (mengunggah ulang berkas bawaan bila perlu).
  async reset(slot: string) {
    this.assertSlot(slot);
    const def = DEMO_SLOTS.find((s) => s.slot === slot)!;
    if (!def.hasDefault) throw new BadRequestException('Slot ini tidak punya foto bawaan');
    await uploadDefaultFile(this.storage, slot);
    await this.replace(slot, defaultKey(slot));
    return this.list();
  }

  // Kosongkan slot (demo kembali memakai kotak placeholder).
  async clear(slot: string) {
    this.assertSlot(slot);
    const row = await this.prisma.demoPhoto.findUnique({ where: { slot } });
    if (row) {
      await this.prisma.demoPhoto.delete({ where: { slot } });
      await this.dropFile(row.storageKey, slot);
    }
    return this.list();
  }

  private async replace(slot: string, key: string) {
    const previous = await this.prisma.demoPhoto.findUnique({ where: { slot } });
    await this.prisma.demoPhoto.upsert({ where: { slot }, create: { slot, storageKey: key }, update: { storageKey: key } });
    if (previous && previous.storageKey !== key) await this.dropFile(previous.storageKey, slot);
  }

  // Berkas bawaan dipertahankan (untuk "kembalikan ke bawaan"); hanya berkas unggahan admin yang dihapus.
  private async dropFile(key: string, slot: string) {
    if (key !== defaultKey(slot)) await this.storage.delete(key).catch(() => undefined);
  }
}
