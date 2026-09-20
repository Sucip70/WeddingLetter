import type { PaymentInit, PaymentProvider, PaymentRequest } from './payment.provider.js';

// Pembayaran simulasi untuk development tanpa kredensial Midtrans: mengarah ke halaman "bayar simulasi"
// di web. Tidak pernah aktif di production (lihat PaymentsService.provider()).
export class DevProvider implements PaymentProvider {
  async createPayment(request: PaymentRequest): Promise<PaymentInit> {
    const base = process.env.WEB_BASE_URL ?? 'http://localhost:3000';
    return { provider: 'DEV', redirectUrl: `${base}/dev/pay/${request.orderId}` };
  }
}
