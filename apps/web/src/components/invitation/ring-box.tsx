'use client';

// Gerbang "Kotak cincin" (Elegan): kotak cincin beludru bermonogram emas melayang di bawah sorot lampu panggung, nama
// mempelai berlapis emas di atasnya. Ketukan pada `.wl-gate` (gates.tsx) mengubah `phase` ke 'opening':
// tutup kotak terbuka (3D CSS, engsel di belakang), cahaya hangat menyembur dari dalam, dua cincin — satu
// bermata berlian — terangkat dan berkilau, lalu cincin cahaya keemasan melebar dari cincin itu ke seluruh layar,
// menghapus latar gelap di belakangnya sehingga sampul tersingkap (REVEALS_COVER). Kotak memakai transformasi 3D CSS
// (preserve-3d) yang dianimasikan Motion; cincin logam memakai conic-gradient (tanpa gambar). Warna logam
// diturunkan dari --p, beludru & latar dari --tx (variabel --vel/--rb-* di GATE_CSS), jadi mengikuti palet tema.
// Dirancang untuk palet berlatar terang (teks gelap); pada palet berlatar gelap gerbang ini akan tampak terang.
import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { Particles, PatternLayer } from './effects';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';
import { ORNAMENTS } from './ornaments';

// Keacakan tetap (server = klien), dibulatkan supaya SSR = hidrasi (lihat letter-gust.tsx).
const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// Pusat cincin cahaya (% dari atas gerbang): di atas kotak, tempat cincin terangkat.
const CY = 46;
// Letak engsel/pusat kotak (% dari atas gerbang).
const BOX_TOP = 55;

// ----- waktu (detik sejak ketukan). GATE_MS.ring & REVEAL_DELAY_MS.ring (gates.tsx) mengikuti ini. -----
export const RING_T = { lid: 0.3, lidDur: 1.05, glow: 0.55, rise: 1.0, riseDur: 1.0, flare: 1.75, flash: 1.7, fade: 1.78, hole: 1.82, holeDur: 1.55 };

const PALE = 'color-mix(in srgb, var(--p) 32%, #fff6dc)';

// Serat beludru: derau putih tipis yang menambah kesan bulu halus.
const VELVET_PILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='v'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .3 -.05'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23v)'/%3E%3C/svg%3E\")";

// ----- percikan emas yang melesat keluar saat cahaya meledak -----
const SPARKS = Array.from({ length: 30 }, (_, i) => {
  const angle = (i / 30) * Math.PI * 2 + rand(i, 1) * 0.5;
  const dist = 90 + rand(i, 2) * 230;
  return {
    id: i,
    x: r3(Math.cos(angle) * dist),
    y: r3(Math.sin(angle) * dist),
    size: r3(7 + rand(i, 3) * 13),
    delay: r3(RING_T.flash + rand(i, 4) * 0.22),
    duration: r3(0.8 + rand(i, 5) * 0.7),
    spin: r3((rand(i, 6) - 0.5) * 240),
  };
});
// Kilau kecil yang berkelip di sekitar kotak sebelum diketuk (% posisi dari pusat adegan).
const GLINTS = [
  { x: -46, y: -26, s: 11, d: 0 },
  { x: 44, y: -34, s: 14, d: 0.9 },
  { x: -34, y: 24, s: 9, d: 1.7 },
  { x: 52, y: 14, s: 10, d: 2.3 },
  { x: -10, y: -52, s: 8, d: 1.2 },
  { x: 14, y: 40, s: 8, d: 2.8 },
];
const SPARKLE_PATH = 'M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z';

// Satu sisi kotak: panel bidang datar yang ditempatkan di ruang 3D. Sisi yang membelakangi kamera disembunyikan.
const face = (style: CSSProperties): CSSProperties => ({ position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...style });
const SATIN = 'radial-gradient(ellipse at 50% 30%, #fffdf6 0, #f1e8d4 58%, #d9cdb2 100%)';

// Pipa emas (garis logam) di tepi panel.
const piping = (pos: 'top' | 'bottom', px = 3): CSSProperties => ({ position: 'absolute', left: 0, right: 0, ...(pos === 'top' ? { top: 0 } : { bottom: 0 }), height: px, background: 'var(--foil-lit)' });

