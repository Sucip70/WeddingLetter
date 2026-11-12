import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';

export const guestInput = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(24).regex(/^[+\d\s()-]*$/).transform((v) => v.replace(/[^\d]/g, '') || null).optional(),
  partySize: z.number().int().min(1).max(50).default(1),
});
export const guestActivity = z.object({ action: z.enum(['copied', 'whatsapp', 'shared', 'unshared']) });
export const guestToken = z.string().regex(/^[a-f0-9]{64}$/);
export const guestLookup = z.object({ token: guestToken });
export const guestCheckin = guestLookup.extend({ count: z.number().int().min(1).max(50) });

@Injectable()
export class GuestListService {
  constructor(private readonly prisma: PrismaService) {}

  private async owned(userId: string, id: string, checkin = false) {
    const inv = await this.prisma.invitation.findFirst({ where: { id, status: { not: 'DELETED' }, order: { userId, status: 'PAID' } } });
    if (!inv) throw new NotFoundException('Undangan berbayar tidak ditemukan');
    if (checkin && (inv.status !== 'ACTIVE' || !inv.expiresAt || inv.expiresAt <= new Date())) throw new ForbiddenException('Check-in hanya tersedia pada undangan aktif');
    return inv;
  }
  async list(userId: string, id: string) {
    await this.owned(userId, id);
    return this.prisma.invitationGuest.findMany({ where: { invitationId: id, deletedAt: null }, orderBy: { createdAt: 'asc' } });
  }
  async create(userId: string, id: string, input: z.infer<typeof guestInput>) {
    await this.owned(userId, id);
    return this.prisma.invitationGuest.create({ data: { invitationId: id, ...input, token: randomBytes(32).toString('hex') } });
  }
  async update(userId: string, id: string, guestId: string, input: z.infer<typeof guestInput>) {
    await this.owned(userId, id);
    const result = await this.prisma.invitationGuest.updateMany({ where: { id: guestId, invitationId: id, deletedAt: null }, data: input });
    if (!result.count) throw new NotFoundException('Tamu tidak ditemukan');
    return { ok: true };
  }
  async remove(userId: string, id: string, guestId: string) {
    await this.owned(userId, id);
    const result = await this.prisma.invitationGuest.updateMany({ where: { id: guestId, invitationId: id, deletedAt: null, checkedInAt: null }, data: { deletedAt: new Date() } });
    if (!result.count) throw new ConflictException('Tamu tidak ditemukan atau sudah check-in');
    return { ok: true };
  }
  async activity(userId: string, id: string, guestId: string, action: z.infer<typeof guestActivity>['action']) {
    await this.owned(userId, id);
    const now = new Date();
    const data = action === 'copied' ? { lastCopiedAt: now } : action === 'whatsapp' ? { lastWhatsappOpenedAt: now } : { sharedAt: action === 'shared' ? now : null };
    const result = await this.prisma.invitationGuest.updateMany({ where: { id: guestId, invitationId: id, deletedAt: null }, data });
    if (!result.count) throw new NotFoundException('Tamu tidak ditemukan');
    return { ok: true };
  }
  async lookup(userId: string, id: string, token: string) {
    await this.owned(userId, id, true);
    const guest = await this.prisma.invitationGuest.findFirst({ where: { token, invitationId: id, deletedAt: null } });
    if (!guest) throw new BadRequestException('QR tidak valid atau berasal dari undangan lain');
    return guest;
  }
  async checkin(userId: string, id: string, input: z.infer<typeof guestCheckin>) {
    await this.owned(userId, id, true);
    // One conditional database update makes retries/concurrent scans idempotent.
    const result = await this.prisma.invitationGuest.updateMany({ where: { token: input.token, invitationId: id, deletedAt: null, checkedInAt: null }, data: { checkedInAt: new Date(), checkedInCount: input.count, checkedInById: userId } });
    const guest = await this.prisma.invitationGuest.findFirst({ where: { token: input.token, invitationId: id, deletedAt: null } });
    if (!guest) throw new BadRequestException('QR tidak valid atau berasal dari undangan lain');
    return { guest, alreadyCheckedIn: result.count === 0 };
  }
  async publicGuest(slug: string, token: string) {
    const guest = await this.prisma.invitationGuest.findFirst({ where: { token, deletedAt: null, invitation: { slug, status: 'ACTIVE', expiresAt: { gt: new Date() }, order: { status: 'PAID' } } }, select: { name: true } });
    if (!guest) throw new NotFoundException('Tiket tamu tidak ditemukan');
    return guest;
  }
}
