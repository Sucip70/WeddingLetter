import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusBadge } from '@/components/order-summary';
import { Card } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { formatDateTime, rupiah } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import type { OrderStatus, QuoteLine } from '@/lib/types';
import { OrderActions } from './order-actions';

export const metadata: Metadata = { title: 'Admin — detail pesanan' };

interface AdminOrder {
  id: string;
  kind: 'NEW' | 'EXTENSION';
  status: OrderStatus;
  templateName: string;
  activeWeeks: number;
  subtotal: number;
  addOnTotal: number;
  couponDiscount: number;
  totalAmount: number;
  coupon: string | null;
  paymentProvider: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  invitation: { id: string; slug: string; status: string; publishedAt: string | null } | null;
  extendsInvitation: { id: string; slug: string } | null;
  lines: QuoteLine[];
}

export default async function AdminOrderDetail({ params }: PageProps<'/admin/orders/[id]'>) {
  const { id } = await params;
  const o = await authedFetch<AdminOrder>(`/admin/orders/${id}`, `/admin/orders/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const inv = o.invitation ?? o.extendsInvitation;
  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-ink-soft hover:text-ink">← Pesanan</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">{o.kind === 'NEW' ? `Template ${o.templateName}` : 'Perpanjangan'}</h1>
        <OrderStatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">{o.id}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Pembeli</h2>
          <p className="mt-2 text-ink">{o.user.name}</p>
          <p className="text-sm text-ink-soft">{o.user.email}</p>
          {o.user.phone && <p className="text-sm text-ink-soft">{o.user.phone}</p>}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Pembayaran</h2>
          <p className="mt-2 text-sm text-ink-soft">Dibuat {formatDateTime(o.createdAt)}</p>
          <p className="text-sm text-ink-soft">{o.paidAt ? `Dibayar ${formatDateTime(o.paidAt)} via ${o.paymentProvider}` : 'Belum dibayar'}</p>
          {o.paymentRef && <p className="text-xs text-ink-soft">Ref: {o.paymentRef}</p>}
          {inv && <Link href={`/admin/invitations/${inv.id}`} className="mt-2 inline-block text-sm font-medium text-rose hover:underline">Undangan /{inv.slug} →</Link>}
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <dl className="space-y-2.5 text-sm">
          {o.subtotal > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Template {o.templateName}</dt><dd className="tabular-nums">{rupiah(o.subtotal)}</dd></div>}
          {o.lines.map((l) => (
            <div key={l.code} className="flex justify-between gap-4">
              <dt className="text-ink-soft">{l.label}{l.quantity > 1 && <span className="ml-1 text-xs">({l.quantity} × {rupiah(l.unitPrice)})</span>}</dt>
              <dd className="tabular-nums">{rupiah(l.amount)}</dd>
            </div>
          ))}
          {o.couponDiscount > 0 && <div className="flex justify-between text-sage"><dt>Kupon {o.coupon}</dt><dd className="tabular-nums">−{rupiah(o.couponDiscount)}</dd></div>}
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span className="font-semibold text-ink">Total</span><span className="font-display text-3xl text-ink">{rupiah(o.totalAmount)}</span></div>
      </Card>

      <OrderActions id={o.id} status={o.status} kind={o.kind} published={!!o.invitation?.publishedAt} />
    </div>
  );
}
