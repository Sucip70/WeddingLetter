import { apiFetch } from './api';
import type { AddOn, Template, TemplateDetail, Tier } from './types';

export const TIER_LABEL: Record<Tier, string> = { BASIC: 'Basic', STANDARD: 'Standard', PREMIUM: 'Premium' };

export const getTemplates = (query: { category?: string; tier?: string } = {}) => {
  const q = new URLSearchParams();
  if (query.category) q.set('category', query.category);
  if (query.tier) q.set('tier', query.tier);
  return apiFetch<Template[]>(`/templates${q.size ? `?${q}` : ''}`);
};

export const getTemplate = (id: string) => apiFetch<TemplateDetail>(`/templates/${id}`);
export const getAddOns = () => apiFetch<AddOn[]>('/pricing/add-ons');

const SECTION_LABEL: Record<string, string> = {
  cerita: 'Cerita kami',
  countdown: 'Hitung mundur',
  rsvp: 'RSVP online',
  amplop_digital: 'Amplop digital',
  buku_tamu: 'Buku tamu',
};

// Ringkasan fitur template untuk kartu & halaman detail.
export function templateFeatures(t: Pick<Template, 'layout' | 'includedWeeks'>) {
  const { layout } = t;
  const ids = layout.sections.map((s) => s.id);
  const features: string[] = [];
  if (ids.includes('galeri')) features.push(`Galeri ${layout.galeri.maxPhotos} foto${layout.galeri.maxVideos ? ` + ${layout.galeri.maxVideos} video` : ''}`);
  if (layout.musik.allowed) features.push('Musik latar');
  for (const id of ['rsvp', 'amplop_digital', 'buku_tamu', 'countdown', 'cerita']) if (ids.includes(id)) features.push(SECTION_LABEL[id]!);
  features.push(`Masa aktif ${t.includedWeeks} minggu`);
  return features;
}

// Deskripsi add-on untuk halaman harga.
export const ADDON_DESC: Record<string, string> = {
  PHOTO_PACK_5: 'Foto galeri di atas kuota template, per paket 5 foto (maks. 5 MB per foto).',
  CUSTOM_SONG: 'Unggah lagu pilihan Anda sendiri (maks. 8 MB, 1 lagu).',
  RSVP_ONLINE: 'Tamu bisa konfirmasi hadir langsung dari undangan. Gratis di template yang sudah menyertakannya.',
  DIGITAL_ENVELOPE: 'Rekening / e-wallet untuk tanda kasih digital. Gratis di template Premium.',
  CUSTOM_DOMAIN: 'Link undangan pendek pilihan Anda, mis. weddingletter.id/u/andi-sinta.',
  TRANSLATION_EN: 'Tombol ganti bahasa Indonesia ↔ Inggris di halaman undangan.',
  MEDIA_RENTAL_WEEK: 'Video & foto besar dihitung seperti sewa penyimpanan: ukuran (MB) × lama tayang (minggu) × tarif.',
  EXTEND_ACTIVE_WEEK: 'Perpanjang masa aktif undangan per minggu, kapan saja sebelum data dihapus (masa tenggang 30 hari).',
};
