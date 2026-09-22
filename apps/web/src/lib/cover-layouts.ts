// Tata letak sampul (halaman pertama undangan). Daftar id & aturan ketersediaan sama dengan
// apps/api/src/templates/cover-layouts.ts (jaga tetap sinkron); gambarnya ada di components/invitation/cover.tsx.
import type { Tier } from './types';

export type CoverKind =
  | 'ornamen' | 'penuh' | 'penuh-atas' | 'bingkai' | 'jendela' | 'medali' | 'terbagi' | 'berdua' | 'bingkai-penuh'
  | 'gapura' | 'hati' | 'portal' | 'kristal' | 'karakter' | 'poster';

// Foto yang dibutuhkan: none = tanpa foto; cover = foto sampul; couple = foto mempelai (atau foto sampul).
export type CoverNeeds = 'none' | 'cover' | 'couple';

export const COVER_LAYOUTS: Record<CoverKind, { label: string; hint: string; needs: CoverNeeds; themed?: boolean }> = {
  ornamen: { label: 'Ornamen', hint: 'Tanpa foto: hiasan dan pola tema.', needs: 'none' },
  penuh: { label: 'Foto penuh', hint: 'Foto memenuhi layar, tulisan di bagian bawah.', needs: 'cover' },
  'penuh-atas': { label: 'Foto penuh, nama di atas', hint: 'Foto memenuhi layar, nama di atas dan tombol di bawah.', needs: 'cover' },
  bingkai: { label: 'Foto berbingkai', hint: 'Foto kecil berbingkai di tengah, ornamen tema tetap terlihat.', needs: 'cover' },
  jendela: { label: 'Jendela', hint: 'Foto di dalam jendela lengkung.', needs: 'cover' },
  medali: { label: 'Medali bulat', hint: 'Foto bulat dengan lingkaran hiasan.', needs: 'cover' },
  terbagi: { label: 'Terbagi', hint: 'Foto di atas yang memudar, kartu bertulisan di bawah.', needs: 'cover' },
  berdua: { label: 'Berdua', hint: 'Foto mempelai pria dan wanita berdampingan.', needs: 'couple' },
  'bingkai-penuh': { label: 'Bingkai penuh', hint: 'Foto memenuhi layar dengan garis bingkai di dalam tepi.', needs: 'cover' },
  gapura: { label: 'Gapura', hint: 'Foto di dalam gapura berukir.', needs: 'cover', themed: true },
  hati: { label: 'Hati', hint: 'Foto berbentuk hati.', needs: 'cover', themed: true },
  portal: { label: 'Portal', hint: 'Foto di dalam portal bercincin yang berputar.', needs: 'cover', themed: true },
  kristal: { label: 'Kristal', hint: 'Foto di dalam kristal es.', needs: 'cover', themed: true },
  karakter: { label: 'Pilih karakter', hint: 'Dua kartu karakter bergaya game.', needs: 'couple', themed: true },
  poster: { label: 'Poster film', hint: 'Poster dengan judul dan kredit.', needs: 'cover', themed: true },
};

const GENERIC: CoverKind[] = ['ornamen', 'penuh', 'penuh-atas', 'bingkai', 'jendela', 'medali', 'terbagi', 'berdua', 'bingkai-penuh'];
const THEME_BY_DESIGN: Record<string, CoverKind> = {
  jawa: 'gapura', minang: 'gapura', batak: 'gapura', bali: 'gapura', islami: 'gapura', lebaran: 'gapura', kristiani: 'gapura', buddha: 'gapura', imlek: 'gapura',
  valentine: 'hati', floral: 'hati', 'sakura-anime': 'hati',
  sihir: 'portal', galaksi: 'portal', halloween: 'portal',
  'kerajaan-es': 'kristal', salju: 'kristal', natal: 'kristal',
  pixel: 'karakter', 'player-one': 'karakter', rpg: 'karakter', neon: 'karakter',
  hollywood: 'poster', paris: 'poster', elegant: 'poster',
};

// Untuk pratinjau di builder (paket & tema belum tersimpan). Undangan sungguhan memakai daftar dari API.
export function coverLayoutsFor(tier: Tier, motif: string): CoverKind[] {
  if (tier === 'BASIC') return [];
  const special = tier === 'PREMIUM' ? THEME_BY_DESIGN[motif] : undefined;
  return special ? [...GENERIC, special] : [...GENERIC];
}

export const isCoverKind = (v: unknown): v is CoverKind => typeof v === 'string' && v in COVER_LAYOUTS;

// Layout awal untuk template ini: layout khusus tema bila ada, kalau tidak "Foto berbingkai".
export function defaultCoverLayout(available: string[]): CoverKind {
  const themed = available.find((k) => isCoverKind(k) && COVER_LAYOUTS[k].themed);
  return (themed as CoverKind | undefined) ?? 'bingkai';
}

// Layout yang benar-benar dipakai bila foto yang dibutuhkan belum ada: kembali ke Ornamen.
export function resolveCover(kind: CoverKind, photos: { cover?: string; groom?: string; bride?: string }): CoverKind {
  const needs = COVER_LAYOUTS[kind].needs;
  if (needs === 'cover') return photos.cover ? kind : 'ornamen';
  if (needs === 'couple') return photos.groom || photos.bride || photos.cover ? kind : 'ornamen';
  return kind;
}
