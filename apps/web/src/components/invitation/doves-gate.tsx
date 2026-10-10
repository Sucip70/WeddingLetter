'use client';

// Gerbang "Sepasang merpati": dua merpati melayang di langit pagi, saling berhadapan, membawa untaian pita tempat
// sepucuk surat bersegel lily tergantung. Ketukan pada `.wl-gate` (gates.tsx) mengubah `phase` ke 'opening': kepakan
// makin cepat, tutup amplop terbuka, surat naik dalam semburan cahaya, kelopak lily & bulu berhamburan, lalu kedua
// merpati terbang ke kiri dan kanan — di belakang mereka langit terbelah dari tengah (celah selebar `--sw`, tepinya
// berawan) dan menyingkap sampul (REVEALS_COVER). Merpati & lily digambar di dove-art.tsx; warna dari --p/--s/--tx.
// Gerak sekali jalan memakai Motion; kepakan sayap & awan melayang memakai CSS (ringan).
import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import { Dove, LilyBloom, LilySprig } from './dove-art';
import { CLOUD_BG, Particles } from './effects';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';
import { ORNAMENTS } from './ornaments';

const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// ----- waktu (detik sejak ketukan). GATE_MS.doves & REVEAL_DELAY_MS.doves (gates.tsx) mengikuti ini. -----
export const DOVES_T = { flap: 0.05, flapDur: 0.8, letter: 0.4, burst: 0.5, fly: 0.55, flyDur: 1.6, slit: 0.95, slitDur: 1.5 };

const SW_CLOSED = -10; // lebar setengah celah (% lebar layar); negatif = tertutup penuh
const SW_OPEN = 62;
const SLIT_EASE = [0.3, 0.1, 0.2, 1] as [number, number, number, number];

// Awan melayang di langit (kelas .wl-cloud di globals.css menggerakkan translateX).
const CLOUDS = [
  { top: 9, w: 40, h: 11, dur: 96, del: -20, o: 0.9 },
  { top: 22, w: 30, h: 8.5, dur: 120, del: -78, o: 0.75 },
  { top: 58, w: 46, h: 12, dur: 110, del: -44, o: 0.85 },
  { top: 66, w: 32, h: 9, dur: 84, del: -8, o: 0.7 },
];
const cloudBg = CLOUD_BG;

// Gumpalan awan di tepi celah (kolom di kiri & kanan, ikut melebar bersama --sw).
const PUFFS = Array.from({ length: 8 }, (_, i) => ({ top: r3(-6 + i * 14 + (rand(i, 1) - 0.5) * 4), size: r3(26 + rand(i, 2) * 14), dx: r3((rand(i, 3) - 0.5) * 6), o: r3(0.9 + rand(i, 4) * 0.1) }));

// Kelopak lily & bulu yang berhamburan dari surat (px dari pusat amplop).
const BITS = Array.from({ length: 24 }, (_, i) => {
  const feather = i % 4 === 3;
  const a = (-150 + rand(i, 5) * 120) * (Math.PI / 180);
  const dist = 60 + rand(i, 6) * 150;
  return {
    id: i,
    feather,
    x1: r3(Math.cos(a) * dist),
    y1: r3(Math.sin(a) * dist - 20),
    x2: r3(Math.cos(a) * dist * 1.25 + (rand(i, 7) - 0.5) * 80),
    y2: r3(Math.sin(a) * dist * 0.6 + 120 + rand(i, 8) * 150),
    size: r3(feather ? 16 + rand(i, 9) * 8 : 12 + rand(i, 9) * 12),
    spin: r3((rand(i, 10) - 0.5) * 420),
    delay: r3(DOVES_T.burst + rand(i, 11) * 0.35),
    duration: r3(1.5 + rand(i, 12) * 0.9),
  };
});

const SKY = 'linear-gradient(180deg, color-mix(in oklch, var(--p) 52%, white) 0%, color-mix(in oklch, var(--p) 24%, white) 44%, color-mix(in oklch, var(--s) 26%, #fffdf8) 100%)';
const INK = 'color-mix(in oklch, var(--tx) 92%, var(--p))';

