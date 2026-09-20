import type { Metadata } from 'next';
import Link from 'next/link';
import { Filters, Pager, Table, pickPage, pickString } from '@/components/admin/list';
import { INVITATION_STATUS, InvitationStatusBadge } from '@/components/status';
import { PageHeader } from '@/components/ui';
import { daysLeft, formatDate } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import type { InvitationStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin — undangan' };

interface Row {
  id: string;
  slug: string;
  status: InvitationStatus;
  templateName: string;
  user: { id: string; name: string; email: string };
  publishedAt: string | null;
  expiresAt: string | null;
  remainingDays: number | null;
  viewCount: number;
  rsvpCount: number;
}

export default async function AdminInvitations({ searchParams }: PageProps<'/admin/invitations'>) {
  const sp = await searchParams;
  const q = pickString(sp.q);
  const status = pickString(sp.status);
  const page = pickPage(sp.page);
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (q) query.set('q', q);
  if (status) query.set('status', status);
  const data = await authedFetch<{ items: Row[]; total: number; page: number; pageSize: number }>(`/admin/invitations?${query}`, '/admin/invitations');

  return (
    <>
      <PageHeader title="Undangan" subtitle="Semua undangan pelanggan. Buka satu undangan untuk menjeda, melanjutkan, memperpanjang, atau mengatur tanggal berakhir." />
      <Filters q={q} status={status} placeholder="Cari slug, nama, atau email" statuses={Object.entries(INVITATION_STATUS).map(([value, s]) => ({ value, label: s.label }))} />
      <Table head={['Undangan', 'Pemilik', 'Status', 'Berakhir', 'Dibuka', 'RSVP']}>
        {data.items.map((i) => {
          const d = daysLeft(i.expiresAt);
          return (
            <tr key={i.id} className="hover:bg-ivory/60">
              <td className="px-4 py-3"><Link href={`/admin/invitations/${i.id}`} className="font-medium text-rose hover:underline">/{i.slug}</Link><p className="text-xs text-ink-soft">{i.templateName}</p></td>
              <td className="px-4 py-3"><p className="text-ink">{i.user.name}</p><p className="text-xs text-ink-soft">{i.user.email}</p></td>
              <td className="px-4 py-3"><InvitationStatusBadge status={i.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                {i.status === 'PAUSED' ? `dijeda · sisa ${i.remainingDays ?? 0} hari` : i.expiresAt ? `${formatDate(i.expiresAt)}${d !== null && d >= 0 ? ` (${d} hr)` : ''}` : '-'}
              </td>
              <td className="px-4 py-3 tabular-nums">{i.viewCount}</td>
              <td className="px-4 py-3 tabular-nums">{i.rsvpCount}</td>
            </tr>
          );
        })}
        {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-soft">Tidak ada undangan.</td></tr>}
      </Table>
      <Pager base="/admin/invitations" page={data.page} pageSize={data.pageSize} total={data.total} params={{ q, status }} />
    </>
  );
}
