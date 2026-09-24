'use client';

// Gerbang "surat di atas tumpukan kepingan": surat kecil beristirahat di atas tumpukan kelopak sakura (`sakura`),
// kepingan kristal es (`frost`), atau daun musim gugur yang lebih besar (`leaves`). Ketukan pada `.wl-gate` (gates.tsx) mengubah `phase` ke 'opening': embusan
// angin menyapu diagonal dari kiri-bawah ke kanan-atas, membawa kepingan & surat, dan latar gerbang terhapus
// tepat di belakang muka angin sehingga sampul asli tersingkap mengikuti kepingan (REVEALS_COVER). Satu-satunya
// gerbang yang memakai Motion (dipilih pembuat produk untuk animasi bertahap seperti ini); gerbang lain tetap CSS
// murni, jangan pindahkan tanpa alasan. Varian hanya beda rupa (bentuk, warna, surat); gerak & waktu sama.
import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import type { GatePhase } from './gates';

// Posisi/keacakan tetap (server = klien) — sama gayanya dengan rand() di gates.tsx/effects.tsx, tapi lokal
// supaya file gerbang lain tidak ikut bergantung pada Motion.
const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
// Math.sin() bisa berbeda beberapa bit terakhir antara mesin JS server & browser untuk argumen besar (dipakai
// rand() di atas); dibulatkan pendek di sini supaya hasilnya identik saat SSR vs hidrasi (server & klien
// merender style yang sama persis) — sama seperti .toFixed() yang dipakai rand() di effects.tsx.
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// ----- bentuk kepingan (viewBox 24x24) -----
// Kelopak sakura sederhana (lekukan kecil di ujung).
const PETAL_PATH = 'M12 2C9.4 2 7.3 4.4 7.6 7.4c.2 2.3 1.9 4.1 3.4 5.7.4.4.7.9 1 1.5.3-.6.6-1.1 1-1.5 1.5-1.6 3.2-3.4 3.4-5.7C16.7 4.4 14.6 2 12 2Z';
// Poligon beraturan di tengah kotak 24x24; `inner` > 0 = bintang (sudut bergantian luar/dalam).
const polygon = (points: number, outer: number, inner = 0) => {
  const n = inner ? points * 2 : points;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = inner && i % 2 ? inner : outer;
    return `${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`;
  });
  return `M${pts.join('L')}Z`;
};
// Kristal es: bintang enam runcing & pelat heksagonal, dipakai bergantian supaya tumpukan tidak seragam.
const ICE_STAR = polygon(6, 11.5, 3.2);
const ICE_PLATE = polygon(6, 8.5);
// Daun musim gugur: maple bergerigi, daun lonjong runcing, daun tetes — masing-masing dengan tulang daun.
const MAPLE_LEAF = 'M12 1.5l2.6 4.6 3.9-1.3-.8 4.4 4.3 1.5-3.6 2.6 1.6 3.9-4.3-.6-.9 4.4H13v3.5h-2V21h-1.8l-.9-4.4-4.3.6 1.6-3.9-3.6-2.6 4.3-1.5-.8-4.4 3.9 1.3Z';
const MAPLE_VEINS = 'M12 21V6M12 13.5 17.5 9M12 13.5 6.5 9M12 16l5 1.5M12 16l-5 1.5';
const ELM_LEAF = 'M12 1.5C17 5.5 19.2 10.6 16.8 16c-1.3 3-3 4.6-4.1 5.4v1.6h-1.4v-1.6C10.2 20.6 8.5 19 7.2 16 4.8 10.6 7 5.5 12 1.5Z';
const ELM_VEINS = 'M12 3.5V21M12 8.5l3-2M12 8.5l-3-2M12 12.5l3.8-2.3M12 12.5 8.2 10.2M12 16.5l3.2-1.8M12 16.5l-3.2-1.8';
const DROP_LEAF = 'M3 21C3 10 10 3 21 3c0 11-7 18-18 18Z';
const DROP_VEINS = 'M4 20 18 6M9 15l-1.2-4.2M12.5 11.5l-1-4M9 15l4.2 1.2M12.5 11.5l4 1';

type GustKind = 'sakura' | 'frost' | 'leaves';

interface Look {
  shapes: string[];
  // Tulang daun (sejajar dengan `shapes`, kosong = tanpa garis dalam).
  veins?: string[];
  // Warna dasar yang dicampur dengan warna tema (bawaan: putih). Persentase warna tema = shade x tintScale.
  mixWith?: string[];
  tintScale: number;
  fillOpacity: number;
  stroke?: string;
  // Pengali ukuran kepingan (1 = ukuran kelopak sakura).
  sizeScale?: number;
  // Bentuk tumpukan (bawaan: gundukan rendah di bawah layar). Lihat PileShape.
  pile?: PileShape;
  pileShadow: string;
  letter: { background: string; color: string; border?: string };
}

