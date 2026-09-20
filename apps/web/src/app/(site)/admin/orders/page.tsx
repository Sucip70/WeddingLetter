import type { Metadata } from 'next';
import Link from 'next/link';
import { Filters, Pager, Table, pickPage, pickString } from '@/components/admin/list';
import { ORDER_STATUS, OrderStatusBadge } from '@/components/order-summary';
import { PageHeader } from '@/components/ui';
import { formatDateTime, rupiah } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import type { OrderStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin — pesanan' };

interface Row {
  id: string;
  kind: 'NEW' | 'EXTENSION';
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
  paymentProvider: string | null;
  user: { id: string; name: string; email: string };
  templateName: string;
  invitation: { id: string; slug: string } | null;
}

export default async function AdminOrders({ searchParams }: PageProps<'/admin/orders'>) {
  const sp = await searchParams;
  const q = pickString(sp.q);
  const status = pickString(sp.status);
  const page = pickPage(sp.page);
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  const data = await authedFetch<{ items: Row[]; total: number; page: number; pageSize: number }>(`/admin/orders?${query}`, '/admin/orders');

  return (
    <>
      <PageHeader title="Pesanan" subtitle="Semua transaksi. Klik pesanan untuk rincian, tandai lunas manual, atau refund." />
      <Filters q={q} status={status} placeholder="Cari email, nama, ID pesanan, atau slug" statuses={Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
      <Table head={['Tanggal', 'Pengguna', 'Pesanan', 'Total', 'Status', 'Bayar via']}>
        {data.items.map((o) => (
          <tr key={o.id} className="hover:bg-ivory/60">
            <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(o.createdAt)}</td>
            <td className="px-4 py-3"><p className="font-medium text-ink">{o.user.name}</p><p className="text-xs text-ink-soft">{o.user.email}</p></td>
            <td className="px-4 py-3">
              <Link href={`/admin/orders/${o.id}`} className="font-medium text-rose hover:underline">{o.kind === 'NEW' ? `Template ${o.templateName}` : 'Perpanjangan'}</Link>
              <p className="text-xs text-ink-soft">{o.invitation ? `/${o.invitation.slug}` : ''}</p>
            </td>
            <td className="px-4 py-3 tabular-nums">{rupiah(o.totalAmount)}</td>
            <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
            <td className="px-4 py-3 text-xs text-ink-soft">{o.paymentProvider ?? '-'}</td>
          </tr>
        ))}
        {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">Tidak ada pesanan.</td></tr>}
      </Table>
      <Pager base="/admin/orders" page={data.page} pageSize={data.pageSize} total={data.total} params={{ q, status }} />
    </>
  );
}
