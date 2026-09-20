import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DAY_MS, GRACE_DAYS, WEEK_MS } from '../config/constants.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

type Tx = Prisma.TransactionClient;
const addMs = (d: Date, ms: number) => new Date(d.getTime() + ms);
const daysLeft = (until: Date | null, now: Date) => (until ? Math.max(0, Math.ceil((until.getTime() - now.getTime()) / DAY_MS)) : 0);

// Siklus hidup undangan & sewa media (Bagian 7.1, 8, 10):
//   DRAFT --publish--> ACTIVE --(expiresAt lewat)--> EXPIRED_GRACE --(+30 hari)--> DELETED
//   ACTIVE <--pause/resume--> PAUSED (hitung mundur berhenti, sisa hari disimpan)
//   EXPIRED_GRACE / ACTIVE --extend--> ACTIVE
@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async publish(invitationId: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id: invitationId }, include: { order: true, mediaFiles: true } });
    if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    if (inv.status !== 'DRAFT') throw new ConflictException('Undangan sudah dipublikasikan');
    if (inv.order.status !== 'PAID') throw new BadRequestException('Selesaikan pembayaran terlebih dahulu');
    if (inv.mediaFiles.some((m) => m.status === 'PENDING')) throw new ConflictException('Masih ada file yang belum selesai diunggah');

    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      for (const m of inv.mediaFiles.filter((x) => x.status === 'UPLOADED')) {
        await tx.mediaFile.update({ where: { id: m.id }, data: { status: 'ACTIVE', expiresAt: addMs(now, m.rentedWeeks * WEEK_MS) } });
      }
      return tx.invitation.update({
        where: { id: inv.id },
        data: { status: 'ACTIVE', publishedAt: now, expiresAt: addMs(now, inv.order.activeWeeks * WEEK_MS), reminderSentAt: null },
      });
    });
  }

  async pause(invitationId: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id: invitationId }, include: { mediaFiles: true } });
    if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    if (inv.status !== 'ACTIVE') throw new ConflictException('Hanya undangan aktif yang bisa dijeda');
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      for (const m of inv.mediaFiles.filter((x) => x.status === 'ACTIVE')) {
        await tx.mediaFile.update({ where: { id: m.id }, data: { status: 'PAUSED', remainingDays: daysLeft(m.expiresAt, now), expiresAt: null } });
      }
      return tx.invitation.update({
        where: { id: inv.id },
        data: { status: 'PAUSED', pausedAt: now, remainingDays: daysLeft(inv.expiresAt, now), expiresAt: null },
      });
    });
  }

  // `extraDays`: tambahan hari gratis dari admin saat melanjutkan.
  async resume(invitationId: string, extraDays = 0) {
    const inv = await this.prisma.invitation.findUnique({ where: { id: invitationId }, include: { mediaFiles: true } });
    if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    if (inv.status !== 'PAUSED') throw new ConflictException('Undangan tidak sedang dijeda');
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      for (const m of inv.mediaFiles.filter((x) => x.status === 'PAUSED')) {
        await tx.mediaFile.update({
          where: { id: m.id },
          data: { status: 'ACTIVE', expiresAt: addMs(now, ((m.remainingDays ?? 0) + extraDays) * DAY_MS), remainingDays: null },
        });
      }
      return tx.invitation.update({
        where: { id: inv.id },
        data: {
          status: 'ACTIVE',
          pausedAt: null,
          expiresAt: addMs(now, ((inv.remainingDays ?? 0) + extraDays) * DAY_MS),
          remainingDays: null,
          reminderSentAt: null,
        },
      });
    });
  }

  // Menambah masa aktif (perpanjangan berbayar atau hadiah admin). Bisa memulihkan undangan yang
  // sudah masuk masa tenggang selama datanya belum dihapus.
  async extend(invitationId: string, weeks: number, tx?: Tx) {
    const run = async (db: Tx) => {
      const inv = await db.invitation.findUnique({ where: { id: invitationId }, include: { mediaFiles: true } });
      if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
      if (!inv.publishedAt) throw new BadRequestException('Undangan belum dipublikasikan');
      const now = new Date();
      const add = weeks * WEEK_MS;

      if (inv.status === 'PAUSED') {
        for (const m of inv.mediaFiles.filter((x) => x.status === 'PAUSED')) {
          await db.mediaFile.update({ where: { id: m.id }, data: { remainingDays: (m.remainingDays ?? 0) + weeks * 7 } });
        }
        return db.invitation.update({ where: { id: inv.id }, data: { remainingDays: (inv.remainingDays ?? 0) + weeks * 7 } });
      }

      for (const m of inv.mediaFiles.filter((x) => x.status === 'ACTIVE' || x.status === 'EXPIRED_GRACE')) {
        const base = m.status === 'ACTIVE' && m.expiresAt && m.expiresAt > now ? m.expiresAt : now;
        await db.mediaFile.update({ where: { id: m.id }, data: { status: 'ACTIVE', expiresAt: addMs(base, add) } });
      }
      const base = inv.status === 'ACTIVE' && inv.expiresAt && inv.expiresAt > now ? inv.expiresAt : now;
      return db.invitation.update({
        where: { id: inv.id },
        data: { status: 'ACTIVE', expiresAt: addMs(base, add), reminderSentAt: null },
      });
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  // Menandai yang kedaluwarsa masuk masa tenggang. Idempotent: aman dijalankan berulang.
  async expireDue(now = new Date()) {
    const invitations = await this.prisma.invitation.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
      data: { status: 'EXPIRED_GRACE' },
    });
    const media = await this.prisma.mediaFile.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
      data: { status: 'EXPIRED_GRACE' },
    });
    return { invitations: invitations.count, media: media.count };
  }

  // Menghapus permanen yang sudah lewat masa tenggang (file di storage ikut dihapus).
  async purgeDue(now = new Date()) {
    const cutoff = new Date(now.getTime() - GRACE_DAYS * DAY_MS);
    const media = await this.prisma.mediaFile.findMany({ where: { status: 'EXPIRED_GRACE', expiresAt: { lt: cutoff } } });
    await this.deleteObjects(media);
    await this.prisma.mediaFile.updateMany({ where: { id: { in: media.map((m) => m.id) } }, data: { status: 'DELETED' } });

    const invitations = await this.prisma.invitation.findMany({
      where: { status: 'EXPIRED_GRACE', expiresAt: { lt: cutoff } },
      select: { id: true },
    });
    for (const inv of invitations) await this.deleteInvitation(inv.id);
    return { invitations: invitations.length, media: media.length };
  }

  // Penggantian file yang tidak pernah selesai diunggah (> 24 jam) dibersihkan.
  async purgeStaleReplacements(now = new Date()) {
    const cutoff = new Date(now.getTime() - DAY_MS);
    const stale = await this.prisma.mediaFile.findMany({ where: { status: 'PENDING', replacesId: { not: null }, createdAt: { lt: cutoff } } });
    await this.deleteObjects(stale);
    if (stale.length) await this.prisma.mediaFile.deleteMany({ where: { id: { in: stale.map((m) => m.id) } } });
    return stale.length;
  }

  // Dipakai refund / pembatalan / purge: tandai DELETED dan hapus semua file-nya.
  async deleteInvitation(invitationId: string) {
    const media = await this.prisma.mediaFile.findMany({ where: { invitationId, status: { not: 'DELETED' } } });
    await this.deleteObjects(media);
    await this.prisma.$transaction([
      this.prisma.mediaFile.updateMany({ where: { invitationId }, data: { status: 'DELETED' } }),
      this.prisma.invitation.update({ where: { id: invitationId }, data: { status: 'DELETED' } }),
    ]);
  }

  private async deleteObjects(media: { storageKey: string; status: string }[]) {
    for (const m of media) {
      if (m.status === 'DELETED') continue;
      try {
        await this.storage.delete(m.storageKey);
      } catch (error) {
        this.logger.error(`Gagal menghapus ${m.storageKey}: ${(error as Error).message}`);
      }
    }
  }
}