const LOOKS: Record<GustKind, Look> = {
  sakura: {
    shapes: [PETAL_PATH],
    tintScale: 1,
    fillOpacity: 1,
    pileShadow: 'drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]',
    letter: { background: '#fffdf8', color: '#3b2a20' },
  },
  frost: {
    shapes: [ICE_STAR, ICE_PLATE],
    tintScale: 0.75,
    fillOpacity: 0.88,
    stroke: 'rgba(255,255,255,.85)',
    pileShadow: 'drop-shadow-[0_1px_2px_rgba(40,90,140,0.28)]',
    letter: { background: '#fbfdff', color: '#1f3347', border: '1px solid color-mix(in srgb, var(--s) 75%, transparent)' },
  },
  leaves: {
    shapes: [MAPLE_LEAF, ELM_LEAF, DROP_LEAF],
    veins: [MAPLE_VEINS, ELM_VEINS, DROP_VEINS],
    // Jingga, karat, merah bata, emas, cokelat: tetap "musim gugur" walau tema hijau; warna tema hanya menyelaraskan.
    mixWith: ['#c2571a', '#d98b2b', '#a8321f', '#e0a83e', '#8a4b20'],
    tintScale: 0.5,
    fillOpacity: 1,
    sizeScale: 1.5,
    // Daun berserakan merata memenuhi seluruh layar (54 daun), bukan menumpuk di bawah.
    pile: { kind: 'fill', cols: 6, rows: 9 },
    pileShadow: 'drop-shadow-[0_2px_2px_rgba(60,30,10,0.22)]',
    letter: { background: '#fdf6ea', color: '#4a2c16', border: '1px solid color-mix(in srgb, var(--s) 45%, transparent)' },
  },
};

// ----- waktu embusan (detik). GATE_MS (gates.tsx) harus sedikit lebih lama dari akhir semuanya. -----
// Muka angin (batas latar yang terhapus) bergerak dari sudut kiri-bawah ke kanan-atas.
const WIPE = { delay: 0.3, duration: 1.55 };
const GUST_COUNT = 30;

// Susunan kepingan sebelum diketuk:
// - `mound`: gundukan `count` kepingan; tinggi `reach` (% tinggi layar dari dasar, paling tinggi di tengah
//   horizontal); `minTop` batas teratas (%); `bias` > 1 = makin jarang ke atas; `taper` = seberapa cepat gundukan
//   merendah ke tepi kiri/kanan (0 = rata, 0.6 = runcing di tengah).
// - `fill`: kisi `cols` x `rows` yang digeser acak, merata di seluruh layar (tanpa gumpalan / area kosong).
type PileShape =
  | { kind: 'mound'; count: number; reach: number; minTop: number; bias: number; taper: number }
  | { kind: 'fill'; cols: number; rows: number };
// Bawaan (sakura, es): gundukan rendah di sepertiga bawah layar.
const LOW_PILE: PileShape = { kind: 'mound', count: 34, reach: 34, minTop: 48, bias: 1, taper: 0.6 };

// Posisi kepingan ke-i (% dari kiri & atas layar).
function pilePosition(shape: PileShape, i: number) {
  if (shape.kind === 'fill') {
    const c = i % shape.cols;
    const r = Math.floor(i / shape.cols);
    return {
      left: ((c + 0.5 + (rand(i, 1) - 0.5) * 0.9) / shape.cols) * 100,
      top: ((r + 0.5 + (rand(i, 3) - 0.5) * 0.9) / shape.rows) * 100,
    };
  }
  const centered = (rand(i, 1) - 0.5) * 2; // -1..1
  const left = Math.min(96, Math.max(4, 50 + centered * 38 + (rand(i, 2) - 0.5) * 14));
  const heightBias = 1 - Math.abs(centered) * shape.taper; // makin ke tengah, boleh makin tinggi tumpukannya
  const top = Math.min(97, Math.max(shape.minTop, 96 - Math.pow(rand(i, 3), shape.bias) * shape.reach * heightBias));
  return { left, top };
}

// Arah angin di layar (x ke kanan, y ke bawah): ke kanan-atas; tegak lurusnya untuk menyebar kepingan embusan.
const DIR = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
const PERP = { x: Math.SQRT1_2, y: Math.SQRT1_2 };

interface PileBit {
  id: number;
  left: number; // %
  top: number; // %
  size: number; // px
  rotate: number;
  tint: 'p' | 's';
  shade: number; // 0-1, dicampur ke putih
  dx: number;
  dy: number;
  spin: number;
  delay: number;
  duration: number;
}

