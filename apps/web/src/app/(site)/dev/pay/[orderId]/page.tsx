import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { authedFetch, requireUser } from '@/lib/session';
import type { OrderDetail } from '@/lib/types';
import { DevPay } from './dev-pay';

export const metadata: Metadata = { title: 'Simulasi pembayaran' };

// Halaman simulasi (tanpa Midtrans) hanya untuk development.
export default async function DevPayPage({ params }: PageProps<'/dev/pay/[orderId]'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { orderId } = await params;
  const path = `/dev/pay/${orderId}`;
  await requireUser(path);
  const order = await authedFetch<OrderDetail>(`/orders/${orderId}`, path);
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <DevPay order={order} />
    </div>
  );
}
