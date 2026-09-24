'use client';

// Gerbang "Kayon wayang" (Batik Jawa): kelir wayang kulit diterangi blencong, gunungan (kayon) berisi motif
// kawung tertancap di gedebog, dan nama tamu tertulis di atasnya. Ketukan (phase 'opening') meniru pembuka
// lakon: gunungan digoyang dalang lalu dicabut mendekati blencong, bayangannya membesar menutupi kelir, dan
// sampul terlihat lewat pintu gapura pada bayangan itu yang kian dekat (REVEALS_COVER). Gambar SVG dibuat
// sendiri dari bentuk gunungan tradisional (warisan budaya), bukan jiplakan karya tertentu.
// Kedip api & cahaya blencong memakai CSS (g-flame / g-flicker di gates.tsx); koreografi sekali jalan memakai Motion.
import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';
import { Inscription } from './inscription';

const { dear: DEAR, guestFallback: GUEST_FALLBACK } = STRINGS.id;

// ----- waktu (detik). GATE_MS.kayon (gates.tsx) harus sedikit lebih lama dari OPEN.total. -----
const ENTER = 0.15; // gunungan mulai ditancapkan saat halaman dibuka
const WRITE_START = 1.3; // nama tamu mulai tertulis
const OPEN = { wobble: 0.6, lift: 1.0, veil: 0.95, total: 2.1 };
const WOBBLE = [null, -7, 6, -3, 0];

// ----- gunungan (viewBox 0 0 200 320): badan, umpak, gapit (tangkai), pintu gapura -----
const BODY = 'M100 6C112 30 134 52 152 84C172 120 186 170 184 214C183 232 178 244 170 250H30C22 244 17 232 16 214C14 170 28 120 48 84C66 52 88 30 100 6Z';
const PLINTH = 'M40 250H160V259H40ZM52 259H148V268H52Z';
const STICK = 'M97 268H103L101.5 318H98.5Z';
// Lubang pintu pada bayangan: melengkung seperti ambang gapura.
const DOOR = 'M84 250V230C84 222 91 218 100 218C109 218 116 222 116 230V250Z';
// Bayangan = siluet utuh dengan pintu berlubang (evenodd). Porosnya (kelas origin-[50%_73.4%]) = pusat pintu
// (y 234 / 320), jadi saat diperbesar kamera seolah menembus pintu gapura.
const SHADOW = `${BODY}${PLINTH}${STICK}${DOOR}`;
// Zoom menembus pintu: skala naik geometris (~1,8x per langkah, laju tetap terasa sama) sambil pintu digeser
// ke tengah layar. Indeks 0-2 = bayangan membesar menutupi kelir, sisanya = menembus pintu.
const ZOOM = {
  times: [0, 0.21, 0.45, 0.6, 0.75, 0.88, 1],
  scale: [null, 1.25, 5, 9, 16, 28, 48],
  y: [null, '-2%', '-28%', '-45%', '-55%', '-60%', '-62%'],
  x: [null, '1%', '0%', '0%', '0%', '0%', '0%'],
  opacity: [null, 0.55, 1, 1, 1, 1, 1],
};
const TRUNK = 'M100 214C98 180 102 140 100 40';
const BUD = 'M100 22C105 31 105 38 100 43C95 38 95 31 100 22Z';
// Cabang pohon hayat: melengkung keluar lalu menggulung (ukel), makin pendek ke atas.
const BRANCHES = [[176, 52], [148, 48], [120, 42], [92, 33], [66, 22]].map(([y, reach], i) => {
  const x = 100 - reach;
  return { id: i, y, d: `M100 ${y}C${100 - reach * 0.35} ${y - 10} ${x + reach * 0.2} ${y - 9} ${x} ${y + 3}C${x - 4} ${y + 10} ${x + 7} ${y + 14} ${x + 9} ${y + 6}`, tip: { x: x + 9, y: y + 6 } };
});
const WAVES = ['M22 245q7-7 14 0t14 0t14 0', 'M28 237q6-6 12 0t12 0t12 0'];
const MIRROR = 'matrix(-1 0 0 1 200 0)';
const inset = (s: number) => `translate(100 150) scale(${s}) translate(-100 -150)`;

