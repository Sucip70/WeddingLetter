import { notFound } from 'next/navigation';
import { LegalDocument } from '@/components/legal-document';
import { authedFetch } from '@/lib/session';
import type { OrderDetail } from '@/lib/types';

export const metadata = { title: 'Bukti persetujuan pesanan', robots: { index: false, follow: false } };
export default async function AcceptedTermsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await authedFetch<OrderDetail>(`/orders/${orderId}`, `/checkout/${orderId}/terms`);
  if (!order.agreement) notFound();
  return <LegalDocument policy={order.agreement.policy} acceptedAt={order.agreement.acceptedAt} />;
}
