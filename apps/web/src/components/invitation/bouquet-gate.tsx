'use client';

// Gerbang "Lempar buket" (Buket Pengantin): buket pengantin berpita melayang pelan di tengah halaman putih bertabur kelopak.
// Ketukan pada `.wl-gate` (gates.tsx) mengubah `phase` ke 'opening': buket menunduk sesaat (ancang-ancang), dilempar ke atas
// sambil berputar dan menyusut, di puncaknya meledak jadi kilatan dan hamburan kelopak & bunga kecil warna-warni. Selagi
// kelopak berjatuhan, dinding bunga naik dari dasar layar menghapus latar putih di belakangnya (REVEALS_COVER), jadi sampul
// tersingkap mengikuti sapuan bunga. Bunga digambar di flora-art.ts / flora-comp.ts; warna bunga utama mengikuti --s.
// Gerak sekali jalan memakai Motion; goyangan buket memakai Motion berulang yang ringan; partikel jatuh memakai CSS.
import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import { BloomCorner, BloomDivider, PETAL_COLORS } from './bloom-parts';
import { Particles } from './effects';
import { bouquetHead, bouquetStems, flowerBand, paperLeft, paperRight, ribbonBand, ribbonBow } from './flora-comp';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';

const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// ----- waktu (detik sejak ketukan). GATE_MS.bouquet & REVEAL_DELAY_MS.bouquet (gates.tsx) mengikuti ini. -----
export const BOUQUET_T = { squash: 0.3, launch: 0.3, launchDur: 0.95, pop: 1.2, wipe: 0.95, wipeDur: 1.9 };

// Titik puncak lemparan, relatif terhadap pusat buket (cqw/cqh = persen lebar/tinggi gerbang).
const APEX = { x: 12, y: -26 };

const BOUQUET = bouquetStems() + paperLeft() + paperRight() + bouquetHead() + ribbonBand() + ribbonBow();
const BAND = flowerBand();
const BAND_B = flowerBand();

const PETAL = 'M12 1.5C17.500 6 18 14 12 22.500C6 14 6.500 6 12 1.500Z';
const WIPE_MASK = 'linear-gradient(to top, transparent calc(var(--wipe) - 14%), #000 var(--wipe))';
const INK = 'color-mix(in srgb, var(--tx) 90%, var(--p))';

// Kelopak yang lepas sepanjang lintasan lemparan (posisi awal = titik di lintasan pada saat itu).
const TRAIL = Array.from({ length: 14 }, (_, i) => {
  const u = 0.1 + (i / 14) * 0.85;
  const e = 1 - (1 - u) * (1 - u);
  return {
    id: i,
    left: r3(50 + APEX.x * u),
    top: r3(APEX.y * e),
    delay: r3(BOUQUET_T.launch + u * BOUQUET_T.launchDur),
    dx: r3((rand(i, 1) - 0.5) * 160),
    dy: r3(120 + rand(i, 2) * 220),
    size: r3(11 + rand(i, 3) * 11),
    spin: r3((rand(i, 4) - 0.5) * 540),
    color: PETAL_COLORS[i % PETAL_COLORS.length]!,
    duration: r3(1.3 + rand(i, 5) * 0.8),
  };
});

// Hamburan di puncak: kelopak dan bunga kecil menyebar ke segala arah lalu jatuh.
const BURST = Array.from({ length: 52 }, (_, i) => {
  const a = rand(i, 6) * Math.PI * 2;
  const d = 80 + rand(i, 7) * 230;
  const flower = i % 3 === 0;
  const heart = i % 7 === 4;
  return {
    id: i,
    flower,
    heart,
    x1: r3(Math.cos(a) * d),
    y1: r3(Math.sin(a) * d * 0.8 - 40),
    x2: r3(Math.cos(a) * d * 1.25 + (rand(i, 8) - 0.5) * 90),
    y2: r3(Math.sin(a) * d * 0.8 + 230 + rand(i, 9) * 260),
    size: r3(flower ? 20 + rand(i, 10) * 14 : heart ? 16 + rand(i, 10) * 10 : 16 + rand(i, 10) * 18),
    spin: r3((rand(i, 11) - 0.5) * 620),
    delay: r3(BOUQUET_T.pop + rand(i, 12) * 0.22),
    duration: r3(1.5 + rand(i, 13) * 1.0),
    color: PETAL_COLORS[(i * 3) % PETAL_COLORS.length]!,
  };
});

