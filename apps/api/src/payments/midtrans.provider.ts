import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { PaymentInit, PaymentProvider, PaymentRequest } from './payment.provider.js';

export function midtransSnapBase() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
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
}
