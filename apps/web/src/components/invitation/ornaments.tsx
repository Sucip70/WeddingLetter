// Ornamen SVG untuk undangan (warna mengikuti currentColor sehingga ikut tema). Tiap "jenis" ornamen punya
// tiga bagian: Corner (sudut sampul), Divider (pemisah judul), Sprig (hiasan kecil di bawah foto/footer).

import { DOVE_SILHOUETTE, LilyShapes } from './dove-art';

export type OrnamentKind = 'vine' | 'geo' | 'star8' | 'lotus' | 'sparkle' | 'snow' | 'twig' | 'deco' | 'lily';

interface CornerProps {
  className?: string;
  rotate?: 0 | 90 | 180 | 270;
}
interface DividerProps {
  className?: string;
}
interface SprigProps {
  className?: string;
  flip?: boolean;
}

export interface OrnamentSet {
  Corner: (p: CornerProps) => React.JSX.Element;
  Divider: (p: DividerProps) => React.JSX.Element;
  Sprig: (p: SprigProps) => React.JSX.Element;
}

// ----- bentuk dasar -----

const star8Path = (cx: number, cy: number, r: number) => {
  const a = r;
  const b = r * 0.72;
  return `M${cx} ${cy - a} L${cx + b * 0.38} ${cy - b * 0.38} L${cx + a} ${cy} L${cx + b * 0.38} ${cy + b * 0.38} L${cx} ${cy + a} L${cx - b * 0.38} ${cy + b * 0.38} L${cx - a} ${cy} L${cx - b * 0.38} ${cy - b * 0.38}Z`;
};

const sparklePath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z`;

function Flake({ cx, cy, r, o = 1 }: { cx: number; cy: number; r: number; o?: number }) {
  return (
    <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity={o} fill="none" transform={`translate(${cx} ${cy})`}>
      {[0, 60, 120].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <path d={`M0 ${-r}V${r}`} />
          <path d={`M${-r * 0.3} ${-r * 0.7}L0 ${-r * 0.42}L${r * 0.3} ${-r * 0.7}M${-r * 0.3} ${r * 0.7}L0 ${r * 0.42}L${r * 0.3} ${r * 0.7}`} />
        </g>
      ))}
    </g>
  );
}

const svgCorner = (rotate: number | undefined) => ({ transform: `rotate(${rotate ?? 0}deg)` });

// ----- vine (bawaan: rustic, floral, semi, gugur) -----

const Vine: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      <path d="M4 116C4 56 56 4 116 4" stroke="currentColor" strokeWidth="1.2" opacity=".6" />
      <path d="M4 92C4 46 46 4 92 4" stroke="currentColor" strokeWidth="1" opacity=".4" />
      <path d="M4 68C4 34 34 4 68 4" stroke="currentColor" strokeWidth=".8" opacity=".3" />
      {[
        [16, 34],
        [26, 22],
        [40, 14],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="8" ry="3.2" transform={`rotate(${-40 + i * 25} ${x} ${y})`} fill="currentColor" opacity={0.5 + i * 0.1} />
      ))}
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <circle cx="20" cy="8" r="2" fill="currentColor" opacity=".6" />
      <circle cx="8" cy="20" r="2" fill="currentColor" opacity=".6" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 12" className={className} fill="none" aria-hidden>
      <path d="M0 6h64M96 6h64" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d="M80 1l5 5-5 5-5-5z" fill="currentColor" />
      <circle cx="68" cy="6" r="1.5" fill="currentColor" opacity=".6" />
      <circle cx="92" cy="6" r="1.5" fill="currentColor" opacity=".6" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 60" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      <path d="M4 52C30 46 56 34 86 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {[
        [22, 47, -30],
        [36, 41, 20],
        [48, 35, -35],
        [60, 29, 18],
        [72, 22, -32],
        [84, 15, 15],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="9" ry="3.6" transform={`rotate(${r} ${x} ${y})`} fill="currentColor" opacity={0.55 + (i % 3) * 0.15} />
      ))}
      <circle cx="94" cy="9" r="3" fill="currentColor" />
      <circle cx="102" cy="5" r="2" fill="currentColor" opacity=".6" />
    </svg>
  ),
};

// ----- geo (suku, game, kemerdekaan: pola bertingkat ala tenun/pixel) -----

const Geo: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      <path d="M4 116V4H116" stroke="currentColor" strokeWidth="2" opacity=".75" />
      <path d="M16 116V16H116" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <path d="M28 100V28H100" stroke="currentColor" strokeWidth="1" opacity=".3" />
      <rect x="4" y="4" width="16" height="16" fill="currentColor" />
      <rect x="26" y="4" width="8" height="8" fill="currentColor" opacity=".7" />
      <rect x="4" y="26" width="8" height="8" fill="currentColor" opacity=".7" />
      <rect x="44" y="4" width="6" height="6" fill="currentColor" opacity=".5" />
      <rect x="4" y="44" width="6" height="6" fill="currentColor" opacity=".5" />
      <path d="M40 40l10 10M50 40L40 50" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 12" className={className} fill="none" aria-hidden>
      <path d="M0 6h56M104 6h56" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d="M62 2h8v8h-8zM90 2h8v8h-8z" fill="currentColor" opacity=".6" />
      <path d="M76 0h8v12h-8z" fill="currentColor" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 30" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="currentColor" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${6 + i * 16} 26l8-20 8 20z`} opacity={0.4 + (i % 3) * 0.2} />
      ))}
    </svg>
  ),
};

