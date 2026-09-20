import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import { LogoMark } from '@/components/logo';
import { ApiError, apiFetch } from '@/lib/api';
import type { InvitationViewData } from '@/lib/types';

type Loaded = { view: InvitationViewData } | { inactive: true };

async function load(slug: string): Promise<Loaded> {
  try {
    return { view: await apiFetch<InvitationViewData>(`/public/invitations/${encodeURIComponent(slug)}`) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 410) return { inactive: true };
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

function title(view: InvitationViewData) {
  const m = view.data.mempelai;
  const a = typeof m?.pria_nama === 'string' ? m.pria_nama : '';
  const b = typeof m?.wanita_nama === 'string' ? m.wanita_nama : '';
  return a && b ? `Undangan Pernikahan ${a} & ${b}` : 'Undangan Pernikahan';
}

export async function generateMetadata({ params }: PageProps<'/u/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await load(slug).catch(() => null);
  if (!loaded || 'inactive' in loaded) return { title: 'Undangan', robots: { index: false } };
  return {
    title: title(loaded.view),
    description: 'Anda diundang ke hari bahagia kami. Buka undangan untuk melihat detail acara.',
    // Undangan bersifat pribadi: jangan diindeks mesin pencari.
    robots: { index: false, follow: false },
    openGraph: { title: title(loaded.view), type: 'website' },
  };
}

export default async function PublicInvitationPage({ params }: PageProps<'/u/[slug]'>) {
  const { slug } = await params;
  const loaded = await load(slug);

  if ('inactive' in loaded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
        <LogoMark className="h-12 w-12" />
        <h1 className="mt-6 font-display text-3xl text-ink">Undangan ini sedang tidak aktif</h1>
        <p className="mt-3 max-w-sm text-ink-soft">Masa tayang undangan ini sedang dijeda atau sudah berakhir. Silakan hubungi mempelai untuk informasi acara.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: `color-mix(in srgb, ${loaded.view.layout.theme.primary} 10%, #ece7e0)` }}>
      <InvitationView view={loaded.view} mode="live" />
    </div>
  );
}
