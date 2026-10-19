// Paket motif visual per desain (kunci = theme.motif = id desain di apps/api/src/templates/themes.ts).
// Tema kartun / game / film hanya terinspirasi GAYA UMUM: tidak ada karakter, logo, atau nama berhak cipta.
import type { BodyFont, HeadingFont } from '@/lib/types';
import type { OrnamentKind } from './ornaments';
import type { Meadow } from './meadow-art';

export type ParticleKind = 'petal' | 'leaf' | 'maple' | 'snow' | 'heart' | 'star' | 'sparkle' | 'confetti' | 'bubble' | 'firefly' | 'pixel' | 'lantern' | 'bat' | 'coin' | 'dust' | 'feather' | 'blossom' | 'bloomflower';
export type ParticleMode = 'fall' | 'rise' | 'twinkle' | 'drift';
export type PatternKind = 'none' | 'dots' | 'kawung' | 'zigzag' | 'diamond' | 'scallop' | 'grid' | 'stars' | 'star8' | 'hearts' | 'leaves' | 'stripes' | 'cross';
export type FrameKind = 'arch' | 'oval' | 'round' | 'square' | 'diamond' | 'pixel' | 'polaroid' | 'hex' | 'notch' | 'deco' | 'dove' | 'bloom' | 'kayon' | 'garden' | 'sakura' | 'autumn' | 'winter' | 'lavender' | 'hortensia' | 'marigold';
export type CountdownKind = 'soft' | 'outline' | 'pixel' | 'neon' | 'ticket' | 'round' | 'flip' | 'luxe' | 'sky' | 'bloom' | 'keraton' | 'raster';
export type CoverFxKind = 'none' | 'aurora' | 'rays' | 'curtain' | 'scanlines' | 'spotlight' | 'clouds' | 'halo' | 'sky' | 'bloom';
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
  // Tampilan khusus: 'kraft' = kertas kraft, kartu berjahitan berpita perekat, tali goni (lihat .wl-kraft di globals.css).
  // 'gilded' = Elegan: kertas gading bermarmer, garis & huruf berlapis emas, bingkai berukir (lihat .wl-gilded).
  // 'keraton' = Batik Jawa: krem & maroon, emas berlapis, parang di tepi halaman, kawung pemisah, gunungan (lihat .wl-keraton).
  skin?: 'kraft' | 'gilded' | 'dove' | 'bloom' | 'keraton' | 'garden' | 'raster';
  // Menimpa font judul tema (mis. rustic memakai Fraunces yang hangat walau snapshot lama bertulis serif).
  heading?: HeadingFont;
  // Font khusus nama mempelai (sampul, gerbang, kartu mempelai); bawaan = `heading`.
  names?: HeadingFont;
  // Font isi; menimpa font isi tema (keraton memakai Montserrat walau snapshot lama bertulis serif).
  body?: BodyFont;
  // Ukuran ornamen sudut sampul (kelas lebar Tailwind): atas & bawah; bawaan w-24 untuk semua sudut.
  cornerSize?: { top: string; bottom: string };
  // Bingkai penuh di tepi sampul (garis ganda + ubin bunga di sepanjang tepi; MeadowPageFrame); nilai = jenis bunga di meadow-art.ts.
  pageFrame?: Meadow;
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
  rustic: { ...m('twig', 'none', 'polaroid', 'ticket', 'none', ['leaf', 10, 'fall'], 'mid'), skin: 'kraft', heading: 'display' },
  // Floral Romantis: karangan mawar & peony merah muda di sudut/pemisah (ornamen 'romantic'), sudut dibuat besar seperti Buket.
  floral: { ...m('romantic', 'leaves', 'oval', 'soft', 'none', ['petal', 14, 'fall']), cornerSize: { top: 'w-36 [@media(max-height:700px)]:w-28', bottom: 'w-28 [@media(max-height:700px)]:w-24' } },
  // Taman Botani: kertas gading berbintik, bingkai berukir bersudut filigran, ranting daun teh & bunga liar hijau (skin 'garden').
  garden: { ...m('botani', 'none', 'garden', 'outline', 'none', ['leaf', 12, 'fall']), skin: 'garden', heading: 'display', names: 'display', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  elegant: { ...m('deco', 'diamond', 'deco', 'luxe', 'halo', ['dust', 22, 'rise'], 'mid', 'blur'), skin: 'gilded', heading: 'cinzel', names: 'script' },

  // Buket Pengantin: putih bersih dihiasi bunga warna-warni (mawar, peony, aster, anemon, kosmos)
  buket: { ...m('flora', 'none', 'bloom', 'bloom', 'bloom', ['blossom', 14, 'fall'], 'pill', 'rise'), skin: 'bloom', heading: 'serif', names: 'script', cornerSize: { top: 'w-36 [@media(max-height:700px)]:w-28', bottom: 'w-28 [@media(max-height:700px)]:w-24' } },

  galaksi: m('sparkle', 'stars', 'round', 'neon', 'aurora', ['star', 30, 'twinkle'], 'soft', 'blur', { kicker: 'Misi Cinta di Antar Bintang', open: 'Luncurkan' }),
  sihir: m('sparkle', 'stars', 'arch', 'outline', 'spotlight', ['firefly', 18, 'drift'], 'soft', 'blur', { kicker: 'Surat dari Akademi Sihir', open: 'Buka Gulungan' }),

  // Musim
  semi: { ...m('sakura', 'none', 'sakura', 'soft', 'clouds', ['petal', 18, 'fall']), pageFrame: 'sakura', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  panas: m('sparkle', 'dots', 'round', 'round', 'rays', ['bubble', 10, 'rise'], 'pill'),
  gugur: { ...m('autumn', 'none', 'autumn', 'ticket', 'none', ['maple', 16, 'fall'], 'mid'), pageFrame: 'autumn', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  // Tiga desain berwarna dominan (ranting bunga sejajar bingkai, meadow-art.ts): ungu, biru, oranye.
  lavender: { ...m('lavender', 'none', 'lavender', 'soft', 'clouds', ['petal', 16, 'fall'], 'soft', 'blur'), heading: 'script', names: 'script', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  hortensia: { ...m('hortensia', 'none', 'hortensia', 'outline', 'aurora', ['blossom', 14, 'fall'], 'pill', 'blur'), heading: 'serif', names: 'serif', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  marigold: { ...m('marigold', 'none', 'marigold', 'ticket', 'rays', ['petal', 16, 'fall'], 'mid', 'rise'), heading: 'display', names: 'script', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  wisteria: { ...m('hortensia', 'none', 'hortensia', 'outline', 'aurora', ['petal', 14, 'fall'], 'pill', 'blur'), heading: 'serif', names: 'serif', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
  // Desain raster: seluruh seninya raster (kertas berukir, bingkai kayu, pigura, kayon); lihat .wl-sekar di globals.css & sekar-keraton-*.tsx.
  'jawa-sekar-keraton': { ...m('keraton', 'none', 'kayon', 'raster', 'none', ['dust', 10, 'rise'], 'sharp', 'rise'), skin: 'raster', heading: 'libre', names: 'libre', body: 'source' },
  // Pusako Minang: gonjong, ukiran kayu, songket; sistem tampilan raster yang sama dengan Sekar Keraton (lihat raster-theme.ts).
  'pusako-minang': { ...m('keraton', 'none', 'kayon', 'raster', 'none', ['dust', 10, 'rise'], 'sharp', 'rise'), skin: 'raster', heading: 'playfair', names: 'playfair', body: 'source' },
  // Horas Nauli (Batak Toba): ulos Ragi Hotang merah-hitam, simpul tenun, gorga halus; sistem raster yang sama (raster-theme.ts).
  'horas-nauli': { ...m('keraton', 'none', 'kayon', 'raster', 'none', ['dust', 10, 'rise'], 'sharp', 'rise'), skin: 'raster', heading: 'libre', names: 'libre', body: 'source' },
  // Pawiwahan Agung (Bali): candi bentar batu paras, prada tua, merah bata; sistem raster yang sama (raster-theme.ts).
  'pawiwahan-agung': { ...m('keraton', 'none', 'kayon', 'raster', 'none', ['dust', 10, 'rise'], 'sharp', 'rise'), skin: 'raster', heading: 'serif', names: 'serif', body: 'source' },
  // Hong Xi (Tionghoa Indonesia, modern): kertas merah berawan emas, lentera, koi, 囍; sistem raster yang sama (raster-theme.ts), halaman gelap.
  'hong-xi': { ...m('keraton', 'none', 'kayon', 'raster', 'none', ['dust', 10, 'rise'], 'sharp', 'rise'), skin: 'raster', heading: 'playfair', names: 'playfair', body: 'source' },
  salju: { ...m('winter', 'none', 'winter', 'outline', 'aurora', ['snow', 28, 'fall'], 'mid', 'blur'), pageFrame: 'winter', cornerSize: { top: 'w-40 [@media(max-height:700px)]:w-28', bottom: 'w-36 [@media(max-height:700px)]:w-24' } },
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
  playfair: { family: 'var(--font-playfair)', size: '2.9rem', section: '1.9rem', weight: 500 },
  libre: { family: 'var(--font-libre)', size: '2.9rem', section: '1.9rem', weight: 400 },
};

export const BODY: Record<BodyFont, { family: string; className: string }> = {
  serif: { family: 'var(--font-cormorant)', className: 'text-[17px] leading-relaxed' },
  sans: { family: 'var(--font-jakarta)', className: 'text-sm leading-relaxed' },
  round: { family: 'var(--font-fredoka)', className: 'text-[15px] leading-relaxed' },
  montserrat: { family: 'var(--font-montserrat)', className: 'text-[14px] leading-[1.85] tracking-[0.01em]' },
  source: { family: 'var(--font-source)', className: 'text-[15px] leading-[1.75] tracking-[0.01em]' },
};
