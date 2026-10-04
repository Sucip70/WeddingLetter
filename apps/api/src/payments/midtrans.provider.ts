import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { PaymentInit, PaymentProvider, PaymentRequest } from './payment.provider.js';

export function midtransSnapBase() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

// Core API (beda host dari Snap) — dipakai untuk menanyakan status transaksi secara aktif,
// jaring pengaman kalau webhook notifikasi tidak pernah sampai (localhost saat dev, atau gagal di production).
function midtransApiBase() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
}

export interface MidtransStatus {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
}

// Midtrans Snap: membuat transaksi, mengembalikan token + redirect_url halaman bayar Midtrans.
export class MidtransProvider implements PaymentProvider {
  private readonly logger = new Logger(MidtransProvider.name);

  constructor(private readonly serverKey: string) {}

  async createPayment(request: PaymentRequest): Promise<PaymentInit> {
    const itemsTotal = request.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const body = {
      transaction_details: { order_id: request.orderId, gross_amount: request.amount },
      // Midtrans menolak transaksi jika total item != gross_amount, jadi item hanya dikirim bila cocok.
      ...(itemsTotal === request.amount
        ? { item_details: request.items.map((i) => ({ id: i.id.slice(0, 50), name: i.name.slice(0, 50), price: i.price, quantity: i.quantity })) }
        : {}),
      customer_details: { first_name: request.customer.name.slice(0, 255), email: request.customer.email },
      callbacks: { finish: request.finishUrl },
      expiry: { unit: 'hours', duration: 24 },
    };

    const res = await fetch(`${midtransSnapBase()}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      this.logger.error(`Midtrans Snap gagal (${res.status}): ${await res.text()}`);
      throw new ServiceUnavailableException('Gagal membuat pembayaran, coba lagi sebentar');
    }
    const json = (await res.json()) as { token: string; redirect_url: string };
    return { provider: 'MIDTRANS', token: json.token, redirectUrl: json.redirect_url };
  }

  // GET status transaksi (Core API). Otentikasi lewat server key yang sama, bukan signature — dipanggil
  // dari server kita sendiri, bukan webhook publik, jadi tidak perlu diverifikasi seperti notification.
  async getStatus(orderId: string): Promise<MidtransStatus | null> {
    const res = await fetch(`${midtransApiBase()}/v2/${encodeURIComponent(orderId)}/status`, {
      headers: { Accept: 'application/json', Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}` },
    });
    if (res.status === 404) return null; // transaksi belum pernah dibuat di Midtrans
    if (!res.ok) {
      this.logger.error(`Midtrans get status gagal (${res.status}): ${await res.text()}`);
      throw new ServiceUnavailableException('Gagal mengecek status pembayaran, coba lagi sebentar');
    }
    return (await res.json()) as MidtransStatus;
  }
}
