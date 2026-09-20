import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { appUrl } from '@/lib/format';
import { authedFetch, requireUser } from '@/lib/session';
import type { InvitationDetail } from '@/lib/types';
import { InvitationManager } from './manager';

export const metadata: Metadata = { title: 'Kelola undangan' };

export default async function ManageInvitationPage({ params, searchParams }: PageProps<'/dashboard/invitations/[id]'>) {
  const { id } = await params;
  const sp = await searchParams;
  const path = `/dashboard/invitations/${id}`;
  await requireUser(path);
  const invitation = await authedFetch<InvitationDetail>(`/invitations/${id}`, path).catch((error) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  });
  const tab = typeof sp.tab === 'string' ? sp.tab : 'overview';
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink">← Undangan saya</Link>
      <InvitationManager initial={invitation} initialTab={tab} baseUrl={appUrl()} />
    </div>
  );
}
