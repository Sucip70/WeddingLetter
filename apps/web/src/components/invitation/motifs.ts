// Paket motif visual per desain (kunci = theme.motif = id desain di apps/api/src/templates/themes.ts).
// Tema kartun / game / film hanya terinspirasi GAYA UMUM: tidak ada karakter, logo, atau nama berhak cipta.
import type { BodyFont, HeadingFont } from '@/lib/types';
import type { OrnamentKind } from './ornaments';

export type ParticleKind = 'petal' | 'leaf' | 'maple' | 'snow' | 'heart' | 'star' | 'sparkle' | 'confetti' | 'bubble' | 'firefly' | 'pixel' | 'lantern' | 'bat' | 'coin';
export type ParticleMode = 'fall' | 'rise' | 'twinkle' | 'drift';
export type PatternKind = 'none' | 'dots' | 'kawung' | 'zigzag' | 'diamond' | 'scallop' | 'grid' | 'stars' | 'star8' | 'hearts' | 'leaves' | 'stripes' | 'cross';
export type FrameKind = 'arch' | 'oval' | 'round' | 'square' | 'diamond' | 'pixel' | 'polaroid' | 'hex' | 'notch';
export type CountdownKind = 'soft' | 'outline' | 'pixel' | 'neon' | 'ticket' | 'round' | 'flip';
export type CoverFxKind = 'none' | 'aurora' | 'rays' | 'curtain' | 'scanlines' | 'spotlight' | 'clouds';
export type RevealKind = 'rise' | 'zoom' | 'blur' | 'slide';
export type Radius = 'soft' | 'mid' | 'sharp' | 'pill';

export interface Motif {
  ornament: OrnamentKind;
  pattern: PatternKind;
  frame: FrameKind;
  countdown: CountdownKind;
  cover: CoverFxKind;
  particles: { kind: ParticleKind; count: number; mode: ParticleMode };
  radius: Radius;
  reveal: RevealKind;
  // Teks pengganti (hanya bahasa Indonesia): kalimat di atas nama & tombol buka.
  copy?: { kicker?: string; open?: string };
}

const m = (
  ornament: OrnamentKind,
  pattern: PatternKind,
  frame: FrameKind,
  countdown: CountdownKind,
  cover: CoverFxKind,
  particles: [ParticleKind, number, ParticleMode],
  radius: Radius = 'soft',
  reveal: RevealKind = 'rise',
  copy?: Motif['copy'],
): Motif => ({ ornament, pattern, frame, countdown, cover, particles: { kind: particles[0], count: particles[1], mode: particles[2] }, radius, reveal, copy });

