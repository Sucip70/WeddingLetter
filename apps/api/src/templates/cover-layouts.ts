// Tata letak halaman pertama (sampul) yang bisa dipilih pembeli Standard & Premium. Gambar tiap layout ada di
// web (apps/web/src/components/invitation/cover.tsx); di sini hanya daftar id dan aturan ketersediaannya.
// Basic tidak punya pilihan (sampul bawaan: ornamen, atau foto penuh bila foto sampul diunggah).
import type { TemplateTier } from '../generated/prisma/client.js';

// Tersedia untuk Standard dan Premium.
export const GENERIC_COVERS = ['ornamen', 'penuh', 'penuh-atas', 'bingkai', 'medali', 'terbagi', 'berdua', 'bingkai-penuh'] as const;
// Khusus tema, hanya Premium.
export const THEME_COVERS = ['emas', 'bunga', 'orbit', 'menara'] as const;

export const COVER_KINDS: string[] = [...GENERIC_COVERS, ...THEME_COVERS];
export type ThemeCover = (typeof THEME_COVERS)[number];

// Layout khusus tema per desain (id desain = theme.motif). Desain yang tidak tercantum hanya punya layout umum.
export const THEME_COVER_BY_DESIGN: Record<string, ThemeCover> = {
  galaksi: 'orbit', sihir: 'menara',
  elegant: 'emas',
  buket: 'bunga',
};

// Layout khusus tema yang juga tersedia di Standard (sisanya hanya Premium).
export const STANDARD_THEME_COVERS: readonly string[] = ['emas', 'bunga'];
// Desain beraset raster (Sekar Keraton, Pusako Minang) hanya menawarkan empat tata letak sampul rancangan sendiri;
// tata letak generik lain tidak dipasang karena tidak selaras dengan aset hasil lukisan.
export const RASTER_DESIGN_COVERS = ['ornamen', 'bingkai', 'berdua', 'terbagi'] as const;
export const RASTER_DESIGN_IDS: readonly string[] = ['jawa-sekar-keraton', 'pusako-minang', 'horas-nauli', 'pawiwahan-agung', 'hong-xi', 'noor-e-nikah'];

// Daftar layout yang boleh dipilih untuk paket dan tema ini (kosong = tanpa pilihan, khusus Basic).
export function availableCoverLayouts(tier: TemplateTier, motif: string): string[] {
  if (tier === 'BASIC') return [];
  if (RASTER_DESIGN_IDS.includes(motif)) return [...RASTER_DESIGN_COVERS];
  const themed = THEME_COVER_BY_DESIGN[motif];
  const special = tier === 'PREMIUM' || (tier === 'STANDARD' && themed && STANDARD_THEME_COVERS.includes(themed)) ? themed : undefined;
  return special ? [...GENERIC_COVERS, special] : [...GENERIC_COVERS];
}
