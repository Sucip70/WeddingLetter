import { randomBytes } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MB } from '../config/constants.js';
import type { Prisma } from '../generated/prisma/client.js';
import { LifecycleService } from '../invitations/lifecycle.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import type { PreparedNewOrder } from '../pricing/pricing.service.js';
import type { ExtensionOrderInput, OrderInput } from '../pricing/pricing.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import type { InvitationData, SectionDef } from '../templates/layout.js';

export const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
};

// Id lowercase alfanumerik: aman dipakai langsung sebagai bagian kunci storage.
export const newId = () => randomBytes(12).toString('hex');

export function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

// Ganti clientId (dari browser) di field image/gallery/videos/song dengan id media final.
export function remapMediaRefs(data: InvitationData, sections: SectionDef[], idMap: Map<string, string>): InvitationData {
  const out: InvitationData = {};
  for (const section of sections) {
    const values = data[section.id];
    if (!values) continue;
    const next: Record<string, string | string[]> = { ...values };
    for (const field of section.fields) {
      const v = values[field.key];
      if (v === undefined) continue;
      if (field.type === 'image' || field.type === 'song') next[field.key] = typeof v === 'string' ? (idMap.get(v) ?? v) : v;
      else if (field.type === 'gallery' || field.type === 'videos') next[field.key] = (v as string[]).map((x) => idMap.get(x) ?? x);
    }
    out[section.id] = next;
  }
  return out;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly storage: StorageService,
    private readonly lifecycle: LifecycleService,
  ) {}

  async createNew(userId: string, input: OrderInput) {
    const prepared = await this.pricing.prepareNewOrder(input, { lenient: false });
    const slug = await this.pickSlug(prepared);
    const invitationId = newId();
    const mediaIds = new Map(prepared.media.map((m) => [m.clientId, newId()] as const));

    const order = await this.prisma.$transaction(async (tx) => {
      const couponId = await this.reserveCoupon(tx, prepared.coupon);
      const created = await tx.order.create({
        data: {
          kind: 'NEW',
          userId,
          templateId: prepared.template.id,
          couponId,
          activeWeeks: prepared.weeks,
          subtotal: prepared.quote.templatePrice,
          addOnTotal: prepared.quote.addOnTotal,
          couponDiscount: prepared.discount,
          totalAmount: prepared.total,
          addOns: { create: this.addOnLines(prepared.quote.lines, prepared.addOnRows) },
        },
      });

      const data = remapMediaRefs(prepared.data, prepared.sections, mediaIds);
      await tx.invitation.create({
        data: {
          id: invitationId,
          orderId: created.id,
          templateId: prepared.template.id,
          data,
          features: prepared.features as object,
          layout: { ...prepared.layout, sections: prepared.sections } as object,
          slug,
          status: 'DRAFT',
        },
      });

      for (const m of prepared.media) {
        const id = mediaIds.get(m.clientId)!;
        const key = `${invitationId}/${id}.${EXT_BY_TYPE[m.contentType] ?? 'bin'}`;
        await tx.mediaFile.create({
          data: {
            id,
            invitationId,
            type: m.type,
            storageKey: key,
            url: this.storage.publicUrl(key),
            contentType: m.contentType,
            sizeBytes: m.sizeBytes,
            sizeMb: m.sizeBytes / MB,
            included: m.charge.included,
            rentedWeeks: m.charge.rentedWeeks,
            rentalPrice: m.charge.price,
            status: 'PENDING',
          },
        });
      }
      return created;
    });

    const uploads = await Promise.all(
      prepared.media.map(async (m) => {
        const id = mediaIds.get(m.clientId)!;
        const key = `${invitationId}/${id}.${EXT_BY_TYPE[m.contentType] ?? 'bin'}`;
        const presigned = await this.storage.presignUpload({ key, contentType: m.contentType, sizeBytes: m.sizeBytes });
        return { clientId: m.clientId, mediaId: id, ...presigned };
      }),
    );

    return { order: await this.getMine(userId, order.id), uploads };
  }

  async createExtension(userId: string, invitationId: string, input: ExtensionOrderInput) {
    const prepared = await this.pricing.prepareExtension(invitationId, userId, input);
    const order = await this.prisma.$transaction(async (tx) => {
      const couponId = await this.reserveCoupon(tx, prepared.coupon);
      return tx.order.create({
        data: {
          kind: 'EXTENSION',
          userId,
          templateId: prepared.template.id,
          extendsInvitationId: prepared.invitation.id,
          couponId,
          activeWeeks: prepared.weeks,
          subtotal: 0,
          addOnTotal: prepared.quote.total,
          couponDiscount: prepared.discount,
          totalAmount: prepared.total,
          addOns: { create: this.addOnLines(prepared.quote.lines, prepared.addOnRows) },
        },
      });
    });
    return this.getMine(userId, order.id);
  }

  async listMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { name: true } }, invitation: { select: { id: true, slug: true, status: true } }, extendsInvitation: { select: { id: true, slug: true } } },
      take: 100,
    });
    return orders.map((o) => this.summary(o));
  }

  async getMine(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        template: { select: { name: true } },
        addOns: { include: { addOn: { select: { code: true, name: true } } } },
        coupon: { select: { code: true } },
        invitation: { select: { id: true, slug: true, status: true, mediaFiles: { select: { id: true, type: true, status: true, sizeBytes: true } } } },
        extendsInvitation: { select: { id: true, slug: true } },
      },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return {
      ...this.summary(order),
      coupon: order.coupon?.code ?? null,
      lines: order.addOns.map((l) => ({
        code: l.addOn.code,
        label: l.addOn.name,
        quantity: l.quantity,
        unitPrice: l.priceAtPurchase,
        amount: l.quantity * l.priceAtPurchase,
      })),
      media: order.invitation?.mediaFiles ?? [],
    };
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status !== 'PENDING') throw new ConflictException('Hanya pesanan yang belum dibayar yang bisa dibatalkan');
    await this.closeUnpaid(order.id, 'CANCELLED');
    return this.getMine(userId, orderId);
  }

  // Menutup pesanan yang tidak jadi dibayar: lepas kuota kupon, hapus draft undangan + file yang sudah terunggah.
  async closeUnpaid(orderId: string, status: 'CANCELLED' | 'EXPIRED') {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { invitation: true } });
    if (!order) return;
    const closed = await this.prisma.order.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status } });
    if (closed.count === 0) return;
    if (order.couponId) {
      await this.prisma.$executeRaw`UPDATE "coupons" SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE "id" = ${order.couponId}`;
    }
    if (order.invitation) await this.lifecycle.deleteInvitation(order.invitation.id);
  }

  async expireStale(olderThan: Date) {
    const stale = await this.prisma.order.findMany({ where: { status: 'PENDING', createdAt: { lt: olderThan } }, select: { id: true } });
    for (const o of stale) await this.closeUnpaid(o.id, 'EXPIRED');
    return stale.length;
  }

  private summary(order: {
    id: string;
    kind: string;
    status: string;
    subtotal: number;
    addOnTotal: number;
    couponDiscount: number;
    totalAmount: number;
    activeWeeks: number;
    paymentProvider: string | null;
    paymentUrl: string | null;
    paidAt: Date | null;
    createdAt: Date;
    template: { name: string };
    invitation?: { id: string; slug: string; status: string } | null;
    extendsInvitation?: { id: string; slug: string } | null;
  }) {
    return {
      id: order.id,
      kind: order.kind,
      status: order.status,
      templateName: order.template.name,
      activeWeeks: order.activeWeeks,
      subtotal: order.subtotal,
      addOnTotal: order.addOnTotal,
      couponDiscount: order.couponDiscount,
      totalAmount: order.totalAmount,
      paymentProvider: order.paymentProvider,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      invitation: order.invitation ?? order.extendsInvitation ?? null,
    };
  }

  private addOnLines(lines: { code: string; quantity: number; unitPrice: number }[], rows: PreparedNewOrder['addOnRows']) {
    return lines
      .filter((l) => l.code !== 'TEMPLATE')
      .map((l) => ({ addOnId: rows.get(l.code)!.id, quantity: l.quantity, priceAtPurchase: l.unitPrice }));
  }

  // Mengambil 1 kuota kupon secara atomik (tidak bisa melewati batas walau order paralel).
  private async reserveCoupon(tx: Prisma.TransactionClient, coupon: PreparedNewOrder['coupon']) {
    if (!coupon || !coupon.valid) return null;
    const updated = await tx.$executeRaw`
      UPDATE "coupons" SET "usedCount" = "usedCount" + 1
      WHERE "id" = ${coupon.couponId} AND "status" = 'ACTIVE' AND ("quota" IS NULL OR "usedCount" < "quota")`;
    if (updated === 0) throw new BadRequestException('Kuota kupon sudah habis');
    return coupon.couponId;
  }

  private async pickSlug(prepared: PreparedNewOrder) {
    if (prepared.customSlug) {
      const taken = await this.prisma.invitation.findUnique({ where: { slug: prepared.customSlug }, select: { id: true } });
      if (taken) throw new ConflictException('Link custom sudah dipakai, pilih yang lain');
      return prepared.customSlug;
    }
    const names = prepared.data['mempelai'] ?? {};
    const text = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
    const base = slugify(`${text(names['pria_nama'])}-${text(names['wanita_nama'])}`) || 'undangan';
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = `${base}-${randomBytes(3).toString('hex')}`;
      const taken = await this.prisma.invitation.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!taken) return candidate;
    }
    this.logger.error('Gagal menghasilkan slug unik');
    throw new ConflictException('Gagal membuat link undangan, coba lagi');
  }
}