// Kepingan sebelum diketuk (lihat PileShape). Tiap kepingan terangkat saat muka angin melewatinya (yang di
// kiri-bawah lebih dulu), lalu terbang jauh ke kanan-atas keluar layar.
function pileBits(shape: PileShape): PileBit[] {
  const bits: PileBit[] = [];
  const count = shape.kind === 'fill' ? shape.cols * shape.rows : shape.count;
  for (let i = 0; i < count; i++) {
    const { left, top } = pilePosition(shape, i);
    // 0 = sudut kiri-bawah, 1 = sudut kanan-atas (kira-kira posisi muka angin saat melewati kepingan ini).
    const along = (left + (100 - top)) / 200;
    const travel = 520 + rand(i, 8) * 420;
    const drift = (rand(i, 9) - 0.5) * 220;
    bits.push({
      id: i,
      left: r3(left),
      top: r3(top),
      size: r3(14 + rand(i, 4) * 13),
      rotate: r3(rand(i, 5) * 360),
      tint: rand(i, 6) > 0.5 ? 'p' : 's',
      shade: r3(0.3 + rand(i, 7) * 0.5),
      dx: r3(DIR.x * travel + PERP.x * drift),
      dy: r3(DIR.y * travel + PERP.y * drift),
      spin: r3((200 + rand(i, 10) * 320) * (rand(i, 11) > 0.5 ? 1 : -1)),
      delay: r3(WIPE.delay - 0.15 + along * WIPE.duration * 0.7 + rand(i, 12) * 0.12),
      duration: r3(0.95 + rand(i, 13) * 0.4),
    });
  }
  return bits;
}
const PILES: Record<GustKind, PileBit[]> = {
  sakura: pileBits(LOOKS.sakura.pile ?? LOW_PILE),
  frost: pileBits(LOOKS.frost.pile ?? LOW_PILE),
  leaves: pileBits(LOOKS.leaves.pile ?? LOW_PILE),
};

interface GustBit {
  id: number;
  size: number;
  tint: 'p' | 's';
  shade: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  spin: number;
  flip: number;
  delay: number;
  duration: number;
}

// Kepingan embusan: masuk dari luar sudut kiri-bawah dalam pita tegak lurus arah angin, menyapu seluruh layar
// (juga di atas sampul yang sudah tersingkap), lalu keluar di kanan-atas. Posisi dalam px dari sudut kiri-bawah;
// pita & jarak dibuat cukup untuk layar sampai ±480x1000 (layar yang lebih besar tetap tersingkap oleh latar).
function gustBits(): GustBit[] {
  const bits: GustBit[] = [];
  for (let i = 0; i < GUST_COUNT; i++) {
    const spread = -760 + rand(i, 21) * 1140; // posisi dalam pita (tegak lurus angin)
    const start = -60 - rand(i, 22) * 160; // mulai sedikit di belakang layar
    const travel = 1250 + rand(i, 23) * 250;
    const wobble = (rand(i, 24) - 0.5) * 160;
    bits.push({
      id: i,
      size: r3(12 + rand(i, 25) * 14),
      tint: rand(i, 26) > 0.45 ? 'p' : 's',
      shade: r3(0.35 + rand(i, 27) * 0.5),
      x0: r3(PERP.x * spread + DIR.x * start),
      y0: r3(PERP.y * spread + DIR.y * start),
      x1: r3(PERP.x * (spread + wobble) + DIR.x * (start + travel)),
      y1: r3(PERP.y * (spread + wobble) + DIR.y * (start + travel)),
      spin: r3((240 + rand(i, 28) * 360) * (rand(i, 29) > 0.5 ? 1 : -1)),
      flip: r3(120 + rand(i, 30) * 300),
      delay: r3(0.05 + rand(i, 31) * 0.7),
      duration: r3(1.25 + rand(i, 32) * 0.55),
    });
  }
  return bits;
}
const GUST = gustBits();

const sizeOf = (look: Look, size: number) => r3(size * (look.sizeScale ?? 1));

function Shape({ look, id, tint, shade }: { look: Look; id: number; tint: 'p' | 's'; shade: number }) {
  const n = id % look.shapes.length;
  const base = look.mixWith ? look.mixWith[id % look.mixWith.length] : '#fff';
  const veins = look.veins?.[n];
  return (
    <>
      <path
        d={look.shapes[n]}
        fill={`color-mix(in srgb, var(--${tint}) ${Math.round(shade * look.tintScale * 100)}%, ${base})`}
        fillOpacity={look.fillOpacity}
        stroke={look.stroke}
        strokeWidth={look.stroke ? 0.8 : undefined}
        strokeLinejoin="round"
      />
      {veins && <path d={veins} fill="none" stroke="rgba(70,30,10,.38)" strokeWidth={0.7} strokeLinecap="round" />}
    </>
  );
}

