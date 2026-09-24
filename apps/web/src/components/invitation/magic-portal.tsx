'use client';

// Gerbang "Portal sihir": saat halaman dibuka, lingkaran sihir menggambar dirinya sendiri dan nama tamu tertulis
// huruf demi huruf di tengahnya. Ketukan pada `.wl-gate` (gates.tsx) mengubah `phase` ke 'opening': lingkaran
// berputar makin cepat, bintang tersedot berpusar ke pusat, cahaya meledak, lalu lubang portal melebar dari
// tengah menyingkap sampul (REVEALS_COVER). Rupa: `rune` (Akademi Sihir) atau `orbit` (Galaksi Cinta).
// Putaran terus-menerus & kelip bintang memakai CSS (ringan); koreografi sekali jalan memakai Motion.
import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import { Particles } from './effects';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';
import { Inscription } from './inscription';

// Keacakan tetap (server = klien), dibulatkan supaya SSR = hidrasi (lihat letter-gust.tsx).
const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const fx = (n: number) => n.toFixed(2);

export type PortalLook = 'rune' | 'orbit';

// ----- waktu (detik). GATE_MS.portal (gates.tsx) harus sedikit lebih lama dari akhir pembukaan. -----
const DRAW = 1.4; // lingkaran tergambar saat halaman dibuka
const WRITE_START = 1.2; // nama tamu mulai tertulis
const WRITE_STEP = 0.045; // per huruf
const OPEN = { burst: 0.85, hole: 0.95, holeDuration: 1.2 };

// ----- lingkaran sihir (viewBox -100..100) -----
// Rune sederhana (kotak 10x10, garis): bentuk generik, bukan aksara dari karya tertentu.
const GLYPHS = [
  'M3 1v8M3 4l4-3M3 7l4-3',
  'M2 1v8M8 1v8M2 5h6',
  'M5 1v8M2 3l3 2 3-2',
  'M2 9l3-8 3 8M3.2 6h3.6',
  'M3 1v8l4-4-4-4',
  'M2 2l6 6M8 2l-6 6',
  'M2 9V1l6 4-6 4',
  'M5 1l3 4-3 4-3-4z',
];
const RUNES = Array.from({ length: 16 }, (_, i) => ({ id: i, angle: i * 22.5, d: GLYPHS[(i * 3) % GLYPHS.length]! }));

// Heksagram (dua segitiga) di dalam lingkaran.
const triangle = (r: number, rot: number) =>
  `M${[0, 1, 2]
    .map((k) => {
      const a = ((rot + k * 120 - 90) * Math.PI) / 180;
      return `${fx(Math.cos(a) * r)} ${fx(Math.sin(a) * r)}`;
    })
    .join('L')}Z`;
const HEXAGRAM = [triangle(70, 0), triangle(70, 180)];

// Orbit (rupa galaksi): tiga elips miring dengan planet kecil.
const ORBITS = [0, 60, 120].map((rot, i) => ({ id: i, rot, planet: { x: fx(Math.cos(i * 2.1) * 86), y: fx(Math.sin(i * 2.1) * 28) } }));

// ----- bintang yang tersedot berpusar ke pusat saat dibuka (px dari pusat lingkaran) -----
const VORTEX = Array.from({ length: 26 }, (_, i) => {
  const a0 = rand(i, 1) * Math.PI * 2;
  const r0 = 150 + rand(i, 2) * 100;
  const turns = 0.8 + rand(i, 3) * 0.7;
  const pts = [0, 0.25, 0.5, 0.75, 1].map((t) => {
    const r = r0 * Math.pow(1 - t, 1.3);
    const a = a0 + t * turns * Math.PI * 2;
    return { x: r3(Math.cos(a) * r), y: r3(Math.sin(a) * r) };
  });
  return { id: i, xs: pts.map((p) => p.x), ys: pts.map((p) => p.y), size: r3(3 + rand(i, 4) * 4), delay: r3(rand(i, 5) * 0.25), duration: r3(0.7 + rand(i, 6) * 0.25) };
});