function Gem() {
  return (
    <svg viewBox="0 0 40 40" className="absolute left-1/2 -top-[27%] w-[46%] -translate-x-1/2 overflow-visible" aria-hidden>
      {/* cakar emas */}
      <path d="M9 21l-3 6M31 21l3 6M16 24l-2 5M24 24l2 5" stroke="var(--g1)" strokeWidth="2.2" strokeLinecap="round" />
      {/* mahkota & pavilion berlian */}
      <path d="M7 15L12.5 5H27.5L33 15L20 37Z" fill="#e8f5ff" stroke="rgba(255,255,255,.95)" strokeWidth=".9" strokeLinejoin="round" />
      <path d="M12.5 5L16 15L20 5L24 15L27.5 5" fill="rgba(255,255,255,.7)" />
      <path d="M7 15H33L20 37Z" fill="rgba(120,185,250,.42)" />
      <path d="M16 15L20 37L24 15Z" fill="rgba(255,255,255,.66)" />
      <path d="M7 15L16 15L20 37ZM33 15L24 15L20 37Z" fill="rgba(70,140,230,.2)" />
      <path d="M12.5 5L16 15M20 5L16 15M20 5L24 15M27.5 5L24 15M7 15H33M16 15L20 37M24 15L20 37" stroke="rgba(255,255,255,.9)" strokeWidth=".6" fill="none" />
    </svg>
  );
}

// Cincin logam: conic-gradient bercincin (masking) ber-highlight; bentuk bulat sempurna tanpa aset gambar.
function Band({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div className="absolute inset-0" style={style}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(from 22deg, var(--g3), var(--g1) 11%, var(--g0) 21%, var(--g2) 34%, var(--g4) 47%, var(--g1) 60%, var(--g0) 70%, var(--g2) 82%, var(--g3) 100%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 60.5%, #000 62%, #000 99%, transparent 100%)',
          maskImage: 'radial-gradient(circle, transparent 60.5%, #000 62%, #000 99%, transparent 100%)',
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.45))',
        }}
      />
      {/* tepi dalam yang gelap memberi kesan ketebalan */}
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18)', WebkitMaskImage: 'radial-gradient(circle, transparent 60%, #000 62%, #000 99%, transparent 100%)', maskImage: 'radial-gradient(circle, transparent 60%, #000 62%, #000 99%, transparent 100%)' }} />
      {children}
    </div>
  );
}

