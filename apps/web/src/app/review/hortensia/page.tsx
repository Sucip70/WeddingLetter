import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import { TemplateThumb } from '@/components/template-thumb';
import { COVER_LAYOUTS, isCoverKind } from '@/lib/cover-layouts';
import type { InvitationViewData } from '@/lib/types';
import sample from '@/components/invitation/assets/hortensia-sample.webp';

export const metadata = { title: 'Hortensia Turquoise — Atelier Review', robots: { index: false, follow: false } };
export default async function Review({ searchParams }: { searchParams: Promise<{ size?: string; long?: string; photo?: string; kind?: string; tier?: string; view?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const q = await searchParams, long = q.long === 'true', noPhoto = q.photo === 'none';
  const kind = isCoverKind(q.kind) ? q.kind : 'bingkai';
  const dimensions = q.size === 'short' ? { width: 320, height: 520 } : q.size === 'tall' ? { width: 440, height: 956 } : { width: 390, height: 700 };
  const view: InvitationViewData = {
    slug: 'hortensia-review', features: {}, media: noPhoto ? {} : { cover: { url: q.photo === 'broken' ? '/missing-hortensia-review.webp' : sample.src, type: 'image/webp' } }, rsvpEnabled: true, guestbook: [{ name: 'Budi & Keluarga', message: 'Selamat menempuh hidup baru! Semoga bahagia selalu.', attending: true, createdAt: '2026-11-11T10:00:00Z' }],
    layout: { theme: { preset: 'hortensia', motif: 'hortensia', gate: q.tier === 'standard' ? 'none' : 'sakura', fx: q.tier === 'standard' ? 'standard' : 'premium', primary: '#0f7a8c', secondary: '#6fd4e0', background: '#f4fbfc', text: '#0f2f3a', headingFont: 'serif', bodyFont: 'source' }, sections: ['cover', 'mempelai', 'tanggal_lokasi', 'cerita', 'countdown', 'galeri', 'rsvp', 'amplop_digital', 'buku_tamu'].map(id => ({ id, title: id, fields: [] })), musik: { presets: [] }, coverLayouts: Object.keys(COVER_LAYOUTS) },
    data: {
      cover: { tata_letak: kind, foto: noPhoto ? '' : 'cover' },
      mempelai: { pria_nama: long ? 'Alexandra Putri' : 'Andi', wanita_nama: long ? 'Muhammad Rasyid' : 'Sinta', pria_ortu: 'Putra dari Bapak Hendra Wijaya & Ibu Ratna Sari', wanita_ortu: 'Putri dari Bapak Agus Salim & Ibu Dewi Lestari' },
      tanggal_lokasi: { akad_tanggal: '2026-11-28T10:00', akad_lokasi: 'Masjid Al-Ikhlas', akad_alamat: 'Jl. Merdeka No. 17, Bandung', akad_maps: 'https://maps.google.com', resepsi_tanggal: '2026-11-28T12:00', resepsi_lokasi: 'Gedung Serbaguna Cahaya' },
      cerita: { cerita: 'Dari sebuah percakapan, tumbuhlah rasa. Kini kami memilih untuk melanjutkan perjalanan bersama, dan ingin membagikan kebahagiaan ini dengan Anda.' },
      galeri: { foto: noPhoto ? [] : ['cover'] }, amplop_digital: { bank_1: 'BCA', rekening_1: '1234567890', atas_nama_1: 'Andi Pratama' },
    },
  };
  if (q.view === 'thumbnail') return <main style={{ position: 'relative', width: 260, height: 390 }}><TemplateThumb theme={view.layout.theme} coverLayouts={view.layout.coverLayouts} phone /></main>;
  return <main style={{ ...dimensions, position: 'relative' }}><InvitationView view={view} mode="preview" placeholders embedded gate={q.view === 'cover' ? 'skip' : 'show'} /></main>;
}
