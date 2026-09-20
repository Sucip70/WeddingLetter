import type { Metadata } from 'next';
import Link from 'next/link';
import { OrderStatusBadge } from '@/components/order-summary';
import { InvitationStatusBadge, expiryText } from '@/components/status';
import { Alert, Card, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { daysLeft, formatDate, rupiah } from '@/lib/format';
import { authedFetch, requireUser } from '@/lib/session';
import type { InvitationListItem, OrderSummary } from '@/lib/types';

export const metadata: Metadata = { title: 'Undangan saya' };

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');
  const [invitations, orders] = await Promise.all([
    authedFetch<InvitationListItem[]>('/invitations', '/dashboard'),
    authedFetch<OrderSummary[]>('/orders', '/dashboard'),
  ]);

  const pending = orders.filter((o) => o.status === 'PENDING');
  const toPublish = invitations.filter((i) => i.status === 'DRAFT' && i.orderStatus === 'PAID');
  const expiring = invitations.filter((i) => i.status === 'ACTIVE' && (daysLeft(i.expiresAt) ?? 99) <= 7);
  const inGrace = invitations.filter((i) => i.status === 'EXPIRED_GRACE');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Undangan saya"
        subtitle={`Halo, ${user.name}. Kelola undangan, pantau RSVP, dan perpanjang masa aktif di sini.`}
        actions={<LinkButton href="/templates">+ Buat undangan baru</LinkButton>}
      />

      <div className="space-y-3">
        {toPublish.map((i) => (
          <Alert key={i.id} tone="info">
            Undangan <strong>/{i.slug}</strong> sudah dibayar tapi <strong>belum dipublikasikan</strong>. <Link className="font-medium underline" href={`/dashboard/invitations/${i.id}`}>Atur & publikasikan →</Link>
          </Alert>
        ))}
        {expiring.map((i) => (
          <Alert key={i.id} tone="warn">
            Undangan <strong>/{i.slug}</strong> berakhir dalam {daysLeft(i.expiresAt)} hari. <Link className="font-medium underline" href={`/dashboard/invitations/${i.id}?tab=extend`}>Perpanjang sekarang →</Link>
          </Alert>
        ))}
        {inGrace.map((i) => (
          <Alert key={i.id} tone="danger">
            Undangan <strong>/{i.slug}</strong> sudah berakhir. Datanya masih tersimpan 30 hari. <Link className="font-medium underline" href={`/dashboard/invitations/${i.id}?tab=extend`}>Aktifkan kembali →</Link>
          </Alert>
        ))}
        {pending.map((o) => (
          <Alert key={o.id} tone="warn">
            Pesanan {o.templateName} ({rupiah(o.totalAmount)}) menunggu pembayaran. <Link className="font-medium underline" href={`/checkout/${o.id}`}>Lanjutkan →</Link>
          </Alert>
        ))}
      </div>

      <section className="mt-8">
        {invitations.length === 0 ? (
          <EmptyState title="Belum ada undangan" description="Pilih template, isi data, dan undangan pertama Anda siap dalam hitungan menit." action={<LinkButton href="/templates">Lihat template</LinkButton>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {invitations.map((i) => (
              <Link key={i.id} href={`/dashboard/invitations/${i.id}`} className="group">
                <Card className="h-full p-6 transition-shadow group-hover:shadow-lg group-hover:shadow-ink/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl text-ink">/{i.slug}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{i.templateName}</p>
                    </div>
                    <InvitationStatusBadge status={i.status} />
                  </div>
                  <p className="mt-4 text-sm text-ink-soft">{expiryText(i.status, i.expiresAt, i.remainingDays)}</p>
                  <div className="mt-5 flex gap-6 border-t border-line pt-4 text-sm">
                    <span><strong className="text-ink">{i.viewCount}</strong> <span className="text-ink-soft">dilihat</span></span>
                    <span><strong className="text-ink">{i.rsvpCount}</strong> <span className="text-ink-soft">RSVP</span></span>
                    <span className="ml-auto font-medium text-rose group-hover:underline">Kelola →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {orders.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-ink">Riwayat pesanan</h2>
          <Card className="mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-ivory text-left text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-5 py-3 font-medium">Tanggal</th>
                    <th className="px-5 py-3 font-medium">Pesanan</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3.5 text-ink-soft">{formatDate(o.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <Link href={`/checkout/${o.id}`} className="font-medium text-ink hover:text-rose">{o.kind === 'NEW' ? `Template ${o.templateName}` : `Perpanjangan ${o.activeWeeks} minggu`}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">{rupiah(o.totalAmount)}</td>
                      <td className="px-5 py-3.5"><OrderStatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
