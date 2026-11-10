import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import { pusakoMinangArtwork } from '../../../../../api/src/templates/artwork';
import type { InvitationViewData } from '@/lib/types';

export const metadata = { title: 'Surat Bersegel — Review', robots: { index: false, follow: false } };

/** Local-only regression fixture: exercises the real gate, guest URL and opening lifecycle. */
export default async function PusakoLetterReview({ searchParams }: {
  searchParams: Promise<{ long?: string; tier?: string; embedded?: string; mode?: string; size?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const query = await searchParams;
  const standard = query.tier === 'standard';
  const view: InvitationViewData = {
    slug: 'pusako-letter-review', features: {}, media: {}, rsvpEnabled: false, guestbook: [],
    layout: {
      artwork: pusakoMinangArtwork(),
      theme: { preset: 'pusako-minang', motif: 'pusako-minang', gate: standard ? 'none' : 'gonjong', fx: standard ? 'standard' : 'premium', primary: '#681813', secondary: '#b9853f', background: '#f3e7d1', text: '#38251e', headingFont: 'serif', bodyFont: 'serif' },
      sections: [{ id: 'cover', title: 'Cover', fields: [] }], musik: { presets: [] }, coverLayouts: ['ornamen', 'bingkai', 'berdua', 'terbagi', 'penuh'],
    },
    data: {
      cover: { tata_letak: 'ornamen' },
      mempelai: { pria_nama: query.long === 'true' ? 'Alexandra Putri' : 'Andi', wanita_nama: query.long === 'true' ? 'Muhammad Rasyid' : 'Sinta' },
      tanggal_lokasi: { akad_tanggal: '2026-12-26T10:00' },
    },
  };
  const embedded = query.embedded === 'true';
  const dimensions = query.size === 'narrow' ? { width: 320, height: 640 } : query.size === 'tall' ? { width: 440, height: 956 } : { width: 390, height: 700 };
  return <main style={{ background: '#211712', ...(embedded ? dimensions : { minHeight: '100svh' }) }}>
    <InvitationView view={view} mode={query.mode === 'preview' ? 'preview' : 'live'} embedded={embedded} gate="show" />
  </main>;
}