// ----- star8 (Islami, Lebaran) -----

const Star8: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      <path d="M4 116C4 56 56 4 116 4" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d="M4 84C4 42 42 4 84 4" stroke="currentColor" strokeWidth="1" opacity=".35" />
      <path d={star8Path(22, 22, 20)} fill="currentColor" opacity=".9" />
      <path d={star8Path(22, 22, 11)} fill="var(--bg, #fff)" opacity=".85" />
      <path d={star8Path(56, 12, 8)} fill="currentColor" opacity=".6" />
      <path d={star8Path(12, 56, 8)} fill="currentColor" opacity=".6" />
      <path d={star8Path(84, 8, 5)} fill="currentColor" opacity=".4" />
      <path d={star8Path(8, 84, 5)} fill="currentColor" opacity=".4" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 20" className={className} fill="none" aria-hidden>
      <path d="M0 10h58M102 10h58" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d={star8Path(80, 10, 9)} fill="currentColor" />
      <path d={star8Path(66, 10, 3)} fill="currentColor" opacity=".6" />
      <path d={star8Path(94, 10, 3)} fill="currentColor" opacity=".6" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 30" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="currentColor" aria-hidden>
      <path d={star8Path(20, 15, 10)} opacity=".8" />
      <path d={star8Path(60, 15, 13)} />
      <path d={star8Path(100, 15, 10)} opacity=".8" />
    </svg>
  ),
};

// ----- lotus (Buddha, Bali) -----

const petal = (rot: number, len: number, w: number, o: number) => (
  <ellipse key={rot} cx="0" cy={-len / 2} rx={w} ry={len / 2} transform={`rotate(${rot})`} fill="currentColor" opacity={o} />
);

const Lotus: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      <path d="M4 116C4 56 56 4 116 4" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <g transform="translate(6 6) rotate(135)">
        {[-60, -30, 0, 30, 60].map((r) => petal(r, r === 0 ? 62 : 50, r === 0 ? 8 : 7, r === 0 ? 0.9 : 0.55))}
      </g>
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <circle cx="56" cy="14" r="2.5" fill="currentColor" opacity=".55" />
      <circle cx="14" cy="56" r="2.5" fill="currentColor" opacity=".55" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 30" className={className} fill="none" aria-hidden>
      <path d="M0 22h62M98 22h62" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <g transform="translate(80 26)">{[-50, -25, 0, 25, 50].map((r) => petal(r, r === 0 ? 22 : 17, r === 0 ? 5 : 4.5, r === 0 ? 1 : 0.6))}</g>
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 50" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      <path d="M4 44C36 46 70 40 94 26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="34" cy="43" rx="14" ry="4" transform="rotate(-8 34 43)" fill="currentColor" opacity=".5" />
      <g transform="translate(98 24)">{[-40, 0, 40].map((r) => petal(r, 20, 5, r === 0 ? 0.95 : 0.6))}</g>
    </svg>
  ),
};