// ----- warna (CSS, ikut palet tema lewat --p/--s/--bg/--tx) -----
const KELIR = 'radial-gradient(ellipse 120% 90% at 50% 8%, color-mix(in srgb, var(--bg) 65%, #fff8e6) 0%, color-mix(in srgb, var(--bg) 82%, var(--s)) 45%, color-mix(in srgb, var(--p) 45%, #2a1808) 100%)';
const LAMP_GLOW = 'radial-gradient(ellipse 70% 42% at 50% 7%, color-mix(in srgb, var(--s) 45%, #fff3c4) 0%, transparent 72%)';
// Tepi atas kelir (plangitan) bermotif parang: pita miring berulang.
const PARANG = 'repeating-linear-gradient(-45deg, color-mix(in srgb, var(--p) 70%, #000) 0 7px, var(--s) 7px 9px, color-mix(in srgb, var(--p) 92%, #000) 9px 16px, var(--s) 16px 17px)';
const GEDEBOG = 'linear-gradient(to bottom, #8a7a45 0%, #5f5128 30%, #3b3117 100%), #3b3117';
const GEDEBOG_FIBER = 'repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 2px, transparent 2px 9px)';
const SHADOW_FILL = 'color-mix(in srgb, var(--p) 22%, #120a04)';
const DARK_WOOD = 'color-mix(in srgb, var(--p) 55%, #000)';

// Garis yang tergambar (pathLength 0 -> 1) setelah gunungan tertancap.
const draw = (reduced: boolean, delay: number, duration = 0.9) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: reduced ? { duration: 0 } : { pathLength: { delay, duration, ease: 'easeInOut' as const }, opacity: { delay, duration: 0.15 } },
});

function Gunungan({ reduced }: { reduced: boolean }) {
  // useId bisa berisi karakter yang tidak aman untuk url(#...).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const fill = `kayon-fill-${uid}`;
  const kawung = `kayon-kawung-${uid}`;
  return (
    <svg viewBox="0 0 200 320" className="h-full w-full overflow-visible" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--p) 72%, var(--s))' }} />
          <stop offset="0.6" style={{ stopColor: 'var(--p)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--p) 70%, #000)' }} />
        </linearGradient>
        {/* kawung: empat oval mengelilingi satu titik, diputar 45 derajat */}
        <pattern id={kawung} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <g fill="var(--s)">
            <ellipse cx="7" cy="3.3" rx="2.1" ry="3.1" />
            <ellipse cx="7" cy="10.7" rx="2.1" ry="3.1" />
            <ellipse cx="3.3" cy="7" rx="3.1" ry="2.1" />
            <ellipse cx="10.7" cy="7" rx="3.1" ry="2.1" />
          </g>
          <circle cx="7" cy="7" r="0.9" style={{ fill: DARK_WOOD }} />
        </pattern>
      </defs>

      <path d={STICK} style={{ fill: DARK_WOOD }} />
      <path d={PLINTH} fill="var(--s)" stroke="var(--p)" strokeWidth="0.8" />
      <path d={BODY} fill={`url(#${fill})`} />
      <path d={BODY} fill={`url(#${kawung})`} opacity="0.3" />
      {/* tatahan (lubang tatah kulit) & garis dalam */}
      <path d={BODY} fill="none" stroke="#fff4dc" strokeWidth="1.5" strokeDasharray="0 4.2" opacity="0.75" transform={inset(0.93)} />
      <path d={BODY} fill="none" stroke="var(--s)" strokeWidth="0.8" opacity="0.85" transform={inset(0.86)} />
      <path d={BODY} fill="none" stroke="var(--s)" strokeWidth="2.4" />

      {/* pohon hayat */}
      <g fill="none" stroke="var(--s)" strokeWidth="1.6">
        <motion.path d={TRUNK} strokeWidth="2.2" {...draw(reduced, 0.7, 0.8)} />
        {BRANCHES.map((b) => (
          <g key={b.id}>
            <motion.path d={b.d} {...draw(reduced, 0.9 + b.id * 0.12, 0.7)} />
            <motion.path d={b.d} transform={MIRROR} {...draw(reduced, 0.9 + b.id * 0.12, 0.7)} />
          </g>
        ))}
      </g>
      <motion.g fill="var(--s)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0 } : { delay: 1.6, duration: 0.4 }}>
        <path d={BUD} />
        {BRANCHES.map((b) => (
          <g key={b.id}>
            <circle cx={b.tip.x} cy={b.tip.y} r="1.8" />
            <circle cx={200 - b.tip.x} cy={b.tip.y} r="1.8" />
          </g>
        ))}
      </motion.g>

      {/* ombak di kaki gunungan */}
      <g fill="none" stroke="var(--s)" strokeWidth="1.3" opacity="0.9">
        {WAVES.map((d) => (
          <g key={d}>
            <path d={d} />
            <path d={d} transform={MIRROR} />
          </g>
        ))}
      </g>

      {/* gapura */}
      <path d="M72 216L100 188L128 216Z" stroke="var(--s)" strokeWidth="0.9" style={{ fill: DARK_WOOD }} />
      <path d="M86 210L100 196L114 210Z" fill="none" stroke="var(--s)" strokeWidth="0.7" />
      <circle cx="100" cy="186" r="2.4" fill="var(--s)" />
      <rect x="70" y="216" width="60" height="5" fill="var(--s)" />
      <g stroke="var(--s)" strokeWidth="0.6" style={{ fill: DARK_WOOD }}>
        <rect x="76" y="221" width="8" height="29" />
        <rect x="116" y="221" width="8" height="29" />
        <rect x="84" y="221" width="16" height="29" />
        <rect x="100" y="221" width="16" height="29" />
      </g>
      <path d="M92 231.5l3 4-3 4-3-4zM108 231.5l3 4-3 4-3-4z" fill="var(--s)" />
    </svg>
  );
}

