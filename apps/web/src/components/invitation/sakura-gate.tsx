'use client';

// Gerbang "Surat kelopak sakura": surat kecil beristirahat di atas tumpukan kelopak sakura. Ketukan pada
// `.wl-gate` (gates.tsx) mengubah `phase` ke 'opening' — kelopak tertiup angin dan menyingkir, surat terangkat
// dan memudar, menyingkap sampul asli di baliknya. Satu-satunya gerbang yang memakai Motion (dipilih pembuat
// produk untuk animasi bertahap seperti ini); gerbang lain tetap CSS murni, jangan pindahkan tanpa alasan.
import { motion, useReducedMotion } from 'motion/react';
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

// Path kelopak sakura sederhana (lekukan kecil di ujung).
const PETAL_PATH = 'M12 2C9.4 2 7.3 4.4 7.6 7.4c.2 2.3 1.9 4.1 3.4 5.7.4.4.7.9 1 1.5.3-.6.6-1.1 1-1.5 1.5-1.6 3.2-3.4 3.4-5.7C16.7 4.4 14.6 2 12 2Z';

const PETAL_COUNT = 38;

interface Petal {
  id: number;
  left: number; // %
  top: number; // %
  size: number; // px
  rotate: number;
  tint: 'p' | 's';
  shade: number; // 0-1, dicampur ke putih
  windX: number;
  windY: number;
  spin: number;
  delay: number;
  duration: number;
}

// Tumpukan berbentuk gundukan: padat di bawah-tengah, menipis ke atas/tepi.
function pilePetals(): Petal[] {
  const petals: Petal[] = [];
  for (let i = 0; i < PETAL_COUNT; i++) {
    const spread = rand(i, 1); // 0..1, condong ke tengah lewat pemetaan di bawah
    const centered = (spread - 0.5) * 2; // -1..1
    const left = 50 + centered * 38 + (rand(i, 2) - 0.5) * 14;
    const heightBias = 1 - Math.abs(centered) * 0.6; // makin ke tengah, boleh makin tinggi tumpukannya
    const top = 96 - rand(i, 3) * 34 * heightBias;
    petals.push({
      id: i,
      left: r3(Math.min(96, Math.max(4, left))),
      top: r3(Math.min(97, Math.max(48, top))),
      size: r3(14 + rand(i, 4) * 13),
      rotate: r3(rand(i, 5) * 360),
      tint: rand(i, 6) > 0.5 ? 'p' : 's',
      shade: r3(0.3 + rand(i, 7) * 0.5),
      windX: r3(60 + rand(i, 8) * 90),
      windY: r3(-(70 + rand(i, 9) * 110)),
      spin: r3(180 + rand(i, 10) * 360 * (rand(i, 11) > 0.5 ? 1 : -1)),
      delay: r3(rand(i, 12) * 0.75),
      duration: r3(1.05 + rand(i, 13) * 0.55),
    });
  }
  return petals;
}
const PETALS = pilePetals();

function Petal({ petal, blowing, reduced }: { petal: Petal; blowing: boolean; reduced: boolean }) {
  const color = `color-mix(in srgb, var(--${petal.tint}) ${Math.round(petal.shade * 100)}%, #fff)`;
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={petal.size}
      height={petal.size}
      className="absolute drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]"
      style={{ left: `${petal.left}%`, top: `${petal.top}%`, translateX: '-50%', translateY: '-50%' }}
      initial={false}
      animate={
        blowing && !reduced
          ? { x: petal.windX, y: petal.windY, rotate: petal.rotate + petal.spin, opacity: 0 }
          : blowing
            ? { opacity: 0 }
            : { x: 0, y: 0, rotate: petal.rotate, opacity: 1 }
      }
      transition={blowing ? { duration: reduced ? 0.25 : petal.duration, delay: reduced ? 0 : petal.delay, ease: 'easeIn' } : { duration: 0.3 }}
    >
      <path d={PETAL_PATH} fill={color} />
    </motion.svg>
  );
}

export function SakuraLetter({ phase, names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const blowing = phase === 'opening';

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--p) 12%, var(--bg)), var(--bg) 78%)' }}>
      {/* kelompok kelopak di lantai, meninggi ke belakang surat */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 45% at 50% 92%, color-mix(in srgb, var(--p) 16%, transparent), transparent 72%)' }} aria-hidden />

      {PETALS.map((petal) => (
        <Petal key={petal.id} petal={petal} blowing={blowing} reduced={reduced} />
      ))}

      <motion.div
        className="absolute left-1/2 top-[42%] w-[66%] max-w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[#fffdf8] px-[7%] py-[9%] text-center shadow-[0_18px_38px_-16px_rgba(0,0,0,.4)]"
        style={{ color: '#3b2a20' }}
        initial={false}
        animate={
          blowing
            ? { y: reduced ? 0 : -46, opacity: 0, rotate: -4 }
            : { y: reduced ? 0 : [0, -5, 0], opacity: 1, rotate: -1.5 }
        }
        transition={blowing ? { duration: reduced ? 0.25 : 1, ease: 'easeOut' } : { duration: 4, repeat: reduced ? 0 : Infinity, ease: 'easeInOut' }}
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
    </div>
  );
}
