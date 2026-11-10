import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import type { ArtworkManifest, ArtworkSlot, InvitationViewData } from '@/lib/types';

export const metadata = { title: 'Surat Bersegel — Review', robots: { index: false, follow: false } };

// Keep this development fixture inside the web workspace so standalone Docker
// builds do not require API source files or API-only dependencies.
function pusakoMinangArtwork(): ArtworkManifest {
  const files: Partial<Record<ArtworkSlot, [string, number, number]>> = {
    coverBackground: ['page-background', 1024, 1536], pageBackground: ['page-tile', 1024, 3072],
    cornerTopLeft: ['corner-top-left', 1100, 1105], cornerBottomRight: ['corner-bottom-right', 1100, 1105],
    divider: ['divider', 1996, 274], topDecoration: ['mini-gonjong', 1183, 652],
    cardFrame: ['info-card', 896, 1405], photoFrame: ['photo-frame', 892, 1413],
    bottomDecoration: ['footer', 2015, 297], gateBackground: ['gate-tile', 1024, 3072],
    gateTransition: ['gate-post-left', 323, 1497], gateForeground: ['gate-post-right', 323, 1497],
    gateInteractive: ['gate-gonjong', 1160, 868],
  };
  return {
    schemaVersion: 1, designId: 'pusako-minang', artworkVersion: 1,
    assets: Object.fromEntries(Object.entries(files).map(([slot, [file, width, height]]) => [slot, {
      default: { url: `/themes/pusako-minang/${file}.webp`, contentType: 'image/webp', width, height, sizeBytes: 1 },
    }])),
    presentation: {
      backgroundFit: 'cover', backgroundPosition: 'center', foregroundPosition: 'center', foregroundMotion: 'none',
      opacity: 1, scale: 1, backgroundLayer: 0, decorationLayer: 2, foregroundLayer: 3,
      showOnOrnamentCover: true, showOnPhotoCover: true,
    },
    fallback: { ornament: 'keraton', coverEffect: 'none', particle: 'dust' },
  };
}

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