export function WayangKayon({ phase, names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const opening = phase === 'opening';
  const quick = { duration: 0.25 };
  // Lapisan kelir (latar, blencong) & gedebog menghilang saat bayangan sudah menutupi layar.
  const veil = {
    initial: false as const,
    animate: { opacity: opening ? 0 : 1 },
    transition: opening ? (reduced ? quick : { delay: OPEN.veil, duration: 0.3 }) : { duration: 0 },
  };

  return (
    <>
      <motion.div className="absolute inset-0" {...veil} aria-hidden>
        <div className="absolute inset-0" style={{ background: KELIR }} />
        <div className="g-flicker absolute inset-0" style={{ background: LAMP_GLOW }} />
        <div className="absolute inset-x-0 top-0 h-[3.2cqh] border-b-2 border-[var(--s)]" style={{ background: PARANG }} />
        {/* blencong: pelita minyak yang menerangi kelir */}
        <div className="absolute left-1/2 top-[3.2cqh] h-[6.5cqh] -translate-x-1/2">
          <svg viewBox="0 0 40 52" className="h-full w-auto overflow-visible" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 0V12" stroke="var(--s)" strokeWidth="1.2" />
            <path d="M20 12c-4 0-4 6 0 6" fill="none" stroke="var(--s)" strokeWidth="1.2" />
            <path d="M4 26C9 22 14 24 20 24S31 22 36 26C34 36 27 40 20 40S6 36 4 26Z" stroke="var(--s)" strokeWidth="1" style={{ fill: DARK_WOOD }} />
            <path d="M8 28H32" stroke="var(--s)" strokeWidth="0.8" opacity="0.8" />
            <path className="g-flame" d="M20 23C15.5 17 18 11 20 6C22 11 24.5 17 20 23Z" fill="#ffd566" stroke="#ff9f2e" strokeWidth="0.8" />
          </svg>
        </div>
      </motion.div>

      {/* bayangan gunungan di kelir: ikut bergoyang, lalu membesar menembus pintu gapura */}
      <motion.div
        className="pointer-events-none absolute bottom-[3.5cqh] left-1/2 aspect-[200/320] h-[58cqh] -translate-x-1/2 origin-[50%_94%]"
        initial={false}
        animate={{ rotate: opening && !reduced ? WOBBLE : 0 }}
        transition={opening ? { duration: OPEN.wobble, ease: 'easeInOut' } : { duration: 0 }}
        aria-hidden
      >
        <motion.div
          className="h-full w-full origin-[50%_73.4%]"
          initial={{ opacity: 0, x: '3%', y: '12%', scale: 1.03 }}
          animate={
            !opening
              ? { opacity: 0.3, x: '3%', y: '1%', scale: 1.03 }
              : reduced
                ? { opacity: 0 }
                : { opacity: ZOOM.opacity, x: ZOOM.x, y: ZOOM.y, scale: ZOOM.scale }
          }
          transition={!opening ? { delay: ENTER, duration: 0.8, ease: 'easeOut' } : reduced ? quick : { duration: OPEN.total, times: ZOOM.times, ease: ['easeInOut', 'easeIn', 'linear', 'linear', 'linear', 'linear'] }}
        >
          <svg viewBox="0 0 200 320" className="h-full w-full overflow-visible">
            <path d={SHADOW} fillRule="evenodd" style={{ fill: SHADOW_FILL }} />
          </svg>
        </motion.div>
      </motion.div>

      {/* gunungan: ditancapkan saat dibuka, digoyang lalu dicabut saat diketuk */}
      <motion.div
        className="pointer-events-none absolute bottom-[3.5cqh] left-1/2 aspect-[200/320] h-[58cqh] -translate-x-1/2 origin-[50%_94%]"
        initial={{ opacity: 0, y: '12%' }}
        animate={
          !opening
            ? { opacity: 1, y: '0%', rotate: 0, scale: 1 }
            : reduced
              ? { opacity: 0 }
              : { rotate: WOBBLE, y: [null, '0%', '-16%'], scale: [null, 1, 1.14], opacity: [null, 1, 0] }
        }
        transition={
          !opening
            ? { delay: ENTER, duration: 0.8, ease: 'easeOut' }
            : reduced
              ? quick
              : {
                  rotate: { duration: OPEN.wobble, ease: 'easeInOut' },
                  y: { duration: OPEN.lift, times: [0, 0.55, 1], ease: 'easeIn' },
                  scale: { duration: OPEN.lift, times: [0, 0.55, 1], ease: 'easeIn' },
                  opacity: { duration: OPEN.lift, times: [0, 0.6, 1] },
                }
        }
        aria-hidden
      >
        <Gunungan reduced={reduced} />
      </motion.div>

      {/* gedebog (batang pisang) tempat wayang ditancapkan, di depan tangkai gunungan */}
      <motion.div className="absolute inset-x-0 bottom-0 h-[13cqh]" {...veil} aria-hidden>
        <div className="absolute inset-0 rounded-t-[40%_14px] border-t border-[#a8975c]" style={{ background: GEDEBOG }} />
        <div className="absolute inset-0 rounded-t-[40%_14px]" style={{ background: GEDEBOG_FIBER }} />
      </motion.div>

      {/* tulisan */}
      <motion.div
        className="absolute inset-x-0 top-[11cqh] px-[9%] text-center text-[var(--tx)]"
        initial={false}
        animate={opening ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
        transition={opening ? { duration: reduced ? 0.2 : 0.4 } : { duration: 0 }}
      >
        <motion.small
          className="block text-[10px] uppercase tracking-[0.32em] text-[color-mix(in_srgb,var(--tx)_75%,transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 0.5, duration: 0.5 }}
        >
          {kicker}
        </motion.small>
        <motion.b
          className="mt-1.5 block text-[1.8rem] leading-tight text-[color-mix(in_srgb,var(--p)_75%,#000)]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { delay: 0.7, duration: 0.6 }}
        >
          <span style={{ fontFamily: headingFamily, fontWeight: 600 }}>{names}</span>
        </motion.b>
        <motion.div
          className="mx-auto mt-2 flex w-24 items-center gap-2 text-[var(--s)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 0.95, duration: 0.4 }}
        >
          <span className="h-px flex-1 bg-current" />
          <span className="h-1.5 w-1.5 rotate-45 bg-current" />
          <span className="h-px flex-1 bg-current" />
        </motion.div>
        <motion.p
          className="mt-2 text-[11px] tracking-wide text-[color-mix(in_srgb,var(--tx)_80%,transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { delay: 1.1, duration: 0.4 }}
        >
          {DEAR}
        </motion.p>
        <Inscription text={guest || GUEST_FALLBACK} reduced={reduced} start={WRITE_START} className="text-[var(--tx)]" sparkClassName="bg-[var(--s)] shadow-[0_0_8px_2px_var(--s)]" />
      </motion.div>
    </>
  );
}