function PileBitView({ bit, look, blowing, reduced }: { bit: PileBit; look: Look; blowing: boolean; reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={sizeOf(look, bit.size)}
      height={sizeOf(look, bit.size)}
      className={`absolute ${look.pileShadow}`}
      style={{ left: `${bit.left}%`, top: `${bit.top}%`, translateX: '-50%', translateY: '-50%' }}
      initial={false}
      animate={
        blowing && !reduced
          ? { x: bit.dx, y: bit.dy, rotate: bit.rotate + bit.spin, opacity: [1, 1, 0] }
          : blowing
            ? { opacity: 0 }
            : { x: 0, y: 0, rotate: bit.rotate, opacity: 1 }
      }
      transition={
        blowing
          ? reduced
            ? { duration: 0.25 }
            : { duration: bit.duration, delay: bit.delay, ease: [0.45, 0, 0.75, 0.55], opacity: { duration: bit.duration, delay: bit.delay, times: [0, 0.8, 1] } }
          : { duration: 0.3 }
      }
    >
      <Shape look={look} id={bit.id} tint={bit.tint} shade={bit.shade} />
    </motion.svg>
  );
}

function GustBitView({ bit, look }: { bit: GustBit; look: Look }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={sizeOf(look, bit.size)}
      height={sizeOf(look, bit.size)}
      className="absolute left-0 top-full"
      style={{ transformPerspective: 500 }}
      initial={{ x: bit.x0, y: bit.y0, rotate: 0, rotateY: 0, opacity: 0 }}
      animate={{ x: bit.x1, y: bit.y1, rotate: bit.spin, rotateY: bit.flip, opacity: [0, 1, 1, 0] }}
      transition={{ duration: bit.duration, delay: bit.delay, ease: 'linear', opacity: { duration: bit.duration, delay: bit.delay, times: [0, 0.08, 0.85, 1] } }}
      aria-hidden
    >
      <Shape look={look} id={bit.id} tint={bit.tint} shade={bit.shade} />
    </motion.svg>
  );
}

export function LetterGust({ kind, phase, names, kicker, guest, headingFamily }: { kind: GustKind; phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const blowing = phase === 'opening';
  const look = LOOKS[kind];
  // Latar terhapus di belakang muka angin: mask gradien diagonal yang batasnya (--wipe) digeser Motion.
  const mask = 'linear-gradient(45deg, transparent calc(var(--wipe) - 22%), #000 var(--wipe))';

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ '--wipe': '0%', WebkitMaskImage: mask, maskImage: mask } as CSSProperties}
        initial={false}
        animate={{ '--wipe': blowing ? '122%' : '0%' } as Record<string, string>}
        transition={blowing ? { duration: reduced ? 0.25 : WIPE.duration, delay: reduced ? 0 : WIPE.delay, ease: [0.5, 0, 0.35, 1] } : { duration: 0 }}
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--p) 12%, var(--bg)), var(--bg) 78%)' }} />
        {/* kelompok kepingan di lantai, meninggi ke belakang surat */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 92%, color-mix(in srgb, var(--p) 16%, transparent), transparent 72%)' }} />
      </motion.div>

      {PILES[kind].map((bit) => (
        <PileBitView key={bit.id} bit={bit} look={look} blowing={blowing} reduced={reduced} />
      ))}

      <motion.div
        className="absolute left-1/2 top-[42%] w-[66%] max-w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-sm px-[7%] py-[9%] text-center shadow-[0_18px_38px_-16px_rgba(0,0,0,.4)]"
        style={look.letter}
        initial={false}
        animate={
          blowing
            ? reduced
              ? { opacity: 0 }
              : { x: [0, -8, 300], y: [0, 6, -380], rotate: [-1.5, -4, 28], scale: [1, 1, 0.7], opacity: [1, 1, 0] }
            : { x: 0, y: reduced ? 0 : [0, -5, 0], rotate: -1.5, scale: 1, opacity: 1 }
        }
        transition={
          blowing
            ? { duration: reduced ? 0.25 : 1.3, delay: reduced ? 0 : 0.35, times: [0, 0.18, 1], ease: 'easeIn' }
            : { duration: 4, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }
        }
      >
        <small className="block text-[10px] uppercase tracking-[0.32em] opacity-70">{kicker}</small>
        <b className="mt-2 block text-2xl leading-tight" style={{ fontFamily: headingFamily, color: 'var(--p)', fontWeight: 600 }}>
          {names}
        </b>
        <i className="mx-auto mt-3 block h-px w-10 not-italic" style={{ background: 'var(--s)' }} />
        <p className="mt-3 text-[11px] leading-relaxed opacity-75">
          Kepada Yth.
          <br />
          {guest && (
            <span className="font-semibold">{guest}</span>
          )}
        </p>
      </motion.div>

      {/* embusan: hanya dipasang saat membuka (tidak ikut SSR / tidak membebani saat diam) */}
      {blowing && !reduced && GUST.map((bit) => <GustBitView key={bit.id} bit={bit} look={look} />)}
    </div>
  );
}
