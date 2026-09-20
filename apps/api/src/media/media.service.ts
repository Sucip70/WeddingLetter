import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { ALLOWED_CONTENT_TYPES, LIMITS, MB } from '../config/constants.js';
import type { MediaFile } from '../generated/prisma/client.js';
import { EXT_BY_TYPE, newId } from '../orders/orders.service.js';
import { billableMb } from '../pricing/pricing.calculator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

export const replaceSchema = z.object({
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().int().positive(),
});

// Ganti semua rujukan `oldId` -> `newId` di isi undangan ({ section: { field: string | string[] } }).
export function replaceRefs(data: unknown, oldId: string, newId: string): unknown {
  if (!data || typeof data !== 'object') return data;
  const out: Record<string, Record<string, unknown>> = {};
  for (const [section, fields] of Object.entries(data as Record<string, Record<string, unknown>>)) {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields ?? {})) {
      if (value === oldId) next[key] = newId;
      else if (Array.isArray(value)) next[key] = value.map((v) => (v === oldId ? newId : v));
      else next[key] = value;
    }
    out[section] = next;
  }
  return out;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async owned(userId: string, mediaId: string) {
    const media = await this.prisma.mediaFile.findFirst({
      where: { id: mediaId, invitation: { order: { userId } } },
      include: { invitation: { include: { order: true } } },
    });
    if (!media || media.status === 'DELETED') throw new NotFoundException('File tidak ditemukan');
    return media;
  }

  // URL upload baru (URL sebelumnya berlaku 15 menit) untuk file yang belum terunggah.
  async presign(userId: string, mediaId: string) {
    const media = await this.owned(userId, mediaId);
    if (media.status !== 'PENDING') throw new ConflictException('File ini sudah terunggah');
    // Unggahan awal hanya sebelum bayar; pengganti file boleh kapan saja selama undangan bisa diedit.
    if (!media.replacesId && media.invitation.order.status !== 'PENDING') throw new ConflictException('Pesanan sudah tidak menunggu unggahan');
    const presigned = await this.storage.presignUpload({ key: media.storageKey, contentType: media.contentType, sizeBytes: media.sizeBytes });
    return { mediaId: media.id, ...presigned };
  }

  // Memastikan file benar-benar ada di storage dengan ukuran persis seperti yang dideklarasikan & dibayar.
  async confirm(userId: string, mediaId: string) {
    const media = await this.owned(userId, mediaId);
    if (media.status !== 'PENDING') return { mediaId: media.id, status: media.status };
    const head = await this.storage.head(media.storageKey);
    if (!head) throw new BadRequestException('File belum terunggah');
    if (head.sizeBytes !== media.sizeBytes) {
      await this.storage.delete(media.storageKey).catch(() => undefined);
      throw new BadRequestException('Ukuran file tidak sesuai dengan yang dideklarasikan, unggah ulang');
    }
    if (media.replacesId) return this.finishReplacement(media);
    await this.prisma.mediaFile.update({ where: { id: media.id }, data: { status: 'UPLOADED' } });
    return { mediaId: media.id, status: 'UPLOADED' as const };
  }

  // Mengganti file yang sudah dibeli tanpa biaya, selama tidak menambah yang harus dibayar:
  //  - file "termasuk template": file baru harus muat di batas ukuran gratis
  //  - file sewa: ukuran baru (dibulatkan ke MB) tidak boleh melebihi yang sudah dibayar
  async replace(userId: string, mediaId: string, input: z.infer<typeof replaceSchema>) {
    const old = await this.owned(userId, mediaId);
    const { invitation } = old;
    if (invitation.order.status !== 'PAID') throw new ConflictException('Pesanan belum dibayar');
    if (!['DRAFT', 'ACTIVE', 'PAUSED'].includes(invitation.status)) throw new ConflictException('Undangan yang sudah berakhir tidak bisa diedit, perpanjang dulu');
    if (!['UPLOADED', 'ACTIVE', 'PAUSED'].includes(old.status)) throw new ConflictException('File ini tidak bisa diganti sekarang');
    if (!ALLOWED_CONTENT_TYPES[old.type].includes(input.contentType)) throw new BadRequestException(`Tipe file harus sama jenisnya (${old.type.toLowerCase()})`);

    const hardMb = old.type === 'PHOTO' ? LIMITS.maxPhotoMb : old.type === 'VIDEO' ? LIMITS.maxVideoMb : LIMITS.maxSongMb;
    if (input.sizeBytes > hardMb * MB) throw new BadRequestException(`Ukuran maksimal ${hardMb} MB`);
    if (old.included) {
      const freeMb = old.type === 'PHOTO' ? LIMITS.includedPhotoMb : old.type === 'VIDEO' ? LIMITS.includedVideoMb : LIMITS.maxSongMb;
      if (input.sizeBytes > freeMb * MB) {
        throw new BadRequestException(`File pengganti maksimal ${freeMb} MB agar tetap termasuk dalam paket Anda (foto dikompres otomatis di editor)`);
      }
    } else if (billableMb(input.sizeBytes) > billableMb(old.sizeBytes)) {
      throw new BadRequestException(`Ukuran melebihi yang sudah dibayar (${billableMb(old.sizeBytes)} MB). Gunakan file yang sama besar atau lebih kecil`);
    }

    // Hanya satu penggantian tertunda per file: bersihkan percobaan sebelumnya.
    const previous = await this.prisma.mediaFile.findMany({ where: { replacesId: old.id, status: 'PENDING' } });
    await this.dropMedia(previous);

    const id = newId();
    const key = `${invitation.id}/${id}.${EXT_BY_TYPE[input.contentType] ?? 'bin'}`;
    await this.prisma.mediaFile.create({
      data: {
        id,
        invitationId: invitation.id,
        type: old.type,
        storageKey: key,
        url: this.storage.publicUrl(key),
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        sizeMb: input.sizeBytes / MB,
        included: old.included,
        rentedWeeks: old.rentedWeeks,
        rentalPrice: old.rentalPrice,
        replacesId: old.id,
        status: 'PENDING',
      },
    });
    const presigned = await this.storage.presignUpload({ key, contentType: input.contentType, sizeBytes: input.sizeBytes });
    return { mediaId: id, replaces: old.id, ...presigned };
  }

  private async finishReplacement(media: MediaFile) {
    const old = media.replacesId ? await this.prisma.mediaFile.findUnique({ where: { id: media.replacesId } }) : null;
    if (!old || old.status === 'DELETED') {
      await this.dropMedia([media]);
      throw new ConflictException('File asli sudah tidak ada, penggantian dibatalkan');
    }
    await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUniqueOrThrow({ where: { id: media.invitationId } });
      await tx.invitation.update({ where: { id: invitation.id }, data: { data: replaceRefs(invitation.data, old.id, media.id) as object } });
      await tx.mediaFile.update({
        where: { id: media.id },
        data: { status: old.status, expiresAt: old.expiresAt, remainingDays: old.remainingDays, replacesId: null },
      });
      await tx.mediaFile.update({ where: { id: old.id }, data: { status: 'DELETED' } });
    });
    await this.storage.delete(old.storageKey).catch((error) => this.logger.error(`Gagal menghapus ${old.storageKey}: ${(error as Error).message}`));
    return { mediaId: media.id, status: old.status, replaced: old.id };
  }

  private async dropMedia(items: MediaFile[]) {
    for (const m of items) await this.storage.delete(m.storageKey).catch(() => undefined);
    if (items.length) await this.prisma.mediaFile.deleteMany({ where: { id: { in: items.map((m) => m.id) } } });
  }
}