// Tamu tanpa nama (demo, pratinjau, link tanpa ?to=): sapaan umum, sama dengan sampul. Gerbang selalu Indonesia
// (tombol bahasa baru ada di sampul).
const { dear: DEAR, guestFallback: GUEST_FALLBACK } = STRINGS.id;

// Garis penuh yang tergambar (pathLength 0 -> 1) saat halaman dibuka.
const draw = (reduced: boolean, delay: number, duration = DRAW) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: reduced ? { duration: 0 } : { pathLength: { delay, duration, ease: 'easeInOut' as const }, opacity: { delay, duration: 0.2 } },
});
// Garis putus-putus: pathLength memakai stroke-dasharray (pola putus-putus akan hilang), jadi cukup muncul perlahan.
const fade = (reduced: boolean, delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: reduced ? { duration: 0 } : { delay, duration: 0.6 },
});

export function MagicPortal({ look, phase, names, kicker, guest, headingFamily }: { look: PortalLook; phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const opening = phase === 'opening';
  // Lubang portal: mask radial yang jari-jarinya (--hole) dibesarkan Motion; mulai negatif = tertutup penuh.
  const mask = 'radial-gradient(circle at 50% 46%, transparent var(--hole), #000 calc(var(--hole) + 6%))';
  const spin = (seconds: number, reverse = false): CSSProperties => ({ transformBox: 'fill-box', transformOrigin: 'center', animation: `g-spin ${seconds}s linear infinite${reverse ? ' reverse' : ''}` });

  return (
    <>
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ '--hole': '-8%', WebkitMaskImage: mask, maskImage: mask } as CSSProperties}
        initial={false}
        animate={{ '--hole': opening ? '150%' : '-8%' } as Record<string, string>}
        transition={opening ? { delay: reduced ? 0 : OPEN.hole, duration: reduced ? 0.25 : OPEN.holeDuration, ease: [0.5, 0, 0.3, 1] } : { duration: 0 }}
      >
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--p) 40%, #1a0b3a) 0, #05030f 72%)' }} />
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(ellipse 60% 35% at 20% 15%, color-mix(in srgb, var(--s) 30%, transparent), transparent 70%), radial-gradient(ellipse 55% 30% at 85% 85%, color-mix(in srgb, var(--p) 25%, transparent), transparent 70%)' }} />
        <Particles kind="star" count={26} mode="twinkle" height="100%" />

        {/* lingkaran sihir */}
        <motion.div
          className="absolute left-1/2 top-[46%] aspect-square w-[min(88cqw,58cqh)] -translate-x-1/2 -translate-y-1/2 [filter:drop-shadow(0_0_6px_var(--s))]"
          initial={false}
          animate={opening && !reduced ? { rotate: 170, scale: [1, 1.08, 2.8], opacity: [1, 1, 0] } : { rotate: 0, scale: 1, opacity: opening ? 0 : 1 }}
          transition={opening ? { duration: reduced ? 0.25 : 1.8, times: [0, 0.45, 1], ease: 'easeIn' } : { duration: 0 }}
          aria-hidden
        >
          <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g style={spin(80)}>
              <motion.circle r="96" stroke="var(--s)" strokeWidth="0.8" strokeDasharray="2 4" {...fade(reduced, 0)} />
              <motion.circle r="90" stroke="var(--p)" strokeWidth="1.6" {...draw(reduced, 0.1)} />
            </g>
            {look === 'rune' ? (
              <g style={spin(50, true)}>
                {RUNES.map((r) => (
                  <g key={r.id} transform={`rotate(${r.angle}) translate(0 -82) translate(-4 -4) scale(0.8)`}>
                    <motion.path
                      d={r.d}
                      stroke="var(--p)"
                      strokeWidth="1.3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={reduced ? { duration: 0 } : { delay: r3(0.5 + r.id * 0.04), duration: 0.3 }}
                    />
                  </g>
                ))}
              </g>
            ) : (
              <g style={spin(40, true)}>
                {ORBITS.map((o) => (
                  <g key={o.id} transform={`rotate(${o.rot})`}>
                    <motion.ellipse rx="86" ry="28" stroke="var(--s)" strokeWidth="0.9" {...draw(reduced, 0.4 + o.id * 0.15, 1)} />
                    <motion.circle
                      cx={o.planet.x}
                      cy={o.planet.y}
                      r="3.6"
                      fill="var(--p)"
                      stroke="none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={reduced ? { duration: 0 } : { delay: 1.1 + o.id * 0.15, duration: 0.3 }}
                    />
                  </g>
                ))}
              </g>
            )}
            <motion.circle r="74" stroke="var(--p)" strokeWidth="1.2" {...draw(reduced, 0.3)} />
            <g style={spin(120)} opacity="0.45">
              {look === 'rune' ? (
                HEXAGRAM.map((d, i) => <motion.path key={i} d={d} stroke="var(--s)" strokeWidth="0.9" {...draw(reduced, 0.6 + i * 0.2, 1)} />)
              ) : (
                <motion.circle r="60" stroke="var(--s)" strokeWidth="0.9" strokeDasharray="1 5" {...fade(reduced, 0.6)} />
              )}
            </g>
            <motion.circle r="50" stroke="var(--s)" strokeWidth="0.8" strokeDasharray="3 3" {...fade(reduced, 0.8)} />
          </svg>
        </motion.div>

        {/* tulisan di tengah lingkaran */}
        <motion.div
          className="absolute left-1/2 top-[46%] w-[60%] -translate-x-1/2 -translate-y-1/2 text-center"
          initial={false}
          animate={opening ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
          transition={opening ? { delay: reduced ? 0 : 0.2, duration: reduced ? 0.2 : 0.45 } : { duration: 0 }}
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(5,3,15,.78) 0%, rgba(5,3,15,.45) 45%, transparent 70%)' }} aria-hidden />
          <motion.small className="block text-[9px] uppercase tracking-[0.3em] text-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 0.6, duration: 0.5 }}>
            {kicker}
          </motion.small>
          <motion.b
            className="mt-1.5 block text-[1.55rem] leading-tight text-[color-mix(in_srgb,var(--p)_55%,#fff)] [text-shadow:0_0_14px_var(--s)]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { delay: 0.8, duration: 0.6 }}
          >
            <span style={{ fontFamily: headingFamily, fontWeight: 600 }}>{names}</span>
          </motion.b>
          <motion.div className="mx-auto mt-2.5 h-px w-12 bg-[var(--s)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 1, duration: 0.4 }} />
          <motion.p className="mt-2.5 text-[10px] tracking-wide text-white/75" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 1.05, duration: 0.4 }}>
            {DEAR}
          </motion.p>
          <Inscription text={guest || GUEST_FALLBACK} reduced={reduced} start={WRITE_START} step={WRITE_STEP} className="text-white" sparkClassName="bg-white shadow-[0_0_8px_3px_var(--s)]" />
        </motion.div>

        {/* bintang tersedot ke pusat (hanya saat membuka) */}
        {opening && !reduced && (
          <div className="pointer-events-none absolute left-1/2 top-[46%] h-0 w-0" aria-hidden>
            {VORTEX.map((s) => (
              <motion.span
                key={s.id}
                className="absolute rounded-full bg-white shadow-[0_0_6px_2px_var(--s)]"
                style={{ width: s.size, height: s.size, marginLeft: -s.size / 2, marginTop: -s.size / 2 }}
                initial={{ x: s.xs[0], y: s.ys[0], opacity: 0, scale: 1 }}
                animate={{ x: s.xs, y: s.ys, opacity: [0, 1, 1, 1, 0], scale: [1, 1, 0.8, 0.5, 0.2] }}
                transition={{ delay: s.delay, duration: s.duration, ease: 'easeIn' }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ledakan cahaya di pusat, di luar mask supaya tidak ikut terpotong lubang */}
      {opening && !reduced && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[46%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, #fff 0%, color-mix(in srgb, var(--s) 80%, #fff) 35%, transparent 70%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3, 16], opacity: [0, 1, 0] }}
          transition={{ delay: OPEN.burst, duration: 0.9, times: [0, 0.25, 1], ease: 'easeOut' }}
          aria-hidden
        />
      )}
    </>
  );
}
