import { apiFetch } from './api';
import { GATE_LABEL } from './types';
import type { AddOn, DesignInfo, FxLevel, Palette, Template, TemplateDetail, ThemeGroup, Tier } from './types';

export const TIER_LABEL: Record<Tier, string> = { BASIC: 'Basic', STANDARD: 'Standard', PREMIUM: 'Premium' };

// Urutan & nama grup tema (sama dengan apps/api/src/templates/themes.ts).
export const GROUP_ORDER: ThemeGroup[] = ['klasik', 'suku', 'agama', 'perayaan', 'kartun', 'game', 'film', 'musim'];
export const GROUP_LABEL: Record<ThemeGroup, string> = {
  klasik: 'Klasik',
  suku: 'Suku & Budaya',
  agama: 'Religi',
  perayaan: 'Perayaan',
  kartun: 'Kartun',
  game: 'Video Game',
  film: 'Film',
  musim: 'Musim',
};
export const FX_LABEL: Record<FxLevel, string> = { none: 'Tanpa animasi', standard: 'Animasi standar', premium: 'Animasi penuh' };

export interface DesignEntry {
  key: string;
  design: DesignInfo | null;
  name: string;
  group: string;
  palettes: Palette[];
  // Baris template per paket (termurah dulu). Satu desain bisa dipakai di beberapa paket.
  rows: Template[];
}

// Mengelompokkan baris template (desain x paket) menjadi satu entri per desain untuk katalog.
export function groupByDesign(all: Template[]): DesignEntry[] {
  const map = new Map<string, DesignEntry>();
  for (const t of all) {
    const key = t.design?.id ?? t.id;
    let entry = map.get(key);
    if (!entry) {
      entry = { key, design: t.design, name: t.design?.name ?? t.name, group: t.design?.group ?? t.category, palettes: t.layout.palettes ?? [], rows: [] };
      map.set(key, entry);
    }
    entry.rows.push(t);
  }
  const groupRank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g as ThemeGroup);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  return [...map.values()]
    .map((e) => ({ ...e, rows: e.rows.sort((a, b) => a.price - b.price) }))
    .sort((a, b) => groupRank(a.group) - groupRank(b.group));
}

export const getTemplates = (query: { category?: string; tier?: string } = {}) => {
  const q = new URLSearchParams();
  if (query.category) q.set('category', query.category);
  if (query.tier) q.set('tier', query.tier);
  return apiFetch<Template[]>(`/templates${q.size ? `?${q}` : ''}`);
};

export const getTemplate = (id: string) => apiFetch<TemplateDetail>(`/templates/${id}`);
// Foto contoh untuk demo (peta slot -> URL). Gagal/kosong = demo memakai kotak placeholder.
export const getDemoPhotos = () => apiFetch<Record<string, string>>('/demo-photos').catch(() => ({}) as Record<string, string>);
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
  const tracks = layout.musik.count ?? layout.musik.presets.length;
  if (layout.musik.allowed) features.push(tracks > 1 ? `Musik latar (${tracks} pilihan lagu)` : 'Musik latar');
  if (layout.theme.fx !== 'none') features.push(FX_LABEL[layout.theme.fx]);
  if (layout.theme.gate && layout.theme.gate !== 'none') features.push(`Gerbang pembuka: ${GATE_LABEL[layout.theme.gate]}`);
  if ((layout.palettes?.length ?? 0) > 1) features.push(`${layout.palettes.length} pilihan warna`);
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