// ----- sparkle (elegan, film, kartun, tahun baru) -----

const Sparkle: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      <path d="M4 116C4 56 56 4 116 4" stroke="currentColor" strokeWidth="1" opacity=".45" strokeDasharray="2 5" />
      <path d={sparklePath(20, 20, 18)} fill="currentColor" />
      <path d={sparklePath(56, 12, 8)} fill="currentColor" opacity=".7" />
      <path d={sparklePath(12, 56, 8)} fill="currentColor" opacity=".7" />
      <path d={sparklePath(40, 40, 6)} fill="currentColor" opacity=".55" />
      <circle cx="84" cy="10" r="2" fill="currentColor" opacity=".5" />
      <circle cx="10" cy="84" r="2" fill="currentColor" opacity=".5" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 20" className={className} fill="none" aria-hidden>
      <path d="M0 10h58M102 10h58" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d={sparklePath(80, 10, 9)} fill="currentColor" />
      <path d={sparklePath(64, 10, 4)} fill="currentColor" opacity=".6" />
      <path d={sparklePath(96, 10, 4)} fill="currentColor" opacity=".6" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 40" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="currentColor" aria-hidden>
      <path d={sparklePath(24, 22, 10)} opacity=".7" />
      <path d={sparklePath(60, 18, 15)} />
      <path d={sparklePath(96, 24, 8)} opacity=".6" />
      <circle cx="42" cy="8" r="2" opacity=".5" />
      <circle cx="80" cy="8" r="1.6" opacity=".5" />
    </svg>
  ),
};

// ----- snow (Natal, salju, kerajaan es) -----

const Snow: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      <path d="M4 116C4 56 56 4 116 4" stroke="currentColor" strokeWidth="1" opacity=".4" />
      <Flake cx={24} cy={24} r={20} />
      <Flake cx={60} cy={12} r={8} o={0.7} />
      <Flake cx={12} cy={60} r={8} o={0.7} />
      <circle cx="84" cy="8" r="2" fill="currentColor" opacity=".5" />
      <circle cx="8" cy="84" r="2" fill="currentColor" opacity=".5" />
      <circle cx="44" cy="46" r="1.6" fill="currentColor" opacity=".5" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 24" className={className} fill="none" aria-hidden>
      <path d="M0 12h56M104 12h56" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <Flake cx={80} cy={12} r={10} />
      <circle cx="64" cy="12" r="1.6" fill="currentColor" opacity=".6" />
      <circle cx="96" cy="12" r="1.6" fill="currentColor" opacity=".6" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 36" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      <Flake cx={24} cy={18} r={10} o={0.7} />
      <Flake cx={60} cy={18} r={14} />
      <Flake cx={96} cy={18} r={10} o={0.7} />
    </svg>
  ),
};

// ----- twig (rustic): ranting kering, baby's breath & gandum diikat tali goni -----

