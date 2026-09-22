// Tata letak halaman pertama (sampul) yang bisa dipilih pembeli Standard & Premium. Gambar tiap layout ada di
// web (apps/web/src/components/invitation/cover.tsx); di sini hanya daftar id dan aturan ketersediaannya.
// Basic tidak punya pilihan (sampul bawaan: ornamen, atau foto penuh bila foto sampul diunggah).
import type { TemplateTier } from '../generated/prisma/client.js';

// Tersedia untuk Standard dan Premium.
export const GENERIC_COVERS = ['ornamen', 'penuh', 'penuh-atas', 'bingkai', 'jendela', 'medali', 'terbagi', 'berdua', 'bingkai-penuh'] as const;
// Khusus tema, hanya Premium.
export const THEME_COVERS = ['gapura', 'hati', 'portal', 'kristal', 'karakter', 'poster'] as const;

export const COVER_KINDS: string[] = [...GENERIC_COVERS, ...THEME_COVERS];
export type ThemeCover = (typeof THEME_COVERS)[number];

// Layout khusus tema per desain (id desain = theme.motif). Desain yang tidak tercantum hanya punya layout umum.
export const THEME_COVER_BY_DESIGN: Record<string, ThemeCover> = {
  // gapura / gerbang berukir
  jawa: 'gapura', minang: 'gapura', batak: 'gapura', bali: 'gapura', islami: 'gapura', lebaran: 'gapura', kristiani: 'gapura', buddha: 'gapura', imlek: 'gapura',
  // foto berbentuk hati
  valentine: 'hati', floral: 'hati', 'sakura-anime': 'hati',
  // portal bercincin
  sihir: 'portal', galaksi: 'portal', halloween: 'portal',
  // kristal es
  'kerajaan-es': 'kristal', salju: 'kristal', natal: 'kristal',
  // pemilihan karakter (game)
  pixel: 'karakter', 'player-one': 'karakter', rpg: 'karakter', neon: 'karakter',
  // poster film
  hollywood: 'poster', paris: 'poster', elegant: 'poster',
};

// Daftar layout yang boleh dipilih untuk paket dan tema ini (kosong = tanpa pilihan, khusus Basic).
export function availableCoverLayouts(tier: TemplateTier, motif: string): string[] {
  if (tier === 'BASIC') return [];
  const special = tier === 'PREMIUM' ? THEME_COVER_BY_DESIGN[motif] : undefined;
  return special ? [...GENERIC_COVERS, special] : [...GENERIC_COVERS];
}