export function RingBox({ phase, names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const reduced = !!useReducedMotion();
  const opening = phase === 'opening';
  const full = opening && !reduced;
  const [groom = '', bride = ''] = names.split(' & ');
  const ia = groom.trim().charAt(0).toUpperCase();
  const ib = bride.trim().charAt(0).toUpperCase();
  const Divider = ORNAMENTS.deco.Divider;

  // Cincin cahaya: lubang melebar dari pusat (--hole dianimasikan Motion); tepinya bercahaya emas.
  const mask = `radial-gradient(circle at 50% ${CY}%, transparent var(--hole), #000 calc(var(--hole) + 7%))`;
  const edge = `radial-gradient(circle at 50% ${CY}%, transparent calc(var(--hole) - 1.5%), rgba(255,196,96,.38) calc(var(--hole) + 1.5%), rgba(255,248,222,.98) calc(var(--hole) + 3.2%), rgba(255,196,96,.42) calc(var(--hole) + 5%), transparent calc(var(--hole) + 8%))`;
  const holeAnim = { '--hole': opening ? '150%' : '-8%' } as Record<string, string>;
  const holeTransition = opening ? { delay: reduced ? 0 : RING_T.hole, duration: reduced ? 0.25 : RING_T.holeDur, ease: [0.3, 0.1, 0.2, 1] as [number, number, number, number] } : { duration: 0 };

  const vars = {
    '--w': 'min(60cqw, 37cqh)',
    '--d': 'calc(var(--w) * 0.7)',
    '--hb': 'calc(var(--w) * 0.36)',
    '--hl': 'calc(var(--w) * 0.25)',
    '--rs': 'calc(var(--w) * 0.34)',
    '--g0': 'color-mix(in srgb, var(--p) 28%, #fff8dc)',
    '--g1': 'color-mix(in srgb, var(--p) 66%, #ffe7a0)',
    '--g2': 'var(--p)',
    '--g3': 'color-mix(in srgb, var(--p) 56%, #2f1d00)',
    '--g4': 'color-mix(in srgb, var(--p) 38%, #1c1000)',
  } as CSSProperties;

  const velvet = (overlay: string): CSSProperties => ({ background: `${VELVET_PILE}, ${overlay}, var(--vel)` });

  return (
    <div className="absolute inset-0 overflow-hidden" style={vars}>
      {/* ===== latar gelap + nama (terhapus oleh cincin cahaya) ===== */}
      <motion.div className="absolute inset-0" style={{ '--hole': '-8%' } as CSSProperties} initial={false} animate={holeAnim} transition={holeTransition}>
        <div className="absolute inset-0" style={{ WebkitMaskImage: mask, maskImage: mask }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 85% 62% at 50% 44%, var(--rb-lit) 0, var(--rb-mid) 55%, var(--rb-dark) 100%)' }} />
          <PatternLayer kind="diamond" opacity={0.07} color="var(--p)" />
          {/* berkas sorot dari atas + kolam cahaya di lantai */}
          <div className="absolute inset-0" style={{ background: 'conic-gradient(from 156deg at 50% -8%, transparent 0deg, rgba(255,236,190,.16) 11deg, rgba(255,246,222,.3) 24deg, rgba(255,236,190,.16) 37deg, transparent 48deg)', filter: 'blur(12px)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 62% 15% at 50% 70%, rgba(255,222,150,.2), transparent 72%)' }} />
          <Particles kind="dust" count={22} mode="rise" height="100cqh" />

          <div className="absolute inset-x-0 top-[6%] flex flex-col items-center px-6 text-center">
            <p style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: 11, letterSpacing: '0.46em', textTransform: 'uppercase', color: PALE, opacity: 0.85 }}>{kicker}</p>
            <h2 className="wl-foil-lit wl-foil-anim mt-3 leading-[1.18]" style={{ fontFamily: headingFamily, fontSize: names.length > 24 ? '2.7rem' : '3.2rem', fontWeight: 400 }}>
              {names}
            </h2>
            <div className="mt-2" style={{ color: 'var(--p)' }}>
              <Divider className="w-36" />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[19%] px-6 text-center" style={{ color: PALE }}>
            <p style={{ fontFamily: 'var(--font-cinzel), serif', fontSize: 10, letterSpacing: '0.36em', textTransform: 'uppercase', opacity: 0.72 }}>{STRINGS.id.dear}</p>
            <p className="mt-1 text-[1.3rem] italic" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600 }}>
              {guest || STRINGS.id.guestFallback}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ===== kotak cincin ===== */}
      <motion.div
        className="absolute left-1/2"
        style={{ top: `${BOX_TOP}%`, width: 0, height: 0 }}
        initial={false}
        animate={opening ? (reduced ? { opacity: 0 } : { opacity: [1, 1, 0], scale: [1, 1.07, 1.2] }) : { opacity: 1, scale: 1 }}
        transition={opening ? (reduced ? { duration: 0.2 } : { duration: RING_T.fade + 0.45, times: [0, RING_T.fade / (RING_T.fade + 0.45), 1], ease: 'easeInOut' }) : { duration: 0 }}
      >
        {/* bayangan & pantulan di lantai */}
        <div className="absolute left-0 top-0" style={{ width: 'calc(var(--w) * 1.5)', height: 'calc(var(--w) * 0.42)', transform: 'translate(-50%, calc(var(--hb) * 0.5))', background: 'radial-gradient(ellipse, rgba(0,0,0,.6) 0, rgba(0,0,0,.28) 38%, transparent 70%)', filter: 'blur(6px)' }} />
        <div className="absolute left-0 top-0" style={{ width: 'calc(var(--w) * 1.7)', height: 'calc(var(--w) * 0.5)', transform: 'translate(-50%, calc(var(--hb) * 0.45))', background: 'radial-gradient(ellipse, rgba(255,214,130,.26) 0, transparent 66%)' }} />

        {/* kilau berkelip di sekeliling */}
        {GLINTS.map((g, i) => (
          <svg key={i} viewBox="0 0 24 24" className="wl-glint absolute" style={{ left: `calc(var(--w) * ${g.x / 100})`, top: `calc(var(--w) * ${g.y / 100})`, width: g.s, color: 'var(--g0)', animationDelay: `${g.d}s` }} fill="currentColor" aria-hidden>
            <path d={SPARKLE_PATH} />
          </svg>
        ))}

        {/* melayang pelan */}
        <motion.div
          className="absolute left-0 top-0"
          style={{ perspective: 'calc(var(--w) * 3.4)', perspectiveOrigin: '50% 30%' }}
          initial={false}
          animate={full ? { y: 0 } : reduced ? { y: 0 } : { y: [0, -7, 0] }}
          transition={full ? { duration: 0.3 } : { duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute left-0 top-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-23deg) rotateY(-19deg)' }}>
            {/* --- badan kotak (alas) --- */}
            <div style={face({ left: 'calc(var(--w) / -2)', top: 0, width: 'var(--w)', height: 'var(--hb)', transform: 'translateZ(calc(var(--d) / 2))', ...velvet('linear-gradient(180deg, rgba(255,255,255,.1), rgba(0,0,0,.34))') })}>
              <i style={piping('top')} />
              <i style={piping('bottom', 2)} />
            </div>
            <div style={face({ left: 'calc(var(--d) / -2)', top: 0, width: 'var(--d)', height: 'var(--hb)', transform: 'translateX(calc(var(--w) / 2)) rotateY(90deg)', ...velvet('linear-gradient(90deg, rgba(0,0,0,.5), rgba(0,0,0,.24))') })}>
              <i style={piping('top')} />
            </div>
            <div style={face({ left: 'calc(var(--d) / -2)', top: 0, width: 'var(--d)', height: 'var(--hb)', transform: 'translateX(calc(var(--w) / -2)) rotateY(-90deg)', ...velvet('linear-gradient(270deg, rgba(0,0,0,.5), rgba(0,0,0,.3))') })}>
              <i style={piping('top')} />
            </div>
            {/* bantal satin dengan celah cincin */}
            <div style={face({ left: 'calc(var(--w) / -2)', top: 'calc(var(--d) / -2)', width: 'var(--w)', height: 'var(--d)', transform: 'rotateX(90deg)', background: SATIN })}>
              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, rgba(130,100,50,.12) 0 2px, transparent 2px 10px)' }} />
              <div className="absolute inset-[3%]" style={{ border: '1px solid color-mix(in srgb, var(--p) 60%, transparent)' }} />
              <div className="absolute left-[12%] right-[12%] top-[40%] h-[18%] rounded-full" style={{ background: 'linear-gradient(#150e04, #3d2c12)', boxShadow: 'inset 0 4px 8px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.5)' }} />
            </div>

            {/* --- tutup kotak: engsel di tepi belakang --- */}
            <div className="absolute left-0 top-0" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(calc(var(--d) / -2))' }}>
              <motion.div
                className="absolute left-0 top-0"
                style={{ transformStyle: 'preserve-3d' }}
                initial={false}
                animate={full ? { rotateX: [null, -5, 121, 115] } : reduced ? { rotateX: opening ? 115 : 0 } : { rotateX: [0, 0, 7, 0, 0] }}
                transition={
                  full
                    ? { duration: RING_T.lidDur + 0.3, delay: RING_T.lid, times: [0, 0.14, 0.8, 1], ease: ['easeOut', 'easeInOut', 'easeOut'] }
                    : reduced
                      ? { duration: 0.2 }
                      : { duration: 7.5, repeat: Infinity, times: [0, 0.56, 0.62, 0.72, 1], ease: 'easeInOut' }
                }
              >
                {/* sisi atas (bermonogram) */}
                <div style={face({ left: 'calc(var(--w) / -2)', top: 'calc(var(--d) / -2)', width: 'var(--w)', height: 'var(--d)', overflow: 'hidden', transform: 'translateY(calc(var(--hl) * -1)) translateZ(calc(var(--d) / 2)) rotateX(90deg)', ...velvet('radial-gradient(ellipse at 38% 30%, rgba(255,255,255,.2), transparent 62%)') })}>
                  <div className="absolute inset-[5%]" style={{ border: '1px solid var(--g1)', boxShadow: 'inset 0 0 0 4px transparent, 0 0 0 1px rgba(0,0,0,.25)' }} />
                  <div className="absolute inset-[8%]" style={{ border: '1px solid color-mix(in srgb, var(--p) 55%, transparent)' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="wl-foil-lit flex items-baseline leading-none" style={{ fontFamily: 'var(--font-script), cursive', fontSize: 'calc(var(--w) * 0.27)', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.55))' }}>
                      <span>{ia}</span>
                      {ia && ib && <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '0.46em', fontStyle: 'italic', margin: '0 0.1em', transform: 'translateY(-0.3em)' }}>&amp;</span>}
                      <span>{ib}</span>
                    </span>
                  </div>
                  {!reduced && <div className="absolute inset-y-[-10%] left-0 w-[28%]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.26), transparent)', animation: 'wl-sheen 5.6s ease-in-out infinite' }} />}
                </div>
                {/* sisi depan + kancing emas */}
                <div style={face({ left: 'calc(var(--w) / -2)', top: 'calc(var(--hl) * -1)', width: 'var(--w)', height: 'var(--hl)', transform: 'translateZ(var(--d))', ...velvet('linear-gradient(180deg, rgba(255,255,255,.1), rgba(0,0,0,.3))') })}>
                  <i style={piping('top')} />
                  <i style={piping('bottom', 3)} />
                  <span className="absolute bottom-[-6%] left-1/2 h-[46%] w-[11%] -translate-x-1/2 rounded-[3px]" style={{ background: 'var(--foil-lit)', boxShadow: '0 2px 3px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.18)' }}>
                    <span className="absolute left-1/2 top-[34%] h-[22%] w-[24%] -translate-x-1/2 rounded-full" style={{ background: 'rgba(0,0,0,.55)' }} />
                  </span>
                </div>
                <div style={face({ left: 'calc(var(--d) / -2)', top: 'calc(var(--hl) * -1)', width: 'var(--d)', height: 'var(--hl)', transform: 'translateX(calc(var(--w) / 2)) translateZ(calc(var(--d) / 2)) rotateY(90deg)', ...velvet('linear-gradient(90deg, rgba(0,0,0,.5), rgba(0,0,0,.24))') })}>
                  <i style={piping('bottom', 2)} />
                </div>
                <div style={face({ left: 'calc(var(--d) / -2)', top: 'calc(var(--hl) * -1)', width: 'var(--d)', height: 'var(--hl)', transform: 'translateX(calc(var(--w) / -2)) translateZ(calc(var(--d) / 2)) rotateY(-90deg)', ...velvet('linear-gradient(270deg, rgba(0,0,0,.5), rgba(0,0,0,.3))') })}>
                  <i style={piping('bottom', 2)} />
                </div>
                {/* sisi dalam tutup: satin berlapis (terlihat saat terbuka) */}
                <div style={face({ left: 'calc(var(--w) / -2)', top: 'calc(var(--d) / -2)', width: 'var(--w)', height: 'var(--d)', transform: 'translateZ(calc(var(--d) / 2)) rotateX(-90deg)', background: SATIN })}>
                  <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, rgba(140,108,50,.13) 0 1px, transparent 1px 13px), repeating-linear-gradient(-45deg, rgba(140,108,50,.13) 0 1px, transparent 1px 13px)' }} />
                  <div className="absolute inset-[4%]" style={{ border: '1px solid color-mix(in srgb, var(--p) 65%, transparent)' }} />
                </div>
              </motion.div>
            </div>

            {/* --- cahaya, cincin: selalu menghadap kamera (kebalikan dari kemiringan adegan) --- */}
            <div className="absolute left-0 top-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(19deg) rotateX(23deg)' }}>
              <motion.div
                className="absolute"
                style={{ left: 'calc(var(--w) * -0.5)', top: 'calc(var(--w) * -0.78)', width: 'var(--w)', height: 'var(--w)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,240,190,.95) 0, rgba(255,205,110,.55) 28%, rgba(255,190,90,.14) 52%, transparent 68%)' }}
                initial={false}
                animate={full ? { opacity: [0, 1, 0.75], scale: [0.3, 1, 1.25] } : { opacity: 0, scale: 0.3 }}
                transition={full ? { delay: RING_T.glow, duration: 1.4, times: [0, 0.45, 1], ease: 'easeOut' } : { duration: 0 }}
              />
              {/* cincin polos (agak miring) */}
              <motion.div
                className="absolute"
                style={{ left: 'calc(var(--rs) * -0.09)', top: 'calc(var(--rs) * -0.5)', width: 'var(--rs)', height: 'var(--rs)', transformStyle: 'preserve-3d' }}
                initial={false}
                animate={full ? { y: [null, '-60%', '-68%'], rotate: [null, 9, 5] } : { y: '46%', rotate: -4 }}
                transition={full ? { delay: RING_T.rise + 0.12, duration: RING_T.riseDur, times: [0, 0.7, 1], ease: 'easeOut' } : { duration: 0 }}
              >
                <Band style={{ transform: 'rotateY(-26deg)' }} />
              </motion.div>
              {/* cincin bermata berlian */}
              <motion.div
                className="absolute"
                style={{ left: 'calc(var(--rs) * -0.91)', top: 'calc(var(--rs) * -0.5)', width: 'var(--rs)', height: 'var(--rs)', transformStyle: 'preserve-3d' }}
                initial={false}
                animate={full ? { y: [null, '-76%', '-84%'], rotate: [null, -8, -4] } : { y: '50%', rotate: 3 }}
                transition={full ? { delay: RING_T.rise, duration: RING_T.riseDur, times: [0, 0.7, 1], ease: 'easeOut' } : { duration: 0 }}
              >
                <Band>
                  <Gem />
                  {/* kilau bintang di berlian */}
                  <motion.svg
                    viewBox="-30 -30 60 60"
                    className="absolute left-1/2 overflow-visible"
                    style={{ top: '-24%', width: '92%', marginLeft: '-46%', marginTop: '-46%' }}
                    initial={false}
                    animate={full ? { opacity: [0, 1, 0.8, 1, 0], scale: [0.2, 1.1, 0.8, 1.05, 0.6], rotate: [0, 20, 0, 12, 0] } : { opacity: 0, scale: 0.2 }}
                    transition={full ? { delay: RING_T.flare, duration: 1.5, ease: 'easeInOut' } : { duration: 0 }}
                    aria-hidden
                  >
                    <path d="M0 -30Q1.8 -1.8 30 0Q1.8 1.8 0 30Q-1.8 1.8 -30 0Q-1.8 -1.8 0 -30Z" fill="#fff" />
                    <path d="M0 -17Q1 -1 17 0Q1 1 0 17Q-1 1 -17 0Q-1 -1 0 -17Z" fill="#fff7d0" transform="rotate(45)" />
                    <circle r="3.6" fill="#fff" />
                  </motion.svg>
                  <motion.span
                    className="absolute left-1/2 h-[2px] w-[190%] -translate-x-1/2"
                    style={{ top: '-14%', background: 'linear-gradient(90deg, transparent, rgba(255,250,232,.95) 50%, transparent)' }}
                    initial={false}
                    animate={full ? { opacity: [0, 1, 0], scaleX: [0.1, 1, 0.3] } : { opacity: 0, scaleX: 0.1 }}
                    transition={full ? { delay: RING_T.flare + 0.05, duration: 0.9, ease: 'easeOut' } : { duration: 0 }}
                    aria-hidden
                  />
                </Band>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ===== kilatan cahaya + cincin emas yang melebar + percikan ===== */}
      {full && (
        <>
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(circle at 50% ${CY}%, rgba(255,250,228,.96) 0, rgba(255,214,128,.6) 15%, transparent 44%)` }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.1, 1.9] }}
            transition={{ delay: RING_T.flash, duration: 0.85, times: [0, 0.3, 1], ease: 'easeOut' }}
            aria-hidden
          />
          <motion.div className="pointer-events-none absolute inset-0" style={{ '--hole': '-8%', background: edge } as CSSProperties} initial={{ '--hole': '-8%' } as Record<string, string>} animate={holeAnim} transition={holeTransition} aria-hidden />
          <div className="pointer-events-none absolute left-1/2 w-0" style={{ top: `${CY}%`, height: 0 }} aria-hidden>
            {SPARKS.map((p) => (
              <motion.svg
                key={p.id}
                viewBox="0 0 24 24"
                className="absolute"
                style={{ width: p.size, height: p.size, left: -p.size / 2, top: -p.size / 2, color: p.id % 3 ? 'var(--g0)' : '#fff' }}
                fill="currentColor"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
                animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: [0.2, 1.2, 0.9, 0.2], rotate: p.spin }}
                transition={{ delay: p.delay, duration: p.duration, ease: 'easeOut', opacity: { delay: p.delay, duration: p.duration, times: [0, 0.12, 0.7, 1] }, scale: { delay: p.delay, duration: p.duration, times: [0, 0.2, 0.6, 1] } }}
              >
                <path d={SPARKLE_PATH} />
              </motion.svg>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
