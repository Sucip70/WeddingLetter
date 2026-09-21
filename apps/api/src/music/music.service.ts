import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { MusicTrack, TemplateTier } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { MusicPreset } from '../templates/layout.js';
import type { TrackCreate, TrackUpdate } from './music.dto.js';

const RANK: Record<TemplateTier, number> = { BASIC: 0, STANDARD: 1, PREMIUM: 2 };

// Pustaka lagu bawaan: satu-satunya sumber lagu bawaan untuk semua template. Lagu dengan minTier BASIC
// tampil di semua paket, STANDARD di Standard & Premium, PREMIUM hanya di Premium.
@Injectable()
export class MusicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  toPreset(t: MusicTrack): MusicPreset {
    return {
      id: t.id,
      name: t.artist ? `${t.title} · ${t.artist}` : t.title,
      url: this.storage.publicUrl(t.storageKey),
      ...(t.attribution ? { credit: t.attribution } : {}),
    };
  }

  private async activeTracks() {
    return this.prisma.musicTrack.findMany({ where: { status: 'ACTIVE' }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  // Satu kali query untuk ketiga paket (dipakai katalog yang menampilkan banyak template).
  async libraryByTier(): Promise<Record<TemplateTier, MusicPreset[]>> {
    const tracks = await this.activeTracks();
    const pick = (tier: TemplateTier) => tracks.filter((t) => RANK[t.minTier] <= RANK[tier]).map((t) => this.toPreset(t));
    return { BASIC: pick('BASIC'), STANDARD: pick('STANDARD'), PREMIUM: pick('PREMIUM') };
  }

  async libraryFor(tier: TemplateTier): Promise<MusicPreset[]> {
    return (await this.libraryByTier())[tier];
  }

  // ----- Admin -----

  async list() {
    const rows = await this.prisma.musicTrack.findMany({ orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
    return rows.map((t) => ({ ...t, url: this.storage.publicUrl(t.storageKey) }));
  }

  async create(input: TrackCreate) {
    const { key, ...data } = input;
    const head = await this.storage.head(key);
    if (!head) throw new BadRequestException('File belum terunggah. Unggah file lagu dulu, lalu simpan.');
    const row = await this.prisma.musicTrack.create({ data: { ...data, storageKey: key, sizeBytes: head.sizeBytes } });
    return { ...row, url: this.storage.publicUrl(row.storageKey) };
  }

  async update(id: string, input: TrackUpdate) {
    const current = await this.prisma.musicTrack.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Lagu tidak ditemukan');
    const row = await this.prisma.musicTrack.update({ where: { id }, data: input });
    return { ...row, url: this.storage.publicUrl(row.storageKey) };
  }

  // Undangan yang sudah dibeli menyimpan snapshot URL lagu. Menghapus file yang masih dipakai akan
  // membisukan undangan itu, jadi hapus permanen hanya bila tidak ada undangan yang merujuknya.
  async remove(id: string) {
    const track = await this.prisma.musicTrack.findUnique({ where: { id } });
    if (!track) throw new NotFoundException('Lagu tidak ditemukan');
    const used = await this.prisma.$queryRaw<{ count: number }[]>`select count(*)::int as count from invitations where layout::text like ${`%${track.storageKey}%`}`;
    const count = used[0]?.count ?? 0;
    if (count > 0) throw new ConflictException(`Lagu masih dipakai ${count} undangan. Arsipkan saja (tidak tampil untuk pembeli baru, undangan lama tetap berbunyi).`);
    await this.prisma.musicTrack.delete({ where: { id } });
    await this.storage.delete(track.storageKey).catch(() => undefined);
    return { ok: true };
  }
}
