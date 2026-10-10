// Gunungan (kayon) wayang kulit untuk desain "Batik Jawa": badan berbentuk nyala, pohon hayat dengan cabang menggulung, burung,
// matahari, gapura bertingkat dengan dua penjaga, tatahan bertitik, dan kawung halus. Digambar sendiri dari bentuk tradisional
// (warisan budaya), bukan jiplakan karya tertentu. Simetris: separuh kiri digambar sekali lalu dicerminkan.
// Warna dari variabel tema: badan = --p (maroon), garis & hiasan = emas berlapis (--s) lewat gradien userSpaceOnUse.
// Sekitar 230 simpul: dipakai di gerbang, sampul, dan footer, tidak lebih.
import { useId } from 'react';
import type { CSSProperties } from 'react';

export const GUNUNGAN_VIEWBOX = '0 0 200 272';
export const GUNUNGAN_BODY = 'M100 6C112 30 134 52 152 84C172 120 186 170 184 214C183 232 178 244 170 250H30C22 244 17 232 16 214C14 170 28 120 48 84C66 52 88 30 100 6ZM36 250H164V258H36ZM46 258H154V266H46Z';
export const GUNUNGAN_OUTLINE = 'M100 6C112 30 134 52 152 84C172 120 186 170 184 214C183 232 178 244 170 250H30C22 244 17 232 16 214C14 170 28 120 48 84C66 52 88 30 100 6Z';
const BODY = GUNUNGAN_OUTLINE;
const MIRROR = 'matrix(-1 0 0 1 200 0)';
const inset = (s: number) => `translate(100 150) scale(${s}) translate(-100 -150)`;
const r1 = (n: number) => Math.round(n * 10) / 10;

type P = [number, number];
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
};
const tangent = (p0: P, p1: P, p2: P, p3: P, t: number) => {
  const u = 1 - t;
  const dx = 3 * (u * u * (p1[0] - p0[0]) + 2 * u * t * (p2[0] - p1[0]) + t * t * (p3[0] - p2[0]));
  const dy = 3 * (u * u * (p1[1] - p0[1]) + 2 * u * t * (p2[1] - p1[1]) + t * t * (p3[1] - p2[1]));
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

// Cabang pohon hayat di sisi kiri batang (x = 100): melengkung keluar-atas lalu menggulung (ukel); daun kecil di sepanjangnya.
const YS = [182, 160, 138, 116, 94, 72];
const REACH = [60, 56, 50, 43, 35, 25];
const BRANCHES = YS.map((y, i) => {
  const r = REACH[i]!;
  const p0: P = [100, y];
  const p1: P = [100 - r * 0.34, y - 14];
  const p2: P = [100 - r * 0.74, y - 17];
  const p3: P = [100 - r, y - 6];
  const [ex, ey] = p3;
  const d = `M${p0[0]} ${p0[1]}C${r1(p1[0])} ${p1[1]} ${r1(p2[0])} ${p2[1]} ${r1(p3[0])} ${p3[1]}c-3.2 5.4-.8 11.4 4.2 10.6c3.6-.6 3.8-5.8.4-6.2`;
  const leaves = [0.28, 0.5, 0.72].map((t, k) => {
    const [x, y2] = bez(p0, p1, p2, p3, t);
    const a = tangent(p0, p1, p2, p3, t) + (k % 2 ? 62 : -62);
    return `<path transform="translate(${r1(x)} ${r1(y2)}) rotate(${r1(a)})" d="M0 0C2.4-3.2 7-3.2 9.4 0C7 3.2 2.4 3.2 0 0Z"/>`;
  });
  return { d, leaves: leaves.join(''), tip: [r1(ex + 3), r1(ey + 5)] as P };
});

const SUN_RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return `M${r1(100 + Math.cos(a) * 7)} ${r1(40 + Math.sin(a) * 7)}L${r1(100 + Math.cos(a) * (i % 2 ? 10 : 12))} ${r1(40 + Math.sin(a) * (i % 2 ? 10 : 12))}`;
}).join('');

// Burung kecil menghadap keluar (kiri), bertengger di ujung cabang.
const BIRD = 'M0 0C3-3 8-2.600 11 .5C8 3.500 3 3.500 0 0ZM3 -1C4.500 -6 9 -6.500 10.500 -4.200C8.500 -3.200 6 -1.500 3 -1ZM0 0L-6.500 -2.400-5.200 1.400Z';

// Gapura bertingkat (separuh kiri; separuh kanan = cermin) dan penjaga bersenjata gada.
const ROOF = ['M64 232L100 214L136 232Z', 'M72 220L100 204L128 220Z', 'M82 208L100 194L118 208Z'];