const Twig: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" aria-hidden>
      {/* ranting eukaliptus melengkung di sudut */}
      <path d="M6 112C10 70 38 30 104 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      {[
        [10, 92, 24], [18, 72, -8], [30, 54, 14], [44, 40, -16], [60, 28, 8], [78, 18, -20], [94, 12, 4],
      ].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={i % 2 ? 6 : 7.5} ry={i % 2 ? 3.6 : 4.4} transform={`rotate(${r} ${x} ${y})`} fill="currentColor" opacity={0.42 + (i % 3) * 0.14} />
      ))}
      {/* baby's breath: titik-titik kecil di cabang sampingan */}
      <path d="M16 100C32 84 44 76 66 72M40 62C54 58 62 50 70 38" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" opacity=".55" />
      {[[66, 72], [60, 74], [70, 68], [54, 78], [70, 38], [64, 44], [74, 34], [46, 66], [30, 90], [36, 84]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.7} fill="currentColor" opacity={0.5 + (i % 2) * 0.25} />
      ))}
      {/* ikatan tali goni di pangkal ranting */}
      <path d="M2 104l12-5M1 108l13-5M3 112l11-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".9" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 160 22" className={className} fill="none" aria-hidden>
      {/* tali goni terpilin */}
      <path d="M0 11h58M102 11h58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 1.6" opacity=".6" />
      {/* simpul pita kecil */}
      <path d="M80 11C72 3 64 4 66 10c1 5 9 3 14 1ZM80 11C88 3 96 4 94 10c-1 5-9 3-14 1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M80 12l-6 8M80 12l6 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="80" cy="11" r="1.8" fill="currentColor" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 60" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      {/* tiga tangkai gandum/lavender diikat tali */}
      {[[-26, 0], [0, 0], [26, 0]].map(([r], i) => (
        <g key={i} transform={`translate(60 54) rotate(${r})`}>
          <path d="M0 0V-44" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".8" />
          {[-12, -20, -28, -36, -43].map((y, j) => (
            <g key={j}>
              <ellipse cx="-3.4" cy={y} rx="2.2" ry="4.2" transform={`rotate(-28 -3.4 ${y})`} fill="currentColor" opacity={0.5 + (j % 2) * 0.2} />
              <ellipse cx="3.4" cy={y} rx="2.2" ry="4.2" transform={`rotate(28 3.4 ${y})`} fill="currentColor" opacity={0.5 + (j % 2) * 0.2} />
            </g>
          ))}
        </g>
      ))}
      <path d="M50 49l20 3M50 53l20 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 52C54 46 48 47 50 52c1 4 7 3 10 0ZM60 52C66 46 72 47 70 52c-1 4-7 3-10 0Z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
};

// ----- deco (Elegan): garis emas ala Art Deco — siku bersudut potong, kipas, berlian, dan ranting laurel -----

// Kipas sinar seperempat lingkaran dari berlian di sudut (garis tipis).
const DECO_FAN = [0, 18, 36, 54, 72, 90]
  .map((deg) => {
    const a = (deg * Math.PI) / 180;
    const p = (r: number) => `${(22 + Math.cos(a) * r).toFixed(1)} ${(22 + Math.sin(a) * r).toFixed(1)}`;
    return `M${p(13)}L${p(46)}`;
  })
  .join('');

// Ranting laurel: tangkai Bezier kubik, tiap titik diberi sepasang daun menyudut ke arah ujung.
const LAUREL = (() => {
  const P = [[6, 54], [36, 54], [80, 44], [112, 12]] as const;
  const at = (t: number) => {
    const u = 1 - t;
    const f = (i: 0 | 1) => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i];
    const d = (i: 0 | 1) => 3 * u * u * (P[1][i] - P[0][i]) + 6 * u * t * (P[2][i] - P[1][i]) + 3 * t * t * (P[3][i] - P[2][i]);
    return { x: f(0), y: f(1), angle: (Math.atan2(d(1), d(0)) * 180) / Math.PI };
  };
  return Array.from({ length: 7 }, (_, i) => {
    const { x, y, angle } = at(0.1 + i * 0.125);
    return { x: x.toFixed(1), y: y.toFixed(1), angle: angle.toFixed(1), scale: (1.05 - i * 0.07).toFixed(2), o: (0.55 + (i % 2) * 0.25).toFixed(2) };
  });
})();

