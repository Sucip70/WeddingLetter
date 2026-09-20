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
}
