import { createHash, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LifecycleService } from '../invitations/lifecycle.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DevProvider } from './dev.provider.js';
import { MidtransProvider } from './midtrans.provider.js';
import type { PaymentProvider } from './payment.provider.js';

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  transaction_id?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly lifecycle: LifecycleService,
    private readonly notifications: NotificationsService,
  ) {}

  get devMode() {
    return !process.env.MIDTRANS_SERVER_KEY && process.env.NODE_ENV !== 'production';
  }

  private provider(): PaymentProvider {
    const key = process.env.MIDTRANS_SERVER_KEY;
    if (key) return new MidtransProvider(key);
    if (this.devMode) return new DevProvider();
    throw new ServiceUnavailableException('Pembayaran belum dikonfigurasi');
  }

  // Memulai (atau melanjutkan) pembayaran pesanan milik user. Idempotent: pesanan yang sudah punya
  // link bayar mengembalikan link yang sama.
  async start(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true, template: true, addOns: { include: { addOn: true } }, invitation: { include: { mediaFiles: true } } },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status === 'PAID') return { status: 'PAID' as const };
    if (order.status !== 'PENDING') throw new ConflictException(`Pesanan berstatus ${order.status}, tidak bisa dibayar`);
    if (order.kind === 'NEW' && order.invitation?.mediaFiles.some((m) => m.status === 'PENDING')) {
      throw new ConflictException('Unggah semua file terlebih dahulu sebelum membayar');
    }

    if (order.totalAmount <= 0) {
      await this.markPaid(order.id, { provider: 'FREE' });
      return { status: 'PAID' as const };
    }
    if (order.paymentUrl) return { status: 'PENDING' as const, provider: order.paymentProvider, redirectUrl: order.paymentUrl };

    const items = [
      ...(order.subtotal > 0 ? [{ id: 'TEMPLATE', name: `Template ${order.template.name}`, price: order.subtotal, quantity: 1 }] : []),
      ...order.addOns.map((l) => ({ id: l.addOn.code, name: l.addOn.name, price: l.priceAtPurchase, quantity: l.quantity })),
      ...(order.couponDiscount > 0 ? [{ id: 'DISCOUNT', name: 'Diskon kupon', price: -order.couponDiscount, quantity: 1 }] : []),
    ];
    const web = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
    const init = await this.provider().createPayment({
      orderId: order.id,
      amount: order.totalAmount,
      customer: { name: order.user.name, email: order.user.email },
      items,
      finishUrl: `${web}/checkout/${order.id}`,
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentProvider: init.provider, paymentToken: init.token ?? null, paymentUrl: init.redirectUrl },
    });
    return { status: 'PENDING' as const, provider: init.provider, redirectUrl: init.redirectUrl };
  }

  // Menandai lunas. Atomik & idempotent (notifikasi berulang dari gateway aman).
  async markPaid(orderId: string, info: { provider: string; ref?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true, invitation: { select: { id: true } } } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status === 'PAID') return { alreadyPaid: true };
    if (order.status !== 'PENDING') {
      // Uang masuk untuk pesanan yang sudah ditutup (jendela sempit antara kedaluwarsa & bayar): butuh tindakan manual.
      this.logger.error(`PEMBAYARAN DITERIMA UNTUK PESANAN ${order.status}: ${order.id} (${info.provider} ${info.ref ?? '-'}) — periksa & refund manual`);
      return { alreadyPaid: false, closed: true };
    }

    const paid = await this.prisma.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date(), paymentProvider: info.provider, paymentRef: info.ref ?? null },
      });
      if (res.count === 0) return false;
      if (order.kind === 'EXTENSION' && order.extendsInvitationId) {
        await this.lifecycle.extend(order.extendsInvitationId, order.activeWeeks, tx);
      }
      return true;
    });
    if (paid) {
      await this.notifications.paymentReceived(order.user, order.id, order.totalAmount, order.invitation?.id ?? order.extendsInvitationId ?? undefined);
    }
    return { alreadyPaid: !paid };
  }

  // Webhook Midtrans. Signature = SHA512(order_id + status_code + gross_amount + serverKey).
  async handleMidtrans(body: MidtransNotification) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new ServiceUnavailableException('Midtrans belum dikonfigurasi');
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, transaction_id } = body;
    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) throw new BadRequestException('Payload tidak lengkap');

    const expected = createHash('sha512').update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest();
    const actual = Buffer.from(signature_key, 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new ForbiddenException('Signature tidak valid');

    const order = await this.prisma.order.findUnique({ where: { id: order_id } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (Number(gross_amount) !== order.totalAmount) {
      this.logger.error(`Nominal tidak cocok untuk ${order_id}: gateway=${gross_amount} order=${order.totalAmount}`);
      throw new BadRequestException('Nominal tidak cocok');
    }

    const settled = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');
    if (settled) {
      await this.markPaid(order_id, { provider: 'MIDTRANS', ref: transaction_id });
    } else if (transaction_status === 'expire') {
      await this.orders.closeUnpaid(order_id, 'EXPIRED');
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'failure') {
      await this.orders.closeUnpaid(order_id, 'CANCELLED');
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      this.logger.warn(`Refund tercatat di Midtrans untuk ${order_id}: proses lewat panel admin`);
    }
    return { ok: true };
  }

  // Simulasi bayar (development saja). Sama persis dengan jalur lunas sungguhan.
  async devConfirm(userId: string, orderId: string) {
    if (!this.devMode) throw new NotFoundException();
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    await this.markPaid(orderId, { provider: 'DEV', ref: 'dev-simulasi' });
    return { status: 'PAID' as const };
  }
}
