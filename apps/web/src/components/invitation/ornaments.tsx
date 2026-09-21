// Ornamen SVG untuk undangan (warna mengikuti currentColor sehingga ikut tema). Tiap "jenis" ornamen punya
// tiga bagian: Corner (sudut sampul), Divider (pemisah judul), Sprig (hiasan kecil di bawah foto/footer).

export type OrnamentKind = 'vine' | 'geo' | 'star8' | 'lotus' | 'sparkle' | 'snow';

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

export const ORNAMENTS: Record<OrnamentKind, OrnamentSet> = { vine: Vine, geo: Geo, star8: Star8, lotus: Lotus, sparkle: Sparkle, snow: Snow };

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