const Deco: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" stroke="currentColor" aria-hidden>
      <path d="M3 118V24L24 3H118" strokeWidth="1.4" />
      <path d="M11 118V30L30 11H118" strokeWidth=".7" opacity=".55" />
      <path d={DECO_FAN} strokeWidth=".7" opacity=".5" strokeLinecap="round" />
      <path d="M22 54A32 32 0 0 0 54 22" strokeWidth=".6" opacity=".5" />
      <path d="M22 62A40 40 0 0 0 62 22" strokeWidth=".5" opacity=".35" strokeDasharray="1 2.4" />
      <path d="M22 14.500L29.500 22 22 29.500 14.500 22Z" fill="currentColor" stroke="none" />
      <path d="M22 18.500L25.500 22 22 25.500 18.500 22Z" fill="var(--bg, #fff)" stroke="none" />
      <path d="M70 4.500l3.200 3.200-3.200 3.200-3.200-3.200ZM4.500 70l3.200 3.200-3.200 3.200-3.200-3.200Z" fill="currentColor" stroke="none" opacity=".85" />
      <circle cx="92" cy="7" r="1.1" fill="currentColor" stroke="none" opacity=".6" />
      <circle cx="7" cy="92" r="1.1" fill="currentColor" stroke="none" opacity=".6" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 200 20" className={className} fill="none" stroke="currentColor" aria-hidden>
      <path d="M6 10H78M122 10H194" strokeWidth="1" opacity=".55" />
      <path d="M0 10H3M197 10H200" strokeWidth="1" opacity=".25" />
      <path d="M100 1.500l8.500 8.500-8.500 8.500-8.500-8.500Z" strokeWidth="1.1" />
      <path d="M100 5.800l4.200 4.200-4.200 4.200-4.200-4.200Z" fill="currentColor" stroke="none" />
      <path d="M82 7l3 3-3 3-3-3ZM118 7l3 3-3 3-3-3Z" fill="currentColor" stroke="none" opacity=".75" />
      <circle cx="68" cy="10" r="1.2" fill="currentColor" stroke="none" opacity=".6" />
      <circle cx="132" cy="10" r="1.2" fill="currentColor" stroke="none" opacity=".6" />
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 60" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      <path d="M6 54C36 54 80 44 112 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {LAUREL.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) scale(${l.scale})`}>
          <path d="M0 0C3-5 11-5 15 0C11 5 3 5 0 0Z" transform={`rotate(${(Number(l.angle) - 38).toFixed(1)})`} fill="currentColor" opacity={l.o} />
          <path d="M0 0C3-5 11-5 15 0C11 5 3 5 0 0Z" transform={`rotate(${(Number(l.angle) + 38).toFixed(1)})`} fill="currentColor" opacity={Number(l.o) - 0.12} />
        </g>
      ))}
      <circle cx="113" cy="10.500" r="2.600" fill="currentColor" />
      <circle cx="119" cy="5" r="1.400" fill="currentColor" opacity=".6" />
    </svg>
  ),
};

// Monogram bundar: inisial mempelai (aksara tulisan tangan, berlapis emas) di dalam cincin ganda berlian.
// Warna cincin = warna utama tema; huruf memakai kelas .wl-foil (lihat globals.css).
export function Monogram({ a, b, size = 96, className = '' }: { a: string; b: string; size?: number; className?: string }) {
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size, color: 'var(--p)' }} aria-hidden>
      <svg viewBox="-50 -50 100 100" className="absolute inset-0 h-full w-full overflow-visible" fill="none" stroke="currentColor">
        <circle r="46" strokeWidth="1.1" />
        <circle r="41.500" strokeWidth=".55" opacity=".75" strokeDasharray="1.200 2.400" />
        <circle r="37" strokeWidth=".6" opacity=".5" />
        {[0, 90, 180, 270].map((deg) => (
          <path key={deg} transform={`rotate(${deg})`} d="M0 -50l3.800 3.800-3.800 3.800-3.800-3.800Z" fill="var(--bg, #fff)" strokeWidth=".9" />
        ))}
        {[45, 135, 225, 315].map((deg) => (
          <circle key={deg} r="1.100" cy="-46" fill="currentColor" stroke="none" transform={`rotate(${deg})`} />
        ))}
      </svg>
      <span className="relative flex items-baseline leading-none" style={{ fontSize: size * 0.36, fontFamily: 'var(--font-script)' }}>
        <span className="wl-foil">{a}</span>
        <span className="wl-foil" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.44em', fontStyle: 'italic', margin: '0 0.1em', transform: 'translateY(-0.3em)' }}>
          &amp;
        </span>
        <span className="wl-foil">{b}</span>
      </span>
    </div>
  );
}

// ----- lily (Sepasang Merpati): rangkaian lily di sudut, pemisah bermerpati terbang, ranting lily kecil -----

const LILY_LEAF = 'M0 0C6-6 17-6 26 0C17 6 6 6 0 0Z';
const LILY_LEAF_FILL = 'color-mix(in srgb, var(--p, #6b7fa3) 28%, #d6e6da)';

const Lily: OrnamentSet = {
  Corner: ({ className = 'w-28', rotate = 0 }) => (
    <svg viewBox="0 0 120 120" className={className} style={svgCorner(rotate)} fill="none" stroke="currentColor" aria-hidden>
      {/* tangkai melengkung di sepanjang sudut */}
      <path d="M4 116C6 70 30 30 78 10" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M22 62C34 62 46 54 52 42M44 30C54 34 66 30 72 20" strokeWidth="1" strokeLinecap="round" opacity=".8" />
      {[
        [10, 92, -62], [16, 74, -22], [28, 52, -78], [46, 34, -30], [60, 22, -80],
      ].map(([x, y, r], i) => (
        <path key={i} d={LILY_LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(${1 - i * 0.07})`} fill={LILY_LEAF_FILL} strokeWidth=".8" strokeLinejoin="round" />
      ))}
      <g transform="translate(40 50) rotate(-18) scale(.46)"><LilyShapes /></g>
      <g transform="translate(78 22) rotate(12) scale(.26)"><LilyShapes /></g>
      <path d="M96 12C98 8 102 8 104 12C102 18 98 18 96 12Z" fill="#fff" strokeWidth=".7" />
      <circle cx="20" cy="104" r="1.6" fill="currentColor" stroke="none" opacity=".5" />
      <circle cx="104" cy="22" r="1.3" fill="currentColor" stroke="none" opacity=".4" />
    </svg>
  ),
  Divider: ({ className = 'w-40' }) => (
    <svg viewBox="0 0 200 26" className={className} fill="none" stroke="currentColor" aria-hidden>
      <path d="M8 13H76M124 13H192" strokeWidth="1" opacity=".5" strokeLinecap="round" />
      <circle cx="70" cy="13" r="1.3" fill="currentColor" stroke="none" opacity=".6" />
      <circle cx="130" cy="13" r="1.3" fill="currentColor" stroke="none" opacity=".6" />
      <path d={LILY_LEAF} transform="translate(56 13) rotate(-20) scale(.5)" fill={LILY_LEAF_FILL} strokeWidth=".9" />
      <path d={LILY_LEAF} transform="translate(144 13) rotate(200) scale(.5)" fill={LILY_LEAF_FILL} strokeWidth=".9" />
      <g transform="translate(100 13) scale(.086) translate(-150 -102)">
        <path d={DOVE_SILHOUETTE} fill="currentColor" stroke="none" />
      </g>
    </svg>
  ),
  Sprig: ({ className = 'w-24', flip }) => (
    <svg viewBox="0 0 120 60" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" stroke="currentColor" aria-hidden>
      <path d="M4 54C30 52 62 42 92 22" strokeWidth="1.2" strokeLinecap="round" />
      {[[22, 51, -20], [38, 46, 24], [52, 40, -28], [66, 33, 22]].map(([x, y, r], i) => (
        <path key={i} d={LILY_LEAF} transform={`translate(${x} ${y}) rotate(${r}) scale(.55)`} fill={LILY_LEAF_FILL} strokeWidth=".8" />
      ))}
      <g transform="translate(96 20) rotate(-14) scale(.3)"><LilyShapes /></g>
    </svg>
  ),
};

export const ORNAMENTS: Record<OrnamentKind, OrnamentSet> = { vine: Vine, geo: Geo, star8: Star8, lotus: Lotus, sparkle: Sparkle, snow: Snow, twig: Twig, deco: Deco, lily: Lily };

// Ekspor lama (kartu katalog, halaman lain) = jenis vine.
export const Corner = Vine.Corner;
export const Divider = Vine.Divider;
export const Sprig = Vine.Sprig;

export function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
