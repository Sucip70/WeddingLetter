import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import type { ArtworkManifest, InvitationViewData } from '@/lib/types';

export const metadata = { title: 'Pusako Minang — Songket Pusako Review', robots: { index: false, follow: false } };
export default async function Review({ searchParams }: { searchParams: Promise<{ size?: string; long?: string; photo?: string; kind?: string; tier?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const q = await searchParams, long = q.long === 'true', noPhoto = q.photo === 'none';
  const kind = q.kind === 'ornamen' ? 'ornamen' : q.kind === 'berdua' ? 'berdua' : 'bingkai';
  const dimensions = q.size === 'short' ? { width: 320, height: 520 } : q.size === 'tall' ? { width: 440, height: 956 } : { width: 390, height: 700 };
  const artwork = { schemaVersion: 1, artworkVersion: 1, designId: 'pusako-minang', assets: Object.fromEntries(Object.entries({ coverBackground: 'page-background', pageBackground: 'page-tile', divider: 'divider', topDecoration: 'mini-gonjong', sectionBackground: 'info-card', photoFrame: 'photo-frame', gateBackground: 'gate-tile' }).map(([slot, file]) => [slot, { default: { url: `/themes/pusako-minang/${file}.webp`, contentType: 'image/webp', width: 1024, height: 1536, sizeBytes: 1 } }])), presentation: { backgroundFit: 'cover', backgroundPosition: 'center', foregroundPosition: 'center', foregroundMotion: 'none', opacity: 1, scale: 1, backgroundLayer: 0, decorationLayer: 2, foregroundLayer: 3, showOnOrnamentCover: true, showOnPhotoCover: true }, fallback: { coverEffect: 'none' } } as ArtworkManifest;
  const view: InvitationViewData = {
    slug: 'pusako-cover-review', features: {}, media: noPhoto ? {} : { cover: { url: q.photo === 'broken' ? '/missing-pusako-review.webp' : '/samples/pusako-minang/cover.webp', type: 'image/webp' }, groom: { url: '/samples/pusako-minang/groom.webp', type: 'image/webp' }, bride: { url: '/samples/pusako-minang/bride.webp', type: 'image/webp' } }, rsvpEnabled: false, guestbook: [],
    layout: { artwork, theme: { preset: 'pusako-minang', motif: 'pusako-minang', gate: q.tier === 'standard' ? 'none' : 'gonjong', fx: q.tier === 'standard' ? 'standard' : 'premium', primary: '#681813', secondary: '#8c6224', background: '#f5ead2', text: '#211712', headingFont: 'serif', bodyFont: 'serif' }, sections: [{ id: 'cover', title: 'Cover', fields: [] }], musik: { presets: [] }, coverLayouts: ['ornamen', 'bingkai', 'berdua', 'terbagi', 'penuh'] },
    data: { cover: { tata_letak: kind, foto: noPhoto ? '' : 'cover' }, mempelai: { pria_nama: long ? 'Alexandra Putri' : 'Andi', wanita_nama: long ? 'Muhammad Rasyid' : 'Sinta', pria_foto: noPhoto ? '' : 'groom', wanita_foto: noPhoto ? '' : 'bride' }, tanggal_lokasi: { akad_tanggal: '2026-11-28T10:00' } },
  };
  return <main style={{ ...dimensions, position: 'relative' }}><InvitationView view={view} mode="live" embedded gate="show" /></main>;
}
