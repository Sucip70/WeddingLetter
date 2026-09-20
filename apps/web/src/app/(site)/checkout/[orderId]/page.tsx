import type { Metadata } from 'next';
import { authedFetch, requireUser } from '@/lib/session';
import type { OrderDetail } from '@/lib/types';
import { CheckoutStatus } from './checkout-status';

export const metadata: Metadata = { title: 'Pembayaran' };

export default async function CheckoutPage({ params }: PageProps<'/checkout/[orderId]'>) {
  const { orderId } = await params;
  const path = `/checkout/${orderId}`;
  await requireUser(path);
  const order = await authedFetch<OrderDetail>(`/orders/${orderId}`, path);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <CheckoutStatus initial={order} />
    </div>
  );
}
