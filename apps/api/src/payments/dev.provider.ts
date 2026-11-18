import type { PaymentInit, PaymentProvider, PaymentRequest } from './payment.provider.js';

// Pembayaran simulasi untuk development tanpa kredensial Midtrans: mengarah ke halaman "bayar simulasi"
// di web. Tidak pernah aktif di production (lihat PaymentsService.provider()).
export class DevProvider implements PaymentProvider {
  async createPayment(request: PaymentRequest): Promise<PaymentInit> {
    // orderId identifies a gateway attempt (e.g. order-p1). The development
    // page looks up the merchant order instead; finishUrl already contains it.
    const redirect = new URL(request.finishUrl);
    const match = redirect.pathname.match(/^(.*)\/checkout\/([^/]+)\/?$/);
    if (!match) throw new Error('URL penyelesaian pembayaran lokal tidak valid');
    redirect.pathname = `${match[1]}/dev/pay/${match[2]}`;
    redirect.search = '';
    redirect.hash = '';
    return { provider: 'DEV', redirectUrl: redirect.toString() };
  }

  async cancelPayment() {
    return true;
  }
}