export function Gunungan({ className = 'h-full w-full', style }: { className?: string; style?: CSSProperties }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gold = `gn-gold-${uid}`;
  const body = `gn-body-${uid}`;
  const kawung = `gn-kawung-${uid}`;
  const G = `url(#${gold})`;
  const dark = 'color-mix(in srgb, var(--p) 64%, #000)';
  return (
    <svg viewBox={GUNUNGAN_VIEWBOX} className={className} style={style} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <defs>
        <linearGradient id={gold} gradientUnits="userSpaceOnUse" x1="14" y1="4" x2="186" y2="268">
          <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--s) 78%, #fff3c2)' }} />
          <stop offset="0.28" style={{ stopColor: 'var(--s)' }} />
          <stop offset="0.5" style={{ stopColor: 'color-mix(in srgb, var(--s) 60%, #fff6d0)' }} />
          <stop offset="0.74" style={{ stopColor: 'color-mix(in srgb, var(--s) 78%, #5a3d00)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--s) 70%, #fff0b0)' }} />
        </linearGradient>
        <radialGradient id={body} cx="50%" cy="46%" r="64%">
          <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--p) 84%, #fff)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--p)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--p) 62%, #000)' }} />
        </radialGradient>
        {/* kawung: empat oval mengelilingi satu titik, diputar 45 derajat */}
        <pattern id={kawung} width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <g fill="none" stroke={G} strokeWidth=".7">
            <ellipse cx="6.500" cy="3" rx="1.900" ry="2.800" />
            <ellipse cx="6.500" cy="10" rx="1.900" ry="2.800" />
            <ellipse cx="3" cy="6.500" rx="2.800" ry="1.900" />
            <ellipse cx="10" cy="6.500" rx="2.800" ry="1.900" />
          </g>
        </pattern>
      </defs>

      {/* badan */}
      <path d={BODY} fill={`url(#${body})`} />
      <path d={BODY} fill={`url(#${kawung})`} opacity=".34" />
      <path d={BODY} fill="none" stroke={G} strokeWidth="2.6" />
      <path d={BODY} fill="none" stroke={G} strokeWidth="1.5" strokeDasharray="0 4.400" opacity=".9" transform={inset(0.94)} />
      <path d={BODY} fill="none" stroke={G} strokeWidth=".9" opacity=".9" transform={inset(0.88)} />

      {/* matahari di puncak */}
      <circle cx="100" cy="40" r="4.400" fill={G} />
      <path d={SUN_RAYS} stroke={G} strokeWidth="1.200" fill="none" />

      {/* pohon hayat: batang, cabang menggulung, daun, burung */}
      <path d="M100 196V50" stroke={G} strokeWidth="2.200" fill="none" />
      <path d="M100 50C97 44 98 41 100 38C102 41 103 44 100 50Z" fill={G} />
      {[0, 1].map((side) => (
        <g key={side} transform={side ? MIRROR : undefined}>
          {BRANCHES.map((b, i) => (
            <g key={i}>
              <path d={b.d} fill="none" stroke={G} strokeWidth={r1(1.7 - i * 0.1)} />
              <g fill={G} dangerouslySetInnerHTML={{ __html: b.leaves }} />
              <circle cx={b.tip[0]} cy={b.tip[1] - 1} r="1.500" fill={G} />
            </g>
          ))}
          {[1, 3].map((i) => (
            <path key={`bird${i}`} d={BIRD} fill={G} transform={`translate(${r1(BRANCHES[i]!.tip[0] - 6)} ${r1(BRANCHES[i]!.tip[1] - 12)}) scale(.82)`} />
          ))}
        </g>
      ))}

      {/* gapura bertingkat */}
      <circle cx="100" cy="190" r="2.600" fill={G} />
      {ROOF.map((d, i) => (
        <path key={d} d={d} fill={dark} stroke={G} strokeWidth={i === 0 ? 1.300 : 1.100} />
      ))}
      <path d="M96 232V196M104 232V196" stroke={G} strokeWidth=".6" opacity=".6" fill="none" />
      <rect x="70" y="232" width="60" height="5" fill={G} />
      <rect x="74" y="237" width="52" height="13" fill={dark} stroke={G} strokeWidth=".9" />
      <path d="M100 237V250M87 237V250M113 237V250" stroke={G} strokeWidth=".6" />
      <path d="M93.500 240.500l3 3-3 3-3-3zM106.500 240.500l3 3-3 3-3-3z" fill={G} />

      {/* penjaga gapura (cakil) bersenjata gada */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? MIRROR : undefined}>
          <circle cx="54" cy="219" r="3.600" fill={G} />
          <path d="M49 214.500l2.400-3.600 2.600 2 2.600-2 2.400 3.600" fill="none" stroke={G} strokeWidth=".9" />
          <path d="M47 225C47 222 61 222 61 225L62 239H46Z" fill={G} />
          <path d="M45 228L36 236M36 236L33 226" stroke={G} strokeWidth="1.500" fill="none" />
          <circle cx="32.500" cy="224" r="3" fill={G} />
          <path d="M48 239L45 250M60 239L63 250" stroke={G} strokeWidth="1.800" fill="none" />
        </g>
      ))}

      {/* ombak di kaki & umpak */}
      <g fill="none" stroke={G} strokeWidth="1.100" opacity=".9">
        {[0, 1].map((side) => (
          <g key={side} transform={side ? MIRROR : undefined}>
            <path d="M24 243q6-6 12 0t12 0" />
            <path d="M30 236q5-5 10 0t10 0" />
          </g>
        ))}
      </g>
      <path d="M36 250H164V258H36ZM46 258H154V266H46Z" fill={G} />
      <path d="M46 262H154" stroke={dark} strokeWidth=".8" />
    </svg>
  );
}
