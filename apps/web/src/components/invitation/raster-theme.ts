import type { CSSProperties } from 'react';
import type { ArtworkManifest, ArtworkSlot } from '@/lib/types';

export function rasterAsset(artwork: ArtworkManifest, slot: ArtworkSlot) {
  const layer = artwork.assets[slot];
  return layer?.mobile?.url ?? layer?.default?.url ?? layer?.desktop?.url;
}

/* Desain beraset raster (hasil lukisan The Artist, bukan SVG/CSS): Sekar Keraton (Jawa) dan Pusako Minang (Minangkabau).
   Keduanya memakai satu sistem tampilan (raster-cover / raster-sections / globals.css `.wl-raster`); yang berbeda hanyalah
   warna, huruf, geometri aset (lubang pigura foto, bentuk bingkai kartu, penanda) yang dicatat di sini dan disalurkan
   sebagai variabel CSS `--sk-*`. Menambah desain raster baru = tambah satu entri di sini + manifest di API (artwork.ts). */

export interface RasterTheme {
  id: string;
  /** Warna tinta: marun (tombol, nama), emas tua (label kecil), tinta teks. */
  maroon: string;
  gold: string;
  ink: string;
  sogan: string;
  /** Warna kartu sederhana (kotak salin rekening, buku tamu) bila tema tidak punya panel kertas. */
  cardBg: string;
  /** Huruf judul/nama (variabel font di layout.tsx). */
  display: string;
  /** Lubang foto pada pigura (persen dari aset yang sudah dipangkas) dan rasio aset; foto dipasang sedikit melebihi lubang. */
  hole: { l: number; t: number; w: number; h: number };
  mountAspect: string;
  /** Lebar penanda (kayon/gonjong) di sampul 'ornamen' (cqw), di kutipan (px), dan di penutup (rem). */
  markerCover: string;
  markerQuote: { w: string; h: string };
  markerFoot: string;
  /**
   * Bentuk kartu informasi:
   *  - 'panel'  : panel kertas + bingkai kayu terpisah, rasio aset = tinggi minimum (Sekar Keraton).
   *  - 'sliced' : satu bingkai diiris 9 (border-image) sehingga sudut tetap berproporsi pada tinggi berapa pun; penanda
   *               dipasang sebagai mahkota di tepi atas (Pusako Minang).
   */
  card: { kind: 'panel' } | { kind: 'sliced'; slice: number; imgW: number };
}

export const RASTER_THEMES: Record<string, RasterTheme> = {
  'jawa-sekar-keraton': {
    id: 'jawa-sekar-keraton',
    maroon: '#68252a', gold: '#8a6326', ink: '#3a291e', sogan: '#74401f', cardBg: '#f0dfbd',
    display: 'var(--font-libre), Georgia, serif',
    hole: { l: 12.4, t: 8.4, w: 75.2, h: 82.8 },
    mountAspect: '1014 / 1496',
    markerCover: '27cqw', markerQuote: { w: '34px', h: '60px' }, markerFoot: '3.9rem',
    card: { kind: 'panel' },
  },
  'pusako-minang': {
    id: 'pusako-minang',
    maroon: '#681813', gold: '#8c6224', ink: '#211712', sogan: '#4a2f1d', cardBg: '#f5ead2',
    display: 'var(--font-playfair), Georgia, serif',
    hole: { l: 5.6, t: 4.8, w: 88.8, h: 89.9 },
    mountAspect: '892 / 1413',
    markerCover: '38cqw', markerQuote: { w: '72px', h: '40px' }, markerFoot: '5.6rem',
    card: { kind: 'sliced', slice: 135, imgW: 896 },
  },
};

export const isRasterDesign = (designId: string | undefined): boolean => !!designId && designId in RASTER_THEMES;
export const rasterTheme = (designId: string | undefined): RasterTheme | undefined => (designId ? RASTER_THEMES[designId] : undefined);

/** Variabel CSS tema (warna, huruf, geometri) untuk akar undangan dan wadah sampul. */
export function rasterThemeVars(designId: string | undefined): CSSProperties {
  const t = rasterTheme(designId);
  if (!t) return {};
  const vars: Record<string, string> = {
    '--sk-maroon': t.maroon,
    '--sk-gold-d': t.gold,
    '--sk-ink': t.ink,
    '--sk-sogan': t.sogan,
    '--sk-card-bg': t.cardBg,
    '--sk-display': t.display,
    '--sk-hole-l': `${t.hole.l}%`,
    '--sk-hole-t': `${t.hole.t}%`,
    '--sk-hole-w': `${t.hole.w}%`,
    '--sk-hole-h': `${t.hole.h}%`,
    '--sk-mount-ar': t.mountAspect,
    '--sk-marker-w': t.markerCover,
    '--sk-quote-w': t.markerQuote.w,
    '--sk-quote-h': t.markerQuote.h,
    '--sk-foot-w': t.markerFoot,
  };
  if (t.card.kind === 'sliced') {
    vars['--sk-slice'] = String(t.card.slice);
    vars['--sk-slice-r'] = String(t.card.slice / t.card.imgW);
  }
  return vars as CSSProperties;
}
