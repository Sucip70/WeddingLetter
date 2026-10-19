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

/** Bingkai kartu diiris (border-image): slice [atas, kanan, bawah, kiri] dalam piksel aset; mahkota = penanda di tepi atas (rasio terhadap lebar kartu). */
export interface RasterSlicedCard {
  kind: 'sliced';
  imgW: number;
  slice: [number, number, number, number];
  crown?: { w: number; top: number; y: string };
  pad: { t: number; x: number; b: number };
  /** Lebar kartu dalam cqw lebar bagian (README aset: 74-84% lebar layar). */
  w: number;
}

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
  card: { kind: 'panel' } | RasterSlicedCard;
  /** Lebar relief sudut di sampul 'ornamen' (cqw); bawaan 25. */
  cornerW?: number;
  /** Lebar bingkai foto di sampul "bingkai" (cqw); bawaan 71. */
  mountW?: number;
  /** Warna tepi tipis tombol/kartu sebagai "r, g, b" (emas tua, atau tembaga untuk Batak: palet tidak boleh jadi emas terang). */
  edgeRgb: string;
  /** Sampul memakai coverBackground (satu gambar utuh, ukuran cover) alih-alih ubin halaman. */
  coverPaper?: boolean;
  /** Variabel CSS tambahan khusus tema (mis. halaman gelap: judul/nama terang, tombol emas, teks kartu gelap). */
  vars?: Record<string, string>;
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
    edgeRgb: '170, 125, 56',
  },
  'pusako-minang': {
    id: 'pusako-minang',
    maroon: '#681813', gold: '#8c6224', ink: '#211712', sogan: '#4a2f1d', cardBg: '#f5ead2',
    display: 'var(--font-playfair), Georgia, serif',
    hole: { l: 5.6, t: 4.8, w: 88.8, h: 89.9 },
    mountAspect: '892 / 1413',
    markerCover: '38cqw', markerQuote: { w: '72px', h: '40px' }, markerFoot: '5.6rem',
    card: { kind: 'sliced', imgW: 896, slice: [135, 135, 135, 135], crown: { w: 0.4, top: -0.105, y: '-50%' }, pad: { t: 0.025, x: 0, b: 0.02 }, w: 92 },
    edgeRgb: '170, 125, 56',
  },
  // Hong Xi: halaman merah tua, jadi teks halaman terang (ink/sogan = terang) dan teks di dalam kartu gading gelap (--sk-card-ink).
  'hong-xi': {
    id: 'hong-xi',
    maroon: '#a3151f', gold: '#8a6326', ink: '#f8ecd0', sogan: '#e8c982', cardBg: '#f8f0dc',
    display: 'var(--font-playfair), Georgia, serif',
    hole: { l: 4.1, t: 3.2, w: 91.7, h: 94.1 },
    mountAspect: '926 / 1243',
    markerCover: '30cqw', markerQuote: { w: '34px', h: '34px' }, markerFoot: '4rem',
    card: { kind: 'sliced', imgW: 897, slice: [90, 90, 90, 90], pad: { t: 0.12, x: 0.08, b: 0.1 }, w: 90 },
    edgeRgb: '228, 190, 108',
    cornerW: 100,
    mountW: 62,
    coverPaper: true,
    vars: {
      '--sk-title': '#f6dfa3', '--sk-name': '#f8ecd0', '--sk-label': '#e8c982', '--sk-quote': '#f8ecd0',
      '--sk-btn-bg': '#e2b45a', '--sk-btn-fg': '#5a0b12', '--sk-card-ink': '#3a1a16', '--sk-card-label': '#8a6326',
      '--sk-copy-x': '22cqw', '--sk-corner-br-w': '74cqw', '--sk-corner-br-right': '13cqw', '--sk-o-bottom': '21cqh', '--sk-name-size': 'clamp(28px,8.6cqw,36px)',
    },
  },
  'noor-e-nikah': {
    id: 'noor-e-nikah',
    maroon: '#063f32', gold: '#8a5f1c', ink: '#28231f', sogan: '#0a4a38', cardBg: '#f6ecd4',
    display: 'var(--font-cormorant), Georgia, serif',
    hole: { l: 7.3, t: 3.4, w: 85.3, h: 92.3 },
    mountAspect: '1024 / 1462',
    markerCover: '14cqw', markerQuote: { w: '30px', h: '30px' }, markerFoot: '3rem',
    card: { kind: 'sliced', imgW: 946, slice: [330, 90, 90, 90], pad: { t: 0.27, x: 0.14, b: 0.1 }, w: 88 },
    edgeRgb: '185, 138, 56',
    cornerW: 100,
    mountW: 66,
    coverPaper: true,
    vars: { '--sk-o-bottom': '24cqh', '--sk-t-top': '40cqh', '--sk-countdown-bg': '#063f32' },
  },
  'pawiwahan-agung': {
    id: 'pawiwahan-agung',
    maroon: '#873e32', gold: '#8a6326', ink: '#332923', sogan: '#5a3a2b', cardBg: '#f2e7d0',
    display: 'var(--font-cormorant), Georgia, serif',
    hole: { l: 6.9, t: 4.2, w: 86.1, h: 91.5 },
    mountAspect: '872 / 1263',
    markerCover: '12cqw', markerQuote: { w: '30px', h: '30px' }, markerFoot: '2.6rem',
    card: { kind: 'sliced', imgW: 858, slice: [120, 120, 120, 120], crown: { w: 0.1, top: 0.085, y: '-50%' }, pad: { t: 0.17, x: 0.03, b: 0.06 }, w: 90 },
    edgeRgb: '167, 122, 56',
  },
  'horas-nauli': {
    id: 'horas-nauli',
    maroon: '#8b211c', gold: '#8c5a3d', ink: '#151313', sogan: '#3a2a22', cardBg: '#efe6d2',
    display: 'var(--font-libre), Georgia, serif',
    hole: { l: 2.8, t: 10, w: 94.4, h: 76.4 },
    mountAspect: '901 / 1372',
    markerCover: '24cqw', markerQuote: { w: '40px', h: '40px' }, markerFoot: '4rem',
    card: { kind: 'sliced', imgW: 917, slice: [165, 0, 155, 0], crown: { w: 0.22, top: 0.065, y: '-50%' }, pad: { t: 0.2, x: 0.12, b: 0.04 }, w: 86 },
    edgeRgb: '140, 90, 61',
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
  vars['--sk-edge-rgb'] = t.edgeRgb;
  if (t.vars) Object.assign(vars, t.vars);
  if (t.mountW) vars['--sk-b-w'] = `${t.mountW}cqw`;
  if (t.cornerW) vars['--sk-corner-w'] = `${t.cornerW}cqw`;
  if (t.card.kind === 'sliced') {
    const [st, sr, sb, sl] = t.card.slice;
    vars['--sk-slice'] = t.card.slice.join(' ');
    vars['--sk-bt'] = String(st / t.card.imgW);
    vars['--sk-br'] = String(sr / t.card.imgW);
    vars['--sk-bb'] = String(sb / t.card.imgW);
    vars['--sk-bl'] = String(sl / t.card.imgW);
    if (t.card.crown) {
      vars['--sk-crown-w'] = String(t.card.crown.w);
      vars['--sk-crown-top'] = String(t.card.crown.top);
      vars['--sk-crown-y'] = t.card.crown.y;
    }
    vars['--sk-card-pt'] = String(t.card.pad.t);
    vars['--sk-card-px'] = String(t.card.pad.x);
    vars['--sk-card-pb'] = String(t.card.pad.b);
    vars['--sk-card-w'] = String(t.card.w);
  }
  return vars as CSSProperties;
}