function MiniBlossom({ color }: { color: string }) {
  return (
    <svg viewBox="-12 -12 24 24" className="h-full w-full" aria-hidden>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx="0" cy="-5.600" r="4.800" transform={`rotate(${a})`} fill={color} stroke="rgba(120,60,90,.28)" strokeWidth=".5" />
      ))}
      <circle r="2.600" fill="#f8d86e" />
    </svg>
  );
}

export function BouquetGate({ phase, names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const opening = phase === 'opening';
  const full = opening && !reduced;
  const swTransition = opening ? { delay: reduced ? 0 : BOUQUET_T.wipe, duration: reduced ? 0.25 : BOUQUET_T.wipeDur, ease: [0.4, 0, 0.4, 1] as [number, number, number, number] } : { duration: 0 };

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--bw': 'min(62cqw, calc(51cqh - 112px))', '--cy': 'calc(46.5cqh + 25px)' } as CSSProperties}>
      <motion.div className="absolute inset-0" style={{ '--wipe': '0%' } as CSSProperties} initial={false} animate={{ '--wipe': opening ? '132%' : '0%' } as Record<string, string>} transition={swTransition}>
        {/* ===== latar putih bertabur awan pastel (terhapus oleh dinding bunga) ===== */}
        <div className="absolute inset-0" style={{ WebkitMaskImage: WIPE_MASK, maskImage: WIPE_MASK }}>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 26% at 6% 0%, rgba(246,179,195,.42), transparent 72%), radial-gradient(ellipse 64% 24% at 98% 4%, rgba(192,166,238,.36), transparent 72%), radial-gradient(ellipse 60% 22% at 0% 100%, rgba(156,199,238,.34), transparent 72%), radial-gradient(ellipse 66% 24% at 100% 96%, rgba(248,216,110,.32), transparent 72%), radial-gradient(ellipse 54% 30% at 50% 56%, rgba(255,255,255,1), transparent 78%), #fffdfc',
            }}
          />
          <Particles kind="blossom" count={11} mode="fall" height="100cqh" />

          {/* karangan sudut */}
          <div className="pointer-events-none absolute left-[-1cqw] top-[-1cqw] w-[30cqw]"><BloomCorner className="w-full" rotate={0} /></div>
          <div className="pointer-events-none absolute right-[-1cqw] top-[-1cqw] w-[30cqw]"><BloomCorner className="w-full" rotate={90} /></div>
          <div className="pointer-events-none absolute bottom-[-1cqw] left-[-1cqw] w-[26cqw]"><BloomCorner className="w-full" rotate={270} /></div>
          <div className="pointer-events-none absolute bottom-[-1cqw] right-[-1cqw] w-[26cqw]"><BloomCorner className="w-full" rotate={180} /></div>

          {/* nama */}
          <motion.div className="absolute inset-x-0 top-[12%] flex flex-col items-center px-[12cqw] text-center" style={{ color: INK }} initial={false} animate={{ opacity: opening ? 0 : 1 }} transition={{ duration: opening ? 0.35 : 0 }}>
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.75 }}>{kicker}</p>
            <h2 className="mt-1.5 leading-[1.12]" style={{ fontFamily: headingFamily, fontSize: names.length > 34 ? '2.2rem' : names.length > 22 ? '2.9rem' : '3.4rem', fontWeight: 400, color: 'var(--p)', textShadow: '0 0 18px #fff, 0 0 8px #fff' }}>
              {names}
            </h2>
            <BloomDivider className="mt-0.5 w-[44cqw]" />
          </motion.div>

          {/* bayangan di lantai + kelopak yang tergeletak */}
          <div className="absolute" style={{ left: 'calc(50cqw - var(--bw) * 0.46)', width: 'calc(var(--bw) * 0.92)', top: 'calc(var(--cy) + var(--bw) * 0.6)', height: 'calc(var(--bw) * 0.2)', background: 'radial-gradient(ellipse, color-mix(in srgb, var(--s) 34%, rgba(90,60,70,.4)) 0, transparent 70%)', filter: 'blur(5px)', opacity: 0.55 }} />
          {[[-0.5, 0.58, -30, 0], [0.42, 0.62, 40, 1], [-0.22, 0.66, 100, 2], [0.62, 0.55, -60, 3], [-0.62, 0.52, 10, 4]].map(([x, y, rot, c], i) => (
            <svg key={i} viewBox="0 0 24 24" className="absolute" style={{ left: `calc(50cqw + var(--bw) * ${x})`, top: `calc(var(--cy) + var(--bw) * ${y})`, width: 'calc(var(--bw) * 0.07)', transform: `rotate(${rot}deg)`, opacity: 0.9 }} aria-hidden>
              <path d={PETAL} fill={PETAL_COLORS[(c as number) % PETAL_COLORS.length]} stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
            </svg>
          ))}

          {/* tamu */}
          <motion.div className="absolute inset-x-0 bottom-[17%] px-6 text-center" style={{ color: INK }} initial={false} animate={{ opacity: opening ? 0 : 1 }} transition={{ duration: opening ? 0.35 : 0 }}>
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 13, fontStyle: 'italic', opacity: 0.75 }}>{STRINGS.id.dear}</p>
            <p className="mt-0.5 text-[1.4rem] font-semibold" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
              {guest || STRINGS.id.guestFallback}
            </p>
          </motion.div>
        </div>

        {/* ===== dinding bunga di muka sapuan (naik bersama --wipe) ===== */}
        {opening && !reduced && (
          <div className="pointer-events-none absolute inset-x-0 h-0" style={{ bottom: 'calc(var(--wipe) - 8%)' }} aria-hidden>
            <svg viewBox="0 0 400 100" preserveAspectRatio="xMidYMid slice" className="absolute left-0 w-full overflow-visible" style={{ bottom: '-10cqw', height: '27cqw', filter: 'drop-shadow(0 6px 8px rgba(120,60,90,.18))' }} dangerouslySetInnerHTML={{ __html: BAND }} />
            <svg viewBox="0 0 400 100" preserveAspectRatio="xMidYMid slice" className="absolute left-0 w-full overflow-visible" style={{ bottom: '-17cqw', height: '24cqw', scale: '-1 1', translate: '4cqw 0', opacity: 0.96 }} dangerouslySetInnerHTML={{ __html: BAND_B }} />
          </div>
        )}
      </motion.div>

      {/* ===== kelopak di sepanjang lintasan lemparan ===== */}
      {full &&
        TRAIL.map((p) => (
          <motion.div
            key={p.id}
            className="pointer-events-none absolute"
            style={{ left: `${p.left}cqw`, top: `calc(var(--cy) + ${p.top}cqh)`, width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, color: p.color }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{ x: [0, p.dx], y: [0, p.dy], opacity: [0, 1, 1, 0], scale: [0.4, 1, 1], rotate: p.spin }}
            transition={{ delay: p.delay, duration: p.duration, ease: 'easeIn', opacity: { delay: p.delay, duration: p.duration, times: [0, 0.1, 0.7, 1] } }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-full w-full">
              <path d={PETAL} fill="currentColor" stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
            </svg>
          </motion.div>
        ))}

      {/* ===== buket: goyang pelan -> menunduk -> dilempar ===== */}
      <motion.div
        className="absolute"
        style={{ left: 'calc(50cqw - var(--bw) / 2)', width: 'var(--bw)', height: 'calc(var(--bw) * 1.3333)', top: 'calc(var(--cy) - var(--bw) * 0.6667)' }}
        initial={false}
        animate={
          full
            ? { x: ['0cqw', `${APEX.x}cqw`], y: ['0cqh', `${APEX.y}cqh`], rotate: [0, -300], scale: [1, 0.72], opacity: [1, 1, 0] }
            : opening
              ? { opacity: 0 }
              : { x: '0cqw', y: '0cqh', rotate: 0, scale: 1, opacity: 1 }
        }
        transition={
          full
            ? {
                delay: BOUQUET_T.launch,
                duration: BOUQUET_T.launchDur,
                ease: [0.22, 0.6, 0.3, 1],
                opacity: { delay: BOUQUET_T.launch, duration: BOUQUET_T.launchDur + 0.18, times: [0, 0.82, 1] },
              }
            : { duration: 0.2 }
        }
      >
        {/* goyang pelan: animasi CSS (aman untuk SSR & "kurangi gerakan"); ancang-ancang menunduk: Motion di lapisan dalam */}
        <div className="wl-sway h-full w-full">
          <motion.div
            className="h-full w-full"
            style={{ transformOrigin: '50% 100%' }}
            initial={false}
            animate={full ? { scaleY: [1, 0.92, 1.05, 1], scaleX: [1, 1.05, 0.97, 1], y: [0, 6, -4, 0] } : undefined}
            transition={{ duration: BOUQUET_T.squash + 0.35, times: [0, 0.45, 0.8, 1], ease: 'easeOut' }}
          >
            <svg viewBox="0 0 300 400" className="h-full w-full overflow-visible" style={{ filter: 'drop-shadow(0 14px 14px rgba(120,60,90,.2))' }} dangerouslySetInnerHTML={{ __html: BOUQUET }} aria-hidden />
          </motion.div>
        </div>
      </motion.div>

      {/* ===== kilatan & hamburan di puncak ===== */}
      {full && (
        <>
          <motion.div
            className="pointer-events-none absolute"
            style={{ left: `calc(50cqw + ${APEX.x}cqw)`, top: `calc(var(--cy) + ${APEX.y}cqh)`, width: '90cqw', height: '90cqw', marginLeft: '-45cqw', marginTop: '-45cqw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,1) 0, rgba(255,228,240,.9) 22%, rgba(255,200,224,.5) 44%, transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 1.5] }}
            transition={{ delay: BOUQUET_T.pop - 0.05, duration: 0.75, times: [0, 0.3, 1], ease: 'easeOut' }}
            aria-hidden
          />
          <div className="pointer-events-none absolute" style={{ left: `calc(50cqw + ${APEX.x}cqw)`, top: `calc(var(--cy) + ${APEX.y}cqh)`, width: 0, height: 0 }} aria-hidden>
            {BURST.map((b) => (
              <motion.div
                key={b.id}
                className="absolute"
                style={{ width: b.size, height: b.size, left: -b.size / 2, top: -b.size / 2, color: b.color }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
                animate={{ x: [0, b.x1, b.x2], y: [0, b.y1, b.y2], opacity: [0, 1, 1, 0], scale: [0.2, 1, 1], rotate: b.spin }}
                transition={{ delay: b.delay, duration: b.duration, times: [0, 0.34, 1], ease: ['easeOut', 'easeIn'], opacity: { delay: b.delay, duration: b.duration, times: [0, 0.1, 0.72, 1] } }}
              >
                {b.flower ? (
                  <MiniBlossom color={b.color} />
                ) : b.heart ? (
                  <svg viewBox="0 0 24 24" className="h-full w-full">
                    <path d="M12 21C5 15 2 11.500 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3.500-3 7-10 13Z" fill="#ec7f9d" stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-full w-full">
                    <path d={PETAL} fill="currentColor" stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

