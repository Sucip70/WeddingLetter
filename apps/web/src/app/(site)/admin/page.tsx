import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui';
import { rupiah } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import { MaintenanceButton } from './maintenance-button';

export const metadata: Metadata = { title: 'Admin — ringkasan' };

interface Stats {
  revenue: { total: number; orders: number; last30Days: number; orders30Days: number };
  orders: Record<string, number>;
  invitations: Record<string, number>;
  users: number;
  expiringIn7Days: number;
  paidAwaitingPublish: number;
}

export default async function AdminHome() {
  const s = await authedFetch<Stats>('/admin/stats', '/admin');
  const cards: { label: string; value: string | number; hint?: string; href?: string }[] = [
    { label: 'Pendapatan 30 hari', value: rupiah(s.revenue.last30Days), hint: `${s.revenue.orders30Days} pesanan lunas`, href: '/admin/orders?status=PAID' },
    { label: 'Pendapatan total', value: rupiah(s.revenue.total), hint: `${s.revenue.orders} pesanan lunas` },
    { label: 'Undangan aktif', value: s.invitations.ACTIVE ?? 0, href: '/admin/invitations?status=ACTIVE' },
    { label: 'Berakhir ≤ 7 hari', value: s.expiringIn7Days, hint: 'Peluang perpanjangan', href: '/admin/invitations?status=ACTIVE' },
    { label: 'Lunas, belum publish', value: s.paidAwaitingPublish, href: '/admin/invitations?status=DRAFT' },
    { label: 'Menunggu pembayaran', value: s.orders.PENDING ?? 0, href: '/admin/orders?status=PENDING' },
    { label: 'Masa tenggang', value: s.invitations.EXPIRED_GRACE ?? 0, href: '/admin/invitations?status=EXPIRED_GRACE' },
    { label: 'Pengguna', value: s.users, href: '/admin/users' },
  ];
  return (
    <>
      <PageHeader title="Ringkasan" subtitle="Kondisi bisnis dan hal yang perlu ditindaklanjuti." actions={<MaintenanceButton />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <Card className="h-full p-5 transition-shadow hover:shadow-md">
              <p className="text-sm text-ink-soft">{c.label}</p>
              <p className="mt-2 font-display text-3xl text-ink">{c.value}</p>
              {c.hint && <p className="mt-1 text-xs text-ink-soft">{c.hint}</p>}
            </Card>
          );
          return c.href ? <Link key={c.label} href={c.href}>{inner}</Link> : <div key={c.label}>{inner}</div>;
        })}
      </div>
    </>
  );
}
