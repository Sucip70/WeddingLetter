import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ALLOWED_CONTENT_TYPES, DAY_MS, MB, REFUND_WINDOW_HOURS } from '../config/constants.js';
import type { Prisma } from '../generated/prisma/client.js';
import { LifecycleService } from '../invitations/lifecycle.service.js';
import { EXT_BY_TYPE, newId } from '../orders/orders.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { SECTION_REGISTRY, layoutIncludes, normalizeLayout, toAuthoring } from '../templates/layout.js';
import { BASIC_PALETTES, DESIGNS, GATE_LABEL, GROUP_LABEL, GROUP_ORDER, autoPalettes } from '../templates/themes.js';
import type { z } from 'zod';
import type { assetPresignSchema, couponCreateSchema, couponUpdateSchema, listQuerySchema, templateCreateSchema, templateUpdateSchema } from './admin.dto.js';

type ListQuery = z.infer<typeof listQuerySchema>;

const ORDER_STATUSES = ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED'] as const;
const INVITATION_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED_GRACE', 'DELETED'] as const;

function paged<T>(items: T[], total: number, q: ListQuery) {
  return { items, total, page: q.page, pageSize: q.pageSize };
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycle: LifecycleService,
    private readonly payments: PaymentsService,
    private readonly storage: StorageService,
  ) {}

  // ----- Ringkasan -----

  async stats() {
    const now = new Date();
    const since = new Date(now.getTime() - 30 * DAY_MS);
    const soon = new Date(now.getTime() + 7 * DAY_MS);
    const [paid, paid30, orderGroups, invitationGroups, users, expiringSoon, awaitingPublish] = await Promise.all([
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.order.aggregate({ where: { status: 'PAID', paidAt: { gte: since } }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
      this.prisma.invitation.groupBy({ by: ['status'], _count: true }),
      this.prisma.user.count(),
      this.prisma.invitation.count({ where: { status: 'ACTIVE', expiresAt: { gte: now, lte: soon } } }),
      this.prisma.invitation.count({ where: { status: 'DRAFT', order: { status: 'PAID' } } }),
    ]);
    return {
      revenue: { total: paid._sum.totalAmount ?? 0, orders: paid._count, last30Days: paid30._sum.totalAmount ?? 0, orders30Days: paid30._count },
      orders: Object.fromEntries(orderGroups.map((g) => [g.status, g._count])),
      invitations: Object.fromEntries(invitationGroups.map((g) => [g.status, g._count])),
      users,
      expiringIn7Days: expiringSoon,
      paidAwaitingPublish: awaitingPublish,
    };
  }

  // ----- Template builder -----

  builderMeta() {
    return {
      // palettes = usulan palet pembeli untuk desain itu (rustic memakai 8 warna Basic, lainnya 2 varian otomatis)
      designs: DESIGNS.map((design) => ({ ...design, palettes: design.id === 'rustic' ? BASIC_PALETTES : autoPalettes(design) })),
      groups: GROUP_ORDER.map((id) => ({ id, label: GROUP_LABEL[id] })),
      gates: Object.entries(GATE_LABEL).map(([id, label]) => ({ id, label })),
      sections: Object.entries(SECTION_REGISTRY).map(([id, def]) => ({ id, title: def.title, fields: def.fields })),
    };
  }

  async listTemplates() {
    const rows = await this.prisma.template.findMany({ orderBy: [{ price: 'asc' }, { createdAt: 'asc' }], include: { _count: { select: { orders: true } } } });
    return rows.map(({ layoutSchema, _count, ...t }) => {
      const layout = normalizeLayout(layoutSchema, t.category);
      return { ...t, orders: _count.orders, sections: layout.sections.map((s) => s.id), theme: layout.theme };
    });
  }

  async getTemplate(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
    if (!t) throw new NotFoundException('Template tidak ditemukan');
    const { layoutSchema, _count, ...rest } = t;
    return { ...rest, orders: _count.orders, layout: toAuthoring(layoutSchema, t.category) };
  }

  private assertPublishable(layoutSchema: unknown, category: string) {
    const layout = normalizeLayout(layoutSchema, category);
    if (!layoutIncludes(layout, 'mempelai') || !layoutIncludes(layout, 'tanggal_lokasi')) {
      throw new BadRequestException('Template yang dipublikasikan harus memuat section Mempelai dan Tanggal & lokasi');
    }
  }

  async createTemplate(input: z.infer<typeof templateCreateSchema>) {
    if (input.status === 'PUBLISHED') this.assertPublishable(input.layoutSchema, input.category);
    const created = await this.prisma.template.create({ data: { ...input, layoutSchema: input.layoutSchema as object } });
    return this.getTemplate(created.id);
  }

  async updateTemplate(id: string, input: z.infer<typeof templateUpdateSchema>) {
    const current = await this.prisma.template.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Template tidak ditemukan');
    const status = input.status ?? current.status;
    const layout = input.layoutSchema ?? current.layoutSchema;
    if (status === 'PUBLISHED') this.assertPublishable(layout, input.category ?? current.category);
    await this.prisma.template.update({ where: { id }, data: { ...input, ...(input.layoutSchema ? { layoutSchema: input.layoutSchema as object } : {}) } });
    return this.getTemplate(id);
  }

  async deleteTemplate(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
    if (!t) throw new NotFoundException('Template tidak ditemukan');
    if (t._count.orders > 0) throw new ConflictException('Template sudah pernah dipesan: arsipkan saja, jangan dihapus');
    await this.prisma.template.delete({ where: { id } });
    return { ok: true };
  }

  // URL upload untuk aset template (thumbnail, lagu bawaan). Admin tepercaya: tidak perlu konfirmasi.
  async presignAsset(input: z.infer<typeof assetPresignSchema>) {
    const allowed = input.kind === 'image' ? ALLOWED_CONTENT_TYPES.PHOTO : ALLOWED_CONTENT_TYPES.SONG;
    if (!allowed.includes(input.contentType)) throw new BadRequestException('Tipe file tidak didukung');
    // Lagu pustaka (rekaman klasik utuh) bisa lebih besar dari lagu unggahan pembeli.
    if (input.sizeBytes > (input.kind === 'image' ? 5 : 25) * MB) throw new BadRequestException(`File terlalu besar (maks. ${input.kind === 'image' ? 5 : 25} MB)`);
    const key = `assets/${newId()}.${EXT_BY_TYPE[input.contentType] ?? 'bin'}`;
    const presigned = await this.storage.presignUpload({ key, contentType: input.contentType, sizeBytes: input.sizeBytes });
    return { ...presigned, key, publicUrl: this.storage.publicUrl(key) };
  }

  // ----- Harga per komponen -----

  listAddOns() {
    return this.prisma.addOn.findMany({ orderBy: { code: 'asc' } });
  }

  async updateAddOn(id: string, input: { name?: string; price?: number }) {
    const row = await this.prisma.addOn.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Add-on tidak ditemukan');
    return this.prisma.addOn.update({ where: { id }, data: input });
  }

  // ----- Kupon -----

  listCoupons() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createCoupon(input: z.infer<typeof couponCreateSchema>) {
    if (await this.prisma.coupon.findUnique({ where: { code: input.code } })) throw new ConflictException('Kode kupon sudah ada');
    return this.prisma.coupon.create({ data: input });
  }

  async updateCoupon(id: string, input: z.infer<typeof couponUpdateSchema>) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Kupon tidak ditemukan');
    const type = input.type ?? coupon.type;
    const value = input.value ?? coupon.value;
    if (type === 'PERCENT' && value > 100) throw new BadRequestException('Persentase maksimal 100');
    return this.prisma.coupon.update({ where: { id }, data: input });
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Kupon tidak ditemukan');
    if (coupon.usedCount > 0) throw new ConflictException('Kupon sudah pernah dipakai: nonaktifkan saja');
    await this.prisma.coupon.delete({ where: { id } });
    return { ok: true };
  }

  // ----- Pesanan -----

  async listOrders(q: ListQuery) {
    const where: Prisma.OrderWhereInput = {
      ...(q.status && (ORDER_STATUSES as readonly string[]).includes(q.status) ? { status: q.status as (typeof ORDER_STATUSES)[number] } : {}),
      ...(q.q
        ? {
            OR: [
              { id: { contains: q.q } },
              { user: { email: { contains: q.q, mode: 'insensitive' } } },
              { user: { name: { contains: q.q, mode: 'insensitive' } } },
              { invitation: { slug: { contains: q.q.toLowerCase() } } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { user: { select: { id: true, name: true, email: true } }, template: { select: { name: true } }, invitation: { select: { id: true, slug: true, status: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paged(
      rows.map((o) => ({
        id: o.id,
        kind: o.kind,
        status: o.status,
        totalAmount: o.totalAmount,
        couponDiscount: o.couponDiscount,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        paymentProvider: o.paymentProvider,
        user: o.user,
        templateName: o.template.name,
        invitation: o.invitation,
      })),
      total,
      q,
    );
  }

  async getOrder(id: string) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        template: { select: { name: true } },
        coupon: { select: { code: true } },
        addOns: { include: { addOn: { select: { code: true, name: true } } } },
        invitation: { select: { id: true, slug: true, status: true, publishedAt: true } },
        extendsInvitation: { select: { id: true, slug: true } },
      },
    });
    if (!o) throw new NotFoundException('Pesanan tidak ditemukan');
    const { addOns, template, coupon, ...rest } = o;
    return {
      ...rest,
      templateName: template.name,
      coupon: coupon?.code ?? null,
      lines: addOns.map((l) => ({ code: l.addOn.code, label: l.addOn.name, quantity: l.quantity, unitPrice: l.priceAtPurchase, amount: l.quantity * l.priceAtPurchase })),
    };
  }

  async markOrderPaid(id: string, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { invitation: { include: { mediaFiles: true } } } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status !== 'PENDING') throw new ConflictException(`Pesanan berstatus ${order.status}`);
    await this.payments.markPaid(id, { provider: 'MANUAL', ref: note ?? 'ditandai admin' });
    return this.getOrder(id);
  }

  // Refund pesanan template baru: undangan dihapus. Pengembalian uangnya dilakukan manual di dashboard
  // payment gateway. Kebijakan: hanya sebelum publish & dalam jendela waktu, kecuali `force`.
  async refundOrder(id: string, force: boolean) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { invitation: true } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status !== 'PAID') throw new ConflictException('Hanya pesanan lunas yang bisa direfund');
    if (order.kind !== 'NEW') throw new ConflictException('Perpanjangan tidak bisa direfund otomatis, tangani manual');
    if (!force) {
      if (order.invitation?.publishedAt) throw new ConflictException('Undangan sudah dipublikasikan: refund penuh hanya sebelum publish (gunakan pengecualian jika perlu)');
      if (order.paidAt && Date.now() - order.paidAt.getTime() > REFUND_WINDOW_HOURS * 3600 * 1000) {
        throw new ConflictException(`Lewat ${REFUND_WINDOW_HOURS} jam sejak dibayar (gunakan pengecualian jika perlu)`);
      }
    }
    await this.prisma.order.update({ where: { id }, data: { status: 'REFUNDED' } });
    if (order.invitation) await this.lifecycle.deleteInvitation(order.invitation.id);
    return this.getOrder(id);
  }

  // ----- Undangan -----

  async listInvitations(q: ListQuery) {
    const where: Prisma.InvitationWhereInput = {
      ...(q.status && (INVITATION_STATUSES as readonly string[]).includes(q.status) ? { status: q.status as (typeof INVITATION_STATUSES)[number] } : { status: { not: 'DELETED' } }),
      ...(q.q
        ? {
            OR: [
              { slug: { contains: q.q.toLowerCase() } },
              { order: { user: { email: { contains: q.q, mode: 'insensitive' } } } },
              { order: { user: { name: { contains: q.q, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          template: { select: { name: true } },
          order: { select: { id: true, status: true, user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { guests: true } },
        },
      }),
      this.prisma.invitation.count({ where }),
    ]);
    return paged(
      rows.map((i) => ({
        id: i.id,
        slug: i.slug,
        status: i.status,
        templateName: i.template.name,
        user: i.order.user,
        orderId: i.order.id,
        orderStatus: i.order.status,
        publishedAt: i.publishedAt,
        expiresAt: i.expiresAt,
        remainingDays: i.remainingDays,
        viewCount: i.viewCount,
        rsvpCount: i._count.guests,
        createdAt: i.createdAt,
      })),
      total,
      q,
    );
  }

  async getInvitation(id: string) {
    const i = await this.prisma.invitation.findUnique({
      where: { id },
      include: {
        template: { select: { name: true } },
        order: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        mediaFiles: { orderBy: { createdAt: 'asc' } },
        _count: { select: { guests: true } },
      },
    });
    if (!i) throw new NotFoundException('Undangan tidak ditemukan');
    const { mediaFiles, order, template, _count, layout: _layout, ...rest } = i;
    return {
      ...rest,
      templateName: template.name,
      user: order.user,
      order: { id: order.id, status: order.status, totalAmount: order.totalAmount, activeWeeks: order.activeWeeks, paidAt: order.paidAt },
      rsvpCount: _count.guests,
      media: mediaFiles.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        status: m.status,
        sizeBytes: m.sizeBytes,
        included: m.included,
        rentedWeeks: m.rentedWeeks,
        rentalPrice: m.rentalPrice,
        expiresAt: m.expiresAt,
        remainingDays: m.remainingDays,
      })),
    };
  }

  async pauseInvitation(id: string) {
    await this.lifecycle.pause(id);
    return this.getInvitation(id);
  }

  async resumeInvitation(id: string, extraDays: number) {
    await this.lifecycle.resume(id, extraDays);
    return this.getInvitation(id);
  }

  async extendInvitation(id: string, weeks: number) {
    await this.lifecycle.extend(id, weeks);
    return this.getInvitation(id);
  }

  // Mengatur tanggal berakhir secara eksplisit (undangan aktif). Media "termasuk" ikut disamakan.
  async setExpiry(id: string, expiresAt: Date) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    if (inv.status !== 'ACTIVE') throw new ConflictException('Tanggal berakhir hanya bisa diatur untuk undangan aktif (untuk yang dijeda/berakhir gunakan lanjutkan/perpanjang)');
    await this.prisma.$transaction([
      this.prisma.mediaFile.updateMany({ where: { invitationId: id, status: 'ACTIVE', included: true }, data: { expiresAt } }),
      this.prisma.invitation.update({ where: { id }, data: { expiresAt, reminderSentAt: null } }),
    ]);
    return this.getInvitation(id);
  }

  async deleteInvitation(id: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { id } });
    if (!inv || inv.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    await this.lifecycle.deleteInvitation(id);
    return { ok: true };
  }

  // ----- Pengguna -----

  async listUsers(q: ListQuery) {
    const where: Prisma.UserWhereInput = q.q ? { OR: [{ email: { contains: q.q, mode: 'insensitive' } }, { name: { contains: q.q, mode: 'insensitive' } }] } : {};
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, _count: { select: { orders: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paged(rows.map(({ _count, ...u }) => ({ ...u, orders: _count.orders })), total, q);
  }

  async setUserRole(actorId: string, id: string, role: 'USER' | 'ADMIN') {
    if (actorId === id) throw new BadRequestException('Tidak bisa mengubah peran akun sendiri');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    return this.prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true } });
  }
}
