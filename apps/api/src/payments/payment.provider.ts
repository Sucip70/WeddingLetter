export interface PaymentItem {
  id: string;
  name: string;
  price: number; // bisa negatif (diskon)
  quantity: number;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  customer: { name: string; email: string };
  items: PaymentItem[];
  finishUrl: string;
}

export interface PaymentInit {
  provider: 'MIDTRANS' | 'DEV';
  token?: string;
  redirectUrl: string;
}

export interface PaymentProvider {
  createPayment(request: PaymentRequest): Promise<PaymentInit>;
  // false berarti gateway menolak pembatalan karena status berubah (biasanya baru saja dibayar).
  cancelPayment(orderId: string): Promise<boolean>;
}