function Cloud({ c }: { c: (typeof CLOUDS)[number] }) {
  return <div className="wl-cloud absolute left-0" style={{ top: `${c.top}%`, width: `${c.w}cqw`, height: `${c.h}cqw`, background: cloudBg, opacity: c.o, animationDuration: `${c.dur}s`, animationDelay: `${c.del}s` }} aria-hidden />;
}

// Satu merpati di dalam kelompok: menghadap ke tengah (yang kanan dicerminkan), bergerak sendiri saat terbang.
function FlyingDove({ side, opening, reduced }: { side: 'l' | 'r'; opening: boolean; reduced: boolean }) {
  const dir = side === 'l' ? -1 : 1;
  const full = opening && !reduced;
  return (
    <motion.div
      className="absolute"
      style={{ top: 0, width: '30cqw', [side === 'l' ? 'left' : 'right']: '4cqw', transformOrigin: '50% 60%' } as CSSProperties}
      initial={false}
      // Lepas landas: sedikit merunduk ke tengah, berbalik menghadap arah terbang (scaleX 1 -> -1 lewat pipih), lalu menanjak
      // melengkung keluar layar dengan hidung terangkat. Merpati kanan sudah dicerminkan di dalam, jadi pembalikannya sama.
      animate={
        full
          ? {
              x: ['0%', `${-dir * 4}%`, `${dir * 130}%`, `${dir * 340}%`],
              y: ['0%', '3%', '-42%', '-120%'],
              rotate: [dir * -6, dir * -2, dir * 14, dir * 20],
              scale: [1, 1, 1.12, 1.4],
              scaleX: [1, 1, -1, -1],
            }
          : opening
            ? { opacity: 0 }
            : { x: '0%', y: '0%', rotate: dir * -6, scale: 1, scaleX: 1 }
      }
      transition={
        full
          ? {
              delay: DOVES_T.fly,
              duration: DOVES_T.flyDur,
              times: [0, 0.14, 0.5, 1],
              ease: ['easeOut', 'easeInOut', 'easeIn'],
              scaleX: { delay: DOVES_T.fly + 0.06, duration: 0.45, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' },
            }
          : { duration: 0.2 }
      }
    >
      <Dove className={side === 'r' ? '-scale-x-100' : ''} speed={full ? 0.5 : 0.8} style={{ '--flap-delay': side === 'r' ? '-0.35s' : '0s' } as CSSProperties} />
    </motion.div>
  );
}

export function DovesGate({ phase, names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const opening = phase === 'opening';
  const full = opening && !reduced;
  const [groom = '', bride = ''] = names.split(' & ');
  const Divider = ORNAMENTS.lily.Divider;

  // Dua gradien (kiri & kanan) digabung (union): tersisa hanya bagian luar celah; tepi dalamnya lembut seperti kabut.
  const mask = 'linear-gradient(90deg, #000 calc(50% - var(--sw) * 1% - 9%), transparent calc(50% - var(--sw) * 1%)), linear-gradient(270deg, #000 calc(50% - var(--sw) * 1% - 9%), transparent calc(50% - var(--sw) * 1%))';
  const swTransition = opening ? { delay: reduced ? 0 : DOVES_T.slit, duration: reduced ? 0.25 : DOVES_T.slitDur, ease: SLIT_EASE } : { duration: 0 };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ===== langit (celahnya melebar) + gumpalan awan di tepi celah ===== */}
      <motion.div className="absolute inset-0" style={{ '--sw': SW_CLOSED } as CSSProperties} initial={false} animate={{ '--sw': opening ? SW_OPEN : SW_CLOSED } as Record<string, number>} transition={swTransition}>
        <div className="absolute inset-0" style={{ WebkitMaskImage: mask, maskImage: mask }}>
          <div className="absolute inset-0" style={{ background: SKY }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 46% at 50% 62%, rgba(255,250,232,.95) 0, rgba(255,246,222,.5) 42%, transparent 72%)' }} />
          {/* sinar fajar berputar sangat pelan */}
          <div className="pointer-events-none absolute left-1/2 top-[60%] h-[230%] w-[230%] -translate-x-1/2 -translate-y-1/2" style={{ WebkitMaskImage: 'radial-gradient(circle, #000 0, transparent 40%)', maskImage: 'radial-gradient(circle, #000 0, transparent 40%)' }}>
            <div className="wl-rays h-full w-full" style={{ backgroundImage: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,.55) 0deg 3deg, transparent 3deg 13deg)' }} />
          </div>
          {CLOUDS.map((c, i) => (
            <Cloud key={i} c={c} />
          ))}
          <Particles kind="feather" count={9} mode="fall" height="100cqh" />

          {/* tamu & nama */}
          <div className="absolute inset-x-0 top-[6.5%] flex flex-col items-center px-6 text-center" style={{ color: INK }}>
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 12, letterSpacing: '0.42em', textTransform: 'uppercase', opacity: 0.75 }}>{kicker}</p>
            <h2 className="mt-2 leading-[1.12]" style={{ fontFamily: headingFamily, fontSize: names.length > 24 ? '2.8rem' : '3.3rem', fontWeight: 400, color: 'var(--p)', textShadow: '0 0 22px rgba(255,255,255,.95), 0 1px 0 rgba(255,255,255,.8)' }}>
              {names}
            </h2>
            <div className="mt-1" style={{ color: 'var(--p)' }}>
              <Divider className="w-36" />
            </div>
          </div>

          {/* tumpukan awan di dasar + rangkaian lily */}
          <div className="absolute inset-x-0 bottom-0 h-[26%]" style={{ background: 'linear-gradient(transparent, rgba(255,255,255,.9) 62%, #fff)' }} />
          {[
            { left: '-8cqw', flip: false, d: '0s' },
            { right: '-8cqw', flip: true, d: '-2.4s' },
          ].map((s, i) => (
            <motion.div
              key={i}
              className="absolute bottom-[3%] w-[34cqw]"
              style={{ left: s.left, right: s.right, color: 'var(--p)', transformOrigin: '50% 100%' }}
              animate={reduced ? undefined : { rotate: [-1.6, 1.6, -1.6] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: i * -2.4 }}
            >
              <LilySprig flip={s.flip} className="w-full" />
            </motion.div>
          ))}
          <div className="absolute inset-x-0 bottom-0 h-[11%]" style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 100%, #fff 0, rgba(255,255,255,.96) 50%, transparent 78%)' }} />

          <div className="absolute inset-x-0 bottom-[19%] px-6 text-center" style={{ color: INK }}>
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 11.5, letterSpacing: '0.34em', textTransform: 'uppercase', opacity: 0.7 }}>{STRINGS.id.dear}</p>
            <p className="mt-1 text-[1.35rem] italic" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600 }}>
              {guest || STRINGS.id.guestFallback}
            </p>
          </div>
        </div>

        {/* gumpalan awan mengikuti tepi celah */}
        {opening && (
          <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : DOVES_T.slit - 0.05, duration: 0.2 }}>
            {(['l', 'r'] as const).map((side) =>
              PUFFS.map((p, i) => (
                <div
                  key={`${side}${i}`}
                  className="pointer-events-none absolute"
                  style={{
                    top: `${p.top}%`,
                    left: '50%',
                    width: `${p.size * 1.7}cqw`,
                    height: `${p.size * 0.78}cqw`,
                    marginLeft: `${-p.size * 0.85 + p.dx}cqw`,
                    transform: `translateX(calc(var(--sw) * ${side === 'l' ? -1 : 1}cqw + ${side === 'l' ? -4.5 : 4.5}cqw))`,
                    background: cloudBg,
                    opacity: p.o,
                  }}
                  aria-hidden
                />
              )),
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ===== kelompok: merpati + pita + surat ===== */}
      <motion.div
        className="absolute inset-x-0"
        style={{ top: '31cqh', height: '56cqw' }}
        initial={false}
        animate={full ? { y: 0 } : reduced ? { y: 0 } : { y: [0, -7, 0] }}
        transition={full ? { duration: 0.3 } : { duration: 5.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* pita (ikut memudar saat dibuka) */}
        <motion.svg
          viewBox="0 0 100 56"
          className="absolute left-0 top-0 w-full overflow-visible"
          style={{ height: '56cqw' }}
          initial={false}
          animate={{ opacity: opening ? 0 : 1 }}
          transition={{ duration: 0.25, delay: opening ? 0.05 : 0 }}
          fill="none"
          aria-hidden
        >
          <path d="M30.6 9Q50 41 69.4 9" stroke="var(--s)" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M30.6 9Q50 41 69.4 9" stroke="rgba(255,255,255,.7)" strokeWidth=".35" strokeLinecap="round" transform="translate(0 -.3)" />
          <path d="M30.6 9q-3.2 2-3.6 6.4M69.4 9q3.2 2 3.6 6.4" stroke="var(--s)" strokeWidth="1" strokeLinecap="round" />
          {/* simpul pita di tengah */}
          <g transform="translate(0 1.4)">
          <path d="M50 24C44 18.500 39.500 21.500 42.500 25.500C45.500 28 48.500 26.500 50 24ZM50 24C56 18.500 60.500 21.500 57.500 25.500C54.500 28 51.500 26.500 50 24Z" fill="var(--s)" stroke="color-mix(in srgb, var(--s) 60%, #6b5a30)" strokeWidth=".35" />
          <path d="M50 24L46 31.500M50 24L54 31.500" stroke="var(--s)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="50" cy="24" r="1.3" fill="color-mix(in srgb, var(--s) 70%, #6b5a30)" />
          </g>
        </motion.svg>

        <FlyingDove side="l" opening={opening} reduced={reduced} />
        <FlyingDove side="r" opening={opening} reduced={reduced} />

        {/* cahaya di balik surat */}
        <motion.div
          className="pointer-events-none absolute"
          style={{ left: '25cqw', top: '18cqw', width: '50cqw', height: '50cqw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,252,238,1) 0, rgba(255,244,205,.7) 30%, rgba(255,240,200,0) 68%)' }}
          initial={false}
          animate={full ? { opacity: [0, 1, 0.5, 0], scale: [0.4, 1.2, 1.8, 2.4] } : { opacity: 0, scale: 0.4 }}
          transition={full ? { delay: DOVES_T.letter, duration: 1.6, times: [0, 0.3, 0.65, 1], ease: 'easeOut' } : { duration: 0 }}
        />

        {/* surat bersegel lily */}
        <motion.div
          className="absolute"
          style={{ left: '33cqw', top: '25.4cqw', width: '34cqw', height: '23cqw', perspective: '90cqw' }}
          initial={false}
          animate={full ? { y: ['0cqw', '1cqw', '-1cqw', '-9cqw'], scale: [1, 0.98, 1.03, 1.12], opacity: [1, 1, 1, 0] } : opening ? { opacity: 0 } : { y: 0, scale: 1, opacity: 1 }}
          transition={full ? { delay: 0.1, duration: 1.7, times: [0, 0.15, 0.4, 1], ease: 'easeInOut', opacity: { delay: 0.1, duration: 1.7, times: [0, 0.4, 0.7, 1] } } : { duration: 0.2 }}
        >
          <div className="absolute inset-0 rounded-[1.1cqw]" style={{ background: 'linear-gradient(160deg, #fffdf8, #f1e9d6)', border: '1px solid color-mix(in srgb, var(--s) 50%, #d6c9a8)', boxShadow: '0 2.2cqw 3.6cqw -1.6cqw color-mix(in srgb, var(--p) 55%, transparent)' }} />
          {/* kartu surat yang terangkat */}
          <motion.div
            className="absolute flex flex-col items-center justify-center rounded-[.8cqw] text-center"
            style={{ left: '7%', right: '7%', top: '8%', bottom: '8%', zIndex: 1, background: '#fffefb', border: '1px solid color-mix(in srgb, var(--s) 45%, #e4dac0)', color: 'var(--p)' }}
            initial={false}
            animate={full ? { y: ['0%', '0%', '-78%'], scale: [1, 1, 1.06] } : { y: '0%', scale: 1 }}
            transition={full ? { delay: DOVES_T.letter, duration: 1.0, times: [0, 0.18, 1], ease: 'easeOut' } : { duration: 0 }}
          >
            <span style={{ fontFamily: headingFamily, fontSize: '5.6cqw', lineHeight: 1 }}>
              {(groom.trim().charAt(0) || 'A').toUpperCase()} <span style={{ fontSize: '0.6em' }}>&amp;</span> {(bride.trim().charAt(0) || 'S').toUpperCase()}
            </span>
            <LilyBloom className="mt-[1.2cqw] w-[5cqw]" />
          </motion.div>
          {/* saku depan */}
          <div className="absolute inset-0" style={{ zIndex: 2, clipPath: 'polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)', background: 'linear-gradient(180deg, #fbf5e6, #efe5cf)', borderRadius: '1.1cqw' }} />
          <svg viewBox="0 0 34 23" className="absolute inset-0 h-full w-full" style={{ zIndex: 2 }} fill="none" aria-hidden>
            <path d="M.4 22.6L14 11.500M33.600 22.600L20 11.500M.4.4L17 12.500L33.600.4" stroke="color-mix(in srgb, var(--s) 55%, #cdbf9c)" strokeWidth=".35" />
          </svg>
          {/* tutup amplop: dua sisi (luar bersegel, dalam berlapis biru muda) */}
          <motion.div
            className="absolute inset-x-0 top-0"
            style={{ height: '56%', transformOrigin: '50% 0%', transformStyle: 'preserve-3d' }}
            initial={false}
            animate={full ? { rotateX: [0, 0, -178], zIndex: [4, 4, 0] } : { rotateX: 0, zIndex: 4 }}
            transition={full ? { delay: 0.15, duration: 0.95, times: [0, 0.2, 1], ease: 'easeInOut' } : { duration: 0 }}
          >
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'linear-gradient(180deg, #f6eed9, #ebe0c6)' }}>
              <span className="absolute left-1/2 top-[66%] flex h-[6.4cqw] w-[6.4cqw] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--p) 55%, #fff), var(--p) 62%, color-mix(in srgb, var(--p) 70%, #101a33))', boxShadow: '0 .5cqw 1cqw rgba(30,40,70,.4)', color: '#fff' }}>
                <LilyBloom className="w-[4.4cqw]" />
              </span>
            </div>
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)', background: 'linear-gradient(180deg, color-mix(in srgb, var(--p) 22%, #fff), color-mix(in srgb, var(--p) 12%, #fff))' }} />
          </motion.div>
        </motion.div>

        {/* kelopak lily & bulu */}
        {full && (
          <div className="pointer-events-none absolute left-1/2" style={{ top: '37cqw', width: 0, height: 0 }} aria-hidden>
            {BITS.map((b) => (
              <motion.div
                key={b.id}
                className="absolute"
                style={{ width: b.size, height: b.size, left: -b.size / 2, top: -b.size / 2, color: 'var(--p)' }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                animate={{ x: [0, b.x1, b.x2], y: [0, b.y1, b.y2], opacity: [0, 1, 1, 0], scale: [0.3, 1, 1], rotate: b.spin }}
                transition={{ delay: b.delay, duration: b.duration, times: [0, 0.38, 1], ease: ['easeOut', 'easeIn'], opacity: { delay: b.delay, duration: b.duration, times: [0, 0.12, 0.75, 1] } }}
              >
                {b.feather ? (
                  <svg viewBox="0 0 24 24" className="h-full w-full" fill="color-mix(in srgb, var(--p) 18%, #fff)" stroke="color-mix(in srgb, var(--p) 40%, #fff)" strokeWidth=".6">
                    <path d="M20.500 2.500C11 3 5.500 8.500 4 19.500c.9-1.100 2-2 3.200-2.400C13.500 17 18.500 11.500 20.500 2.500Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-full w-full" fill="#fff" stroke="currentColor" strokeWidth=".8" strokeLinejoin="round">
                    <path d="M12 1.500C17 7 17 15 12 22.500C7 15 7 7 12 1.500Z" />
                    <path d="M12 5V19" strokeOpacity=".45" strokeWidth=".6" />
                  </svg>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
