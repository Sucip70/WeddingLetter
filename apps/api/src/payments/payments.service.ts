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
import { PrismaService } from '../prisma/prisma.service.js';
import { DevProvider } from './dev.provider.js';
import { MidtransProvider } from './midtrans.provider.js';
import type { MidtransStatus } from './midtrans.provider.js';
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

type PayableOrder = {
  id: string;
  totalAmount: number;
  subtotal: number;
  couponDiscount: number;
  user: { name: string; email: string };
  template: { name: string };
  addOns: { priceAtPurchase: number; quantity: number; addOn: { code: string; name: string } }[];
};

const ACTIVE_ATTEMPT_STATUSES = ['CREATING', 'PENDING'] as const;
const MAX_PAYMENT_ATTEMPTS_PER_HOUR = 5;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
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
    const active = await this.activeAttempt(order.id);
    if (active?.status === 'PENDING' && active.redirectUrl) {
      return { status: 'PENDING' as const, provider: active.provider, redirectUrl: active.redirectUrl };
    }
    if (active?.status === 'CREATING') throw new ConflictException('Pembayaran sedang dibuat, coba lagi sebentar');

    // Kompatibilitas singkat bila aplikasi diperbarui sebelum migrasi backfill selesai.
    if (order.paymentUrl) return { status: 'PENDING' as const, provider: order.paymentProvider, redirectUrl: order.paymentUrl };
    return this.createAttempt(order);
  }

  async changeMethod(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true, template: true, addOns: { include: { addOn: true } }, invitation: { include: { mediaFiles: true } } },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status === 'PAID') return { status: 'PAID' as const };
    if (order.status !== 'PENDING') throw new ConflictException(`Pesanan berstatus ${order.status}, metode pembayaran tidak bisa diganti`);
    if (order.kind === 'NEW' && order.invitation?.mediaFiles.some((m) => m.status === 'PENDING')) {
      throw new ConflictException('Unggah semua file terlebih dahulu sebelum mengganti pembayaran');
    }

    const recentAttempts = await this.prisma.paymentAttempt.count({
      where: { orderId, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recentAttempts >= MAX_PAYMENT_ATTEMPTS_PER_HOUR) {
      throw new ConflictException('Terlalu banyak pergantian pembayaran. Coba lagi satu jam lagi');
    }

    const active = await this.activeAttempt(order.id);
    if (active?.status === 'CREATING') throw new ConflictException('Pembayaran sedang dibuat, coba lagi sebentar');
    if (active?.status === 'PENDING') {
      if (active.provider === 'MIDTRANS') {
        const midtrans = this.midtrans();
        const status = await midtrans.getStatus(active.providerOrderId);
        if (!status) {
          // Belum ada kanal yang dikonfirmasi di Snap. Meminta token baru dengan order_id
          // yang sama membatalkan token lama tanpa membuka dua kode pembayaran aktif.
          return this.replaceUnstartedAttempt(order, active.id, active.providerOrderId);
        }
        await this.applyMidtransStatus(active.providerOrderId, status);
        const refreshed = await this.prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
        if (refreshed?.status === 'PAID') return { status: 'PAID' as const };
        if (status.transaction_status === 'pending' || (status.transaction_status === 'capture' && status.fraud_status !== 'accept')) {
          const cancelled = await midtrans.cancelPayment(active.providerOrderId);
          if (!cancelled) {
            const latest = await midtrans.getStatus(active.providerOrderId);
            if (latest) await this.applyMidtransStatus(active.providerOrderId, latest);
            const afterRace = await this.prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
            if (afterRace?.status === 'PAID') return { status: 'PAID' as const };
            throw new ConflictException('Status pembayaran berubah. Muat ulang lalu coba kembali');
          }
          await this.prisma.paymentAttempt.update({
            where: { id: active.id },
            data: { status: 'CANCELLED', cancelledAt: new Date() },
          });
        }
      } else {
        await this.provider().cancelPayment(active.providerOrderId);
        await this.prisma.paymentAttempt.update({
          where: { id: active.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
      }
    }

    await this.prisma.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { paymentProvider: null, paymentToken: null, paymentUrl: null },
    });
    return this.createAttempt(order);
  }

  private midtrans() {
    const key = process.env.MIDTRANS_SERVER_KEY;
    if (!key) throw new ServiceUnavailableException('Midtrans belum dikonfigurasi');
    return new MidtransProvider(key);
  }

  private activeAttempt(orderId: string) {
    return this.prisma.paymentAttempt.findFirst({
      where: { orderId, status: { in: [...ACTIVE_ATTEMPT_STATUSES] } },
      orderBy: { sequence: 'desc' },
    });
  }

  private paymentRequest(order: PayableOrder, providerOrderId: string) {
    const items = [
      ...(order.subtotal > 0 ? [{ id: 'TEMPLATE', name: `Template ${order.template.name}`, price: order.subtotal, quantity: 1 }] : []),
      ...order.addOns.map((line) => ({ id: line.addOn.code, name: line.addOn.name, price: line.priceAtPurchase, quantity: line.quantity })),
      ...(order.couponDiscount > 0 ? [{ id: 'DISCOUNT', name: 'Diskon kupon', price: -order.couponDiscount, quantity: 1 }] : []),
    ];
    const web = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
    return {
      orderId: providerOrderId,
      amount: order.totalAmount,
      customer: { name: order.user.name, email: order.user.email },
      items,
      finishUrl: `${web}/checkout/${order.id}`,
    };
  }

  private async createAttempt(order: PayableOrder) {
    const latest = await this.prisma.paymentAttempt.aggregate({ where: { orderId: order.id }, _max: { sequence: true } });
    const sequence = (latest._max.sequence ?? 0) + 1;
    const providerOrderId = `${order.id}-p${sequence}`;
    const expectedProvider = this.devMode ? 'DEV' : 'MIDTRANS';
    let attempt;
    try {
      attempt = await this.prisma.paymentAttempt.create({
        data: { orderId: order.id, sequence, provider: expectedProvider, providerOrderId, status: 'CREATING' },
      });
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error;
      const active = await this.activeAttempt(order.id);
      if (active?.status === 'PENDING' && active.redirectUrl) {
        return { status: 'PENDING' as const, provider: active.provider, redirectUrl: active.redirectUrl };
      }
      throw new ConflictException('Pembayaran sedang dibuat, coba lagi sebentar');
    }

    try {
      const init = await this.provider().createPayment(this.paymentRequest(order, providerOrderId));
      await this.prisma.$transaction([
        this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: { provider: init.provider, token: init.token ?? null, redirectUrl: init.redirectUrl, status: 'PENDING' },
        }),
        this.prisma.order.update({
          where: { id: order.id },
          data: { paymentProvider: init.provider, paymentToken: init.token ?? null, paymentUrl: init.redirectUrl },
        }),
      ]);
      return { status: 'PENDING' as const, provider: init.provider, redirectUrl: init.redirectUrl };
    } catch (error) {
      await this.prisma.paymentAttempt.updateMany({ where: { id: attempt.id, status: 'CREATING' }, data: { status: 'FAILED' } });
      throw error;
    }
  }

  private async replaceUnstartedAttempt(order: PayableOrder, attemptId: string, providerOrderId: string) {
    const init = await this.provider().createPayment(this.paymentRequest(order, providerOrderId));
    await this.prisma.$transaction([
      this.prisma.paymentAttempt.update({
        where: { id: attemptId },
        data: { provider: init.provider, token: init.token ?? null, redirectUrl: init.redirectUrl, status: 'PENDING' },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { paymentProvider: init.provider, paymentToken: init.token ?? null, paymentUrl: init.redirectUrl },
      }),
    ]);
    return { status: 'PENDING' as const, provider: init.provider, redirectUrl: init.redirectUrl };
  }

  // Menandai lunas. Atomik & idempotent (notifikasi berulang dari gateway aman).
  async markPaid(orderId: string, info: { provider: string; ref?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { user: true, invitation: { select: { id: true } } } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status === 'PAID') {
      if (info.ref && order.paymentRef && info.ref !== order.paymentRef) {
        this.logger.error(`PEMBAYARAN GANDA untuk ${order.id}: pertama=${order.paymentRef}, kedua=${info.ref} — periksa & refund manual`);
      }
      return { alreadyPaid: true };
    }
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

  private async cancelOtherActiveAttempts(orderId: string, winningAttemptId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, template: true, addOns: { include: { addOn: true } } },
    });
    if (!order) return;
    const attempts = await this.prisma.paymentAttempt.findMany({
      where: { orderId, status: { in: [...ACTIVE_ATTEMPT_STATUSES] }, ...(winningAttemptId ? { id: { not: winningAttemptId } } : {}) },
    });
    for (const attempt of attempts) {
      try {
        if (attempt.provider === 'MIDTRANS') {
          const midtrans = this.midtrans();
          const status = await midtrans.getStatus(attempt.providerOrderId);
          const settled = status?.transaction_status === 'settlement' || (status?.transaction_status === 'capture' && status.fraud_status === 'accept');
          if (settled) {
            await this.prisma.paymentAttempt.update({
              where: { id: attempt.id },
              data: { status: 'PAID', providerRef: status.transaction_id ?? null, paidAt: new Date() },
            });
            this.logger.error(`PAYMENT ATTEMPT GANDA sudah lunas untuk ${orderId}: ${attempt.providerOrderId} — periksa & refund manual`);
            continue;
          }
          if (status) await midtrans.cancelPayment(attempt.providerOrderId);
          else {
            // Belum ada charge, tetapi URL Snap lama masih dapat dibuka. Token baru dengan order_id
            // yang sama membuat token yang pernah diberikan tidak berlaku; token pengganti dibuang.
            await midtrans.createPayment(this.paymentRequest(order, attempt.providerOrderId));
          }
        }
        await this.prisma.paymentAttempt.updateMany({
          where: { id: attempt.id, status: { in: [...ACTIVE_ATTEMPT_STATUSES] } },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Gagal menutup payment attempt ${attempt.providerOrderId}: ${(error as Error).message}`);
      }
    }
  }

  // Webhook Midtrans. Signature = SHA512(order_id + status_code + gross_amount + serverKey).
  async handleMidtrans(body: MidtransNotification) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new ServiceUnavailableException('Midtrans belum dikonfigurasi');
    const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;
    if (!order_id || !status_code || !gross_amount || !signature_key || !transaction_status) throw new BadRequestException('Payload tidak lengkap');

    const expected = createHash('sha512').update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest();
    const actual = Buffer.from(signature_key, 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new ForbiddenException('Signature tidak valid');

    await this.applyMidtransStatus(order_id, body);
    return { ok: true };
  }

  // Dipanggil dari server kita sendiri (otentikasi via server key di request GET, bukan signature publik),
  // jadi tidak perlu diverifikasi seperti webhook. Jaring pengaman kalau notifikasi Midtrans tidak pernah sampai
  // (localhost saat dev, atau gagal terkirim di production) — dipanggil saat user kembali ke halaman checkout.
  async syncWithMidtrans(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (order.status !== 'PENDING' || order.paymentProvider !== 'MIDTRANS') return { status: order.status };

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return { status: order.status };
    const attempt = await this.prisma.paymentAttempt.findFirst({ where: { orderId }, orderBy: { sequence: 'desc' } });
    const providerOrderId = attempt?.providerOrderId ?? orderId;
    const status = await new MidtransProvider(serverKey).getStatus(providerOrderId);
    if (!status) return { status: order.status };

    await this.applyMidtransStatus(providerOrderId, status);
    const refreshed = await this.prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    return { status: refreshed?.status ?? order.status };
  }

  private async applyMidtransStatus(providerOrderId: string, status: MidtransNotification | MidtransStatus) {
    const { gross_amount, transaction_status, fraud_status, transaction_id } = status;
    const attempt = await this.prisma.paymentAttempt.findUnique({ where: { providerOrderId } });
    const orderId = attempt?.orderId ?? providerOrderId;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (gross_amount !== undefined && Number(gross_amount) !== order.totalAmount) {
      this.logger.error(`Nominal tidak cocok untuk ${orderId}: gateway=${gross_amount} order=${order.totalAmount}`);
      throw new BadRequestException('Nominal tidak cocok');
    }

    const settled = transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept');
    if (settled) {
      if (attempt) {
        await this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: { status: 'PAID', providerRef: transaction_id ?? null, paidAt: new Date() },
        });
      }
      await this.markPaid(orderId, { provider: 'MIDTRANS', ref: transaction_id });
      await this.cancelOtherActiveAttempts(orderId, attempt?.id);
    } else if (transaction_status === 'expire') {
      if (attempt) await this.prisma.paymentAttempt.updateMany({ where: { id: attempt.id, status: { not: 'PAID' } }, data: { status: 'EXPIRED' } });
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'failure') {
      if (attempt) {
        await this.prisma.paymentAttempt.updateMany({
          where: { id: attempt.id, status: { not: 'PAID' } },
          data: { status: transaction_status === 'cancel' ? 'CANCELLED' : 'FAILED', ...(transaction_status === 'cancel' ? { cancelledAt: new Date() } : {}) },
        });
      }
    } else if (transaction_status === 'pending' || transaction_status === 'capture') {
      if (attempt) {
        await this.prisma.paymentAttempt.updateMany({
          where: { id: attempt.id, status: { in: [...ACTIVE_ATTEMPT_STATUSES] } },
          data: { status: 'PENDING', providerRef: transaction_id ?? undefined },
        });
      }
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      this.logger.warn(`Refund tercatat di Midtrans untuk ${orderId}: proses lewat panel admin`);
    }
  }

  // Simulasi bayar (development saja). Sama persis dengan jalur lunas sungguhan.
  async devConfirm(userId: string, orderId: string) {
    if (!this.devMode) throw new NotFoundException();
    const attempt = await this.prisma.paymentAttempt.findUnique({ where: { providerOrderId: orderId } });
    const internalOrderId = attempt?.orderId ?? orderId;
    const order = await this.prisma.order.findFirst({ where: { id: internalOrderId, userId } });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (attempt) {
      await this.prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'PAID', providerRef: 'dev-simulasi', paidAt: new Date() } });
    }
    await this.markPaid(internalOrderId, { provider: 'DEV', ref: 'dev-simulasi' });
    await this.cancelOtherActiveAttempts(internalOrderId, attempt?.id);
    return { status: 'PAID' as const };
  }
}
