import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InvitationStatusBadge, expiryText } from '@/components/status';
import { Badge, Card } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { appUrl, formatDate, mb, rupiah } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import type { InvitationMedia, InvitationStatus } from '@/lib/types';
import { InvitationActions } from './invitation-actions';

export const metadata: Metadata = { title: 'Admin — detail undangan' };

interface AdminInvitation {
  id: string;
  slug: string;
  status: InvitationStatus;
  templateName: string;
  publishedAt: string | null;
  expiresAt: string | null;
  pausedAt: string | null;
  remainingDays: number | null;
  viewCount: number;
  rsvpCount: number;
  user: { id: string; name: string; email: string; phone: string | null };
  order: { id: string; status: string; totalAmount: number; activeWeeks: number; paidAt: string | null };
  media: (InvitationMedia & { rentalPrice: number })[];
}

export default async function AdminInvitationDetail({ params }: PageProps<'/admin/invitations/[id]'>) {
  const { id } = await params;
  const i = await authedFetch<AdminInvitation>(`/admin/invitations/${id}`, `/admin/invitations/${id}`).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  return (
    <div className="max-w-4xl">
      <Link href="/admin/invitations" className="text-sm text-ink-soft hover:text-ink">← Undangan</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">/{i.slug}</h1>
        <InvitationStatusBadge status={i.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">{i.templateName} · {expiryText(i.status, i.expiresAt, i.remainingDays)}</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Pemilik</h2>
          <p className="mt-2 text-ink">{i.user.name}</p>
          <p className="text-sm text-ink-soft">{i.user.email}{i.user.phone ? ` · ${i.user.phone}` : ''}</p>
          <Link href={`/admin/orders/${i.order.id}`} className="mt-3 inline-block text-sm font-medium text-rose hover:underline">Pesanan {rupiah(i.order.totalAmount)} ({i.order.status}) →</Link>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Statistik</h2>
          <p className="mt-2 text-sm text-ink-soft">{i.viewCount} kali dibuka · {i.rsvpCount} RSVP</p>
          <p className="text-sm text-ink-soft">Dipublikasikan: {formatDate(i.publishedAt)}</p>
          {i.status === 'ACTIVE' && <a href={`${appUrl()}/u/${i.slug}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-rose hover:underline">Buka halaman undangan ↗</a>}
        </Card>
      </div>

      <InvitationActions id={i.id} status={i.status} expiresAt={i.expiresAt} />

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-line px-5 py-3 text-sm font-semibold text-ink">File media ({i.media.length})</h2>
        <ul className="divide-y divide-line text-sm">
          {i.media.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span className="text-ink">{m.type === 'PHOTO' ? 'Foto' : m.type === 'VIDEO' ? 'Video' : 'Lagu'} · {mb(m.sizeBytes)} · {m.included ? 'termasuk template' : `sewa ${m.rentedWeeks} minggu (${rupiah(m.rentalPrice)})`}</span>
              <span className="flex items-center gap-3 text-xs text-ink-soft">
                {m.expiresAt ? `sampai ${formatDate(m.expiresAt)}` : m.remainingDays !== null ? `sisa ${m.remainingDays} hari` : ''}
                <Badge tone={m.status === 'ACTIVE' ? 'sage' : m.status === 'EXPIRED_GRACE' ? 'danger' : 'neutral'}>{m.status}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