export const MOTIFS: Record<string, Motif> = {
  // Klasik
  rustic: m('vine', 'none', 'arch', 'soft', 'none', ['leaf', 10, 'fall']),
  floral: m('vine', 'leaves', 'oval', 'soft', 'none', ['petal', 14, 'fall']),
  elegant: m('sparkle', 'diamond', 'arch', 'outline', 'rays', ['sparkle', 16, 'twinkle'], 'mid'),

  // Suku & budaya
  jawa: m('geo', 'kawung', 'oval', 'ticket', 'none', ['petal', 10, 'fall'], 'mid'),
  sunda: m('vine', 'leaves', 'round', 'round', 'clouds', ['leaf', 12, 'fall']),
  minang: m('geo', 'diamond', 'notch', 'ticket', 'rays', ['sparkle', 10, 'twinkle'], 'mid'),
  batak: m('geo', 'zigzag', 'square', 'outline', 'none', ['star', 8, 'twinkle'], 'sharp'),
  bali: m('lotus', 'leaves', 'arch', 'soft', 'rays', ['petal', 14, 'fall']),

  // Religi
  islami: m('star8', 'star8', 'arch', 'outline', 'spotlight', ['star', 14, 'twinkle'], 'mid'),
  kristiani: m('vine', 'cross', 'arch', 'soft', 'rays', ['sparkle', 12, 'twinkle']),
  buddha: m('lotus', 'scallop', 'round', 'round', 'aurora', ['lantern', 8, 'rise']),

  // Perayaan
  natal: m('snow', 'dots', 'round', 'soft', 'aurora', ['snow', 30, 'fall'], 'mid'),
  imlek: m('sparkle', 'diamond', 'notch', 'ticket', 'spotlight', ['lantern', 10, 'rise'], 'mid'),
  valentine: m('sparkle', 'hearts', 'round', 'round', 'aurora', ['heart', 16, 'rise'], 'pill'),
  kemerdekaan: m('geo', 'stripes', 'square', 'ticket', 'none', ['confetti', 22, 'fall'], 'sharp'),
  lebaran: m('star8', 'star8', 'arch', 'outline', 'spotlight', ['lantern', 8, 'rise'], 'mid'),
  tahunbaru: m('sparkle', 'stars', 'diamond', 'neon', 'spotlight', ['confetti', 26, 'fall'], 'mid', 'zoom'),
  halloween: m('sparkle', 'stars', 'notch', 'outline', 'aurora', ['bat', 10, 'drift'], 'mid', 'blur', { kicker: 'Malam Penuh Kejutan', open: 'Buka Peti Undangan' }),

  // Kartun (gaya umum)
  'kerajaan-es': m('snow', 'dots', 'diamond', 'outline', 'aurora', ['snow', 26, 'fall'], 'pill', 'blur'),
  ceria: m('sparkle', 'dots', 'round', 'round', 'clouds', ['bubble', 14, 'rise'], 'pill', 'zoom', { kicker: 'Petualangan Baru Dimulai', open: 'Ayo Mulai!' }),
  'sakura-anime': m('vine', 'dots', 'oval', 'soft', 'clouds', ['petal', 24, 'fall'], 'pill', 'blur', { kicker: 'Musim Bunga Kami' }),
  dongeng: m('sparkle', 'stars', 'arch', 'soft', 'curtain', ['sparkle', 16, 'twinkle'], 'pill', 'blur', { kicker: 'Alkisah, Sebuah Kisah Cinta', open: 'Buka Buku Dongeng' }),

  // Video game (gaya umum)
  pixel: m('geo', 'grid', 'pixel', 'pixel', 'scanlines', ['pixel', 14, 'rise'], 'sharp', 'zoom', { kicker: 'Press Start', open: 'Mulai Petualangan' }),
  'player-one': m('geo', 'grid', 'notch', 'pixel', 'scanlines', ['star', 14, 'twinkle'], 'sharp', 'zoom', { kicker: 'Player 1 & Player 2', open: 'Mulai Permainan' }),
  rpg: m('geo', 'diamond', 'notch', 'ticket', 'spotlight', ['coin', 10, 'rise'], 'sharp', 'slide', { kicker: 'Quest Terakhir', open: 'Terima Quest' }),
  neon: m('sparkle', 'grid', 'notch', 'neon', 'scanlines', ['sparkle', 18, 'twinkle'], 'sharp', 'zoom', { kicker: 'Insert Coin', open: 'Masuk Arena' }),

  // Film (gaya umum)
  hollywood: m('sparkle', 'diamond', 'square', 'flip', 'curtain', ['sparkle', 14, 'twinkle'], 'mid', 'zoom', { kicker: 'Now Showing', open: 'Tonton Sekarang' }),
  galaksi: m('sparkle', 'stars', 'round', 'neon', 'aurora', ['star', 30, 'twinkle'], 'soft', 'blur', { kicker: 'Misi Cinta di Antar Bintang', open: 'Luncurkan' }),
  sihir: m('sparkle', 'stars', 'arch', 'outline', 'spotlight', ['firefly', 18, 'drift'], 'soft', 'blur', { kicker: 'Surat dari Akademi Sihir', open: 'Buka Gulungan' }),
  paris: m('sparkle', 'stripes', 'oval', 'flip', 'rays', ['petal', 10, 'fall'], 'mid', 'rise', { kicker: 'Un Amour à Paris' }),

  // Musim
  semi: m('vine', 'leaves', 'oval', 'soft', 'clouds', ['petal', 18, 'fall']),
  panas: m('sparkle', 'dots', 'round', 'round', 'rays', ['bubble', 10, 'rise'], 'pill'),
  gugur: m('vine', 'leaves', 'arch', 'ticket', 'none', ['maple', 16, 'fall'], 'mid'),
  salju: m('snow', 'dots', 'arch', 'outline', 'aurora', ['snow', 28, 'fall'], 'mid', 'blur'),
};

export const motifFor = (id: string | undefined): Motif => MOTIFS[id ?? ''] ?? MOTIFS.rustic!;

// Sudut per gaya: kartu, tombol, foto galeri, sel hitung mundur, kolom isian.
export const RADIUS: Record<Radius, { card: string; button: string; photo: string; cell: string; field: string }> = {
  soft: { card: '24px', button: '999px', photo: '12px', cell: '16px', field: '12px' },
  pill: { card: '32px', button: '999px', photo: '22px', cell: '24px', field: '16px' },
  mid: { card: '10px', button: '8px', photo: '8px', cell: '8px', field: '8px' },
  sharp: { card: '0px', button: '0px', photo: '0px', cell: '0px', field: '0px' },
};

export const HEADING: Record<HeadingFont, { family: string; size: string; section: string; weight: number; tracking?: string; upper?: boolean }> = {
  script: { family: 'var(--font-script)', size: '4rem', section: '2.3rem', weight: 400 },
  serif: { family: 'var(--font-cormorant)', size: '3rem', section: '2.3rem', weight: 600 },
  sans: { family: 'var(--font-jakarta)', size: '2.6rem', section: '2rem', weight: 700 },
  display: { family: 'var(--font-fraunces)', size: '2.7rem', section: '2.1rem', weight: 600 },
  cinzel: { family: 'var(--font-cinzel)', size: '2.3rem', section: '1.8rem', weight: 700, tracking: '0.04em' },
  pixel: { family: 'var(--font-pixel)', size: '1.45rem', section: '1.15rem', weight: 400, tracking: '0.02em', upper: true },
  round: { family: 'var(--font-fredoka)', size: '3.1rem', section: '2.3rem', weight: 600 },
};

export const BODY: Record<BodyFont, { family: string; className: string }> = {
  serif: { family: 'var(--font-cormorant)', className: 'text-[17px] leading-relaxed' },
  sans: { family: 'var(--font-jakarta)', className: 'text-sm leading-relaxed' },
  round: { family: 'var(--font-fredoka)', className: 'text-[15px] leading-relaxed' },
};
