import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import { TemplateThumb } from '@/components/template-thumb';
import { COVER_LAYOUTS, isCoverKind } from '@/lib/cover-layouts';
import type { InvitationViewData } from '@/lib/types';
import sample from '@/components/invitation/assets/lavender-sample.webp';

export const metadata = { title: 'Taman Botani — Serambi Review', robots: { index: false, follow: false } };
export default async function Review({ searchParams }: { searchParams: Promise<{ size?: string; long?: string; photo?: string; kind?: string; tier?: string; view?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const q = await searchParams, long = q.long === 'true', noPhoto = q.photo === 'none';
  const kind = isCoverKind(q.kind) ? q.kind : 'bingkai';
  const dimensions = q.size === 'short' ? { width: 320, height: 520 } : q.size === 'tall' ? { width: 440, height: 956 } : { width: 390, height: 700 };
  const view: InvitationViewData = {
    slug: 'garden-review', features: {}, media: noPhoto ? {} : { cover: { url: q.photo === 'broken' ? '/missing-garden-review.webp' : sample.src, type: 'image/webp' } }, rsvpEnabled: true, guestbook: [{ name: 'Budi & Keluarga', message: 'Semoga bahagia selalu.', attending: true, createdAt: '2026-11-11T10:00:00Z' }],
    layout: { theme: { preset: 'garden', motif: 'garden', gate: q.tier === 'standard' ? 'none' : 'taman', fx: q.tier === 'standard' ? 'standard' : 'premium', primary: '#284d3b', secondary: '#a58e5c', background: '#f5f1e6', text: '#264536', headingFont: 'serif', bodyFont: 'source' }, sections: ['cover', 'mempelai', 'tanggal_lokasi', 'cerita', 'countdown', 'galeri', 'rsvp', 'amplop_digital', 'buku_tamu'].map(id => ({ id, title: id, fields: [] })), musik: { presets: [] }, coverLayouts: Object.keys(COVER_LAYOUTS) },
    data: {
      cover: { tata_letak: kind, foto: noPhoto ? '' : 'cover' },
      mempelai: { pria_nama: long ? 'Alexandra Putri' : 'Andi', wanita_nama: long ? 'Muhammad Rasyid' : 'Sinta', pria_ortu: 'Putra dari Bapak Hendra Wijaya & Ibu Ratna Sari', wanita_ortu: 'Putri dari Bapak Agus Salim & Ibu Dewi Lestari' },
      tanggal_lokasi: { akad_tanggal: '2026-11-28T10:00', akad_lokasi: 'Masjid Al-Ikhlas', akad_alamat: 'Jl. Merdeka No. 17, Bandung', akad_maps: 'https://maps.google.com', resepsi_tanggal: '2026-11-28T12:00', resepsi_lokasi: 'Gedung Serbaguna Cahaya' },
      cerita: { cerita: 'Dari pertemuan sederhana, tumbuh sebuah cerita. Kini kami memulai babak baru bersama, dan ingin merayakannya dengan Anda.' },
      galeri: { foto: noPhoto ? [] : ['cover'] }, amplop_digital: { bank_1: 'BCA', rekening_1: '1234567890', atas_nama_1: 'Andi Pratama' },
    },
  };
  if (q.view === 'thumbnail') return <main style={{ position: 'relative', width: 260, height: 390 }}><TemplateThumb theme={view.layout.theme} coverLayouts={view.layout.coverLayouts} phone /></main>;
  return <main style={{ ...dimensions, position: 'relative' }}><InvitationView view={view} mode="preview" placeholders embedded gate={q.view === 'cover' ? 'skip' : 'show'} /></main>;
}
