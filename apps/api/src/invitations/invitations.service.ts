import { BadRequestException, ConflictException, ForbiddenException, GoneException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { REFUND_WINDOW_HOURS } from '../config/constants.js';
import type { Invitation, MediaFile } from '../generated/prisma/client.js';
import { PricingService } from '../pricing/pricing.service.js';
import type { ExtensionOrderInput } from '../pricing/pricing.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { validateInvitationData } from '../templates/layout.js';
import type { InvitationFeatures, SectionDef, TemplateLayout } from '../templates/layout.js';
import { LifecycleService } from './lifecycle.service.js';

export const rsvpSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(80),
  attending: z.boolean(),
  guestCount: z.number().int().min(1).max(10).default(1),
  message: z.string().trim().max(500).optional(),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;

// Snapshot skema yang disimpan di undangan (tema, section efektif, kuota, lagu bawaan).
type LayoutSnapshot = TemplateLayout;

const RSVP_LIMIT = 10; // per IP per undangan per jam
const rsvpHits = new Map<string, number[]>();

export interface InvitationView {
  id: string;
  slug: string;
  status: string;
  templateName: string;
  layout: { theme: TemplateLayout['theme']; sections: SectionDef[]; musik: { presets: { name: string; url: string }[] } };
  features: InvitationFeatures;
  data: Invitation['data'];
  media: Record<string, { url: string; type: string }>;
  rsvpEnabled: boolean;
  guestbook: { name: string; message: string; attending: boolean | null; createdAt: Date }[];
}

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: LifecycleService,
    private readonly pricing: PricingService,
    private readonly storage: StorageService,
  ) {}

  private snapshot(inv: { layout: unknown }): LayoutSnapshot {
    return inv.layout as LayoutSnapshot;
  }

  private async owned(userId: string, id: string) {
    const inv = await this.prisma.invitation.findFirst({
      where: { id, order: { userId } },
      include: { order: true, template: { select: { name: true, category: true } }, mediaFiles: true },
    });
    if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    return inv;
  }

  async listMine(userId: string) {
    const rows = await this.prisma.invitation.findMany({
      where: { order: { userId }, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, status: true } }, template: { select: { name: true } }, _count: { select: { guests: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      status: r.status,
      templateName: r.template.name,
      orderId: r.order.id,
      orderStatus: r.order.status,
      publishedAt: r.publishedAt,
      expiresAt: r.expiresAt,
      remainingDays: r.remainingDays,
      viewCount: r.viewCount,
      rsvpCount: r._count.guests,
      createdAt: r.createdAt,
    }));
  }

  async getMine(userId: string, id: string) {
    const inv = await this.owned(userId, id);
    const now = Date.now();
    const layout = this.snapshot(inv);
    return {
      id: inv.id,
      slug: inv.slug,
      status: inv.status,
      templateName: inv.template.name,
      data: inv.data,
      features: inv.features as InvitationFeatures,
      layout: { theme: layout.theme, sections: layout.sections, galeri: layout.galeri, musik: layout.musik },
      publishedAt: inv.publishedAt,
      expiresAt: inv.expiresAt,
      pausedAt: inv.pausedAt,
      remainingDays: inv.remainingDays,
      viewCount: inv.viewCount,
      order: { id: inv.order.id, status: inv.order.status, paidAt: inv.order.paidAt, activeWeeks: inv.order.activeWeeks, totalAmount: inv.order.totalAmount },
      // Refund penuh: hanya sebelum publish & dalam jendela waktu (ditangani admin/CS).
      refundEligible:
        inv.order.status === 'PAID' && !inv.publishedAt && !!inv.order.paidAt && now - inv.order.paidAt.getTime() <= REFUND_WINDOW_HOURS * 3600 * 1000,
      media: inv.mediaFiles
        .filter((m) => m.status !== 'DELETED')
        .map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          status: m.status,
          sizeBytes: m.sizeBytes,
          included: m.included,
          rentedWeeks: m.rentedWeeks,
          expiresAt: m.expiresAt,
          remainingDays: m.remainingDays,
        })),
    };
  }

  // Mengubah isi undangan yang sudah dibayar. Set file media tidak berubah (harga sudah dihitung dari
  // file yang diunggah); user boleh menata ulang pemakaian file yang sudah ada.
  async updateData(userId: string, id: string, rawData: unknown) {
    const inv = await this.owned(userId, id);
    if (inv.order.status !== 'PAID') throw new ConflictException('Undangan baru bisa diedit setelah pembayaran selesai');
    if (!['DRAFT', 'ACTIVE', 'PAUSED'].includes(inv.status)) throw new ConflictException('Undangan yang sudah berakhir tidak bisa diedit, perpanjang dulu');

    const layout = this.snapshot(inv);
    const validated = validateInvitationData(layout.sections, layout, rawData);
    const media = new Map(inv.mediaFiles.filter((m) => m.status !== 'DELETED').map((m) => [m.id, m]));
    const refs = validated.mediaRefs;
    const check = (ids: string[], type: MediaFile['type']) => {
      for (const ref of ids) {
        const m = media.get(ref);
        if (!m || m.type !== type) throw new BadRequestException('Undangan merujuk file yang tidak dikenal');
      }
    };
    check(refs.photos, 'PHOTO');
    check(refs.videos, 'VIDEO');
    check(refs.songs, 'SONG');
    const all = [...refs.photos, ...refs.videos, ...refs.songs];
    if (new Set(all).size !== all.length) throw new BadRequestException('Satu file hanya boleh dipakai di satu tempat');

    await this.prisma.invitation.update({ where: { id: inv.id }, data: { data: validated.data as object } });
    return this.getMine(userId, id);
  }

  async publish(userId: string, id: string) {
    await this.owned(userId, id);
    await this.lifecycle.publish(id);
    return this.getMine(userId, id);
  }

  async guests(userId: string, id: string) {
    await this.owned(userId, id);
    const guests = await this.prisma.rsvpGuest.findMany({ where: { invitationId: id }, orderBy: { createdAt: 'desc' } });
    const attending = guests.filter((g) => g.attending === true);
    return {
      total: guests.length,
      attendingCount: attending.length,
      attendingPeople: attending.reduce((sum, g) => sum + g.guestCount, 0),
      declinedCount: guests.filter((g) => g.attending === false).length,
      guests,
    };
  }

  async extensionQuote(userId: string, id: string, input: ExtensionOrderInput) {
    const prepared = await this.pricing.prepareExtension(id, userId, input);
    return { weeks: prepared.weeks, lines: prepared.quote.lines, subtotal: prepared.quote.total, discount: prepared.discount, total: prepared.total, coupon: prepared.coupon };
  }

  // Tampilan untuk pemilik (pratinjau) — tanpa pembatasan status, kecuali file yang belum terunggah.
  async previewView(userId: string, id: string): Promise<InvitationView> {
    const inv = await this.owned(userId, id);
    return this.buildView(inv, inv.mediaFiles.filter((m) => ['UPLOADED', 'ACTIVE', 'PAUSED', 'EXPIRED_GRACE'].includes(m.status)));
  }

  // ----- Publik -----

  async publicView(slug: string): Promise<InvitationView> {
    const inv = await this.prisma.invitation.findUnique({
      where: { slug },
      include: { template: { select: { name: true } }, mediaFiles: true },
    });
    if (!inv || inv.status === 'DRAFT' || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    if (inv.status !== 'ACTIVE') throw new GoneException({ statusCode: 410, message: 'Undangan ini sedang tidak aktif', status: inv.status });

    void this.prisma.invitation.update({ where: { id: inv.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
    return this.buildView(inv, inv.mediaFiles.filter((m) => m.status === 'ACTIVE'));
  }

  async submitRsvp(slug: string, input: RsvpInput, ip: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { slug }, select: { id: true, status: true, layout: true } });
    if (!inv || inv.status !== 'ACTIVE') throw new NotFoundException('Undangan tidak ditemukan');
    if (!this.snapshot(inv).sections.some((s) => s.id === 'rsvp')) throw new ForbiddenException('RSVP tidak aktif untuk undangan ini');

    const key = `${ip}:${slug}`;
    const now = Date.now();
    const recent = (rsvpHits.get(key) ?? []).filter((t) => now - t < 3600_000);
    if (recent.length >= RSVP_LIMIT) throw new HttpException('Terlalu banyak pengiriman, coba lagi nanti', HttpStatus.TOO_MANY_REQUESTS);
    rsvpHits.set(key, [...recent, now]);

    await this.prisma.rsvpGuest.create({
      data: {
        invitationId: inv.id,
        name: input.name,
        attending: input.attending,
        guestCount: input.attending ? input.guestCount : 0,
        message: input.message || null,
      },
    });
    return { ok: true };
  }

  private async buildView(
    inv: Invitation & { template: { name: string } },
    media: MediaFile[],
  ): Promise<InvitationView> {
    const layout = this.snapshot(inv);
    const hasGuestbook = layout.sections.some((s) => s.id === 'buku_tamu');
    const guests = hasGuestbook
      ? await this.prisma.rsvpGuest.findMany({
          where: { invitationId: inv.id, message: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { name: true, message: true, attending: true, createdAt: true },
        })
      : [];
    return {
      id: inv.id,
      slug: inv.slug,
      status: inv.status,
      templateName: inv.template.name,
      layout: { theme: layout.theme, sections: layout.sections, musik: { presets: layout.musik?.presets ?? [] } },
      features: inv.features as InvitationFeatures,
      data: inv.data,
      media: Object.fromEntries(media.map((m) => [m.id, { url: this.storage.publicUrl(m.storageKey), type: m.type }])),
      rsvpEnabled: layout.sections.some((s) => s.id === 'rsvp'),
      guestbook: guests.map((g) => ({ ...g, message: g.message ?? '' })),
    };
  }
}
