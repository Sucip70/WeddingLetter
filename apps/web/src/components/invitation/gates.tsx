'use client';

// Gerbang pembuka undangan Premium: adegan animasi tematik (pintu, amplop, tirai, ...) yang menutupi sampul
// sampai diketuk. Semua gerak memakai CSS transform/opacity (ringan di ponsel); warna mengikuti tema lewat
// variabel --p/--s/--bg/--tx. Fase dikendalikan InvitationView: 'closed' -> 'opening' -> (dilepas).
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import type { GateKind } from '@/lib/types';
import { PatternLayer } from './effects';
import type { PatternKind } from './motifs';

export type GatePhase = 'closed' | 'opening';

// Lama animasi buka (ms) sampai gerbang dilepas. Dengan "kurangi gerakan" dipersingkat jadi fade.
export const GATE_MS: Record<GateKind, number> = {
  door: 2300, glass: 2300, curtain: 2200, cloth: 2400, envelope: 2900, portal: 2500, ring: 2700, bloom: 2800, leaves: 2800,
  balloons: 2800, waves: 2700, gift: 2500, lantern: 2700, fireworks: 2900, frost: 2200, book: 2900, pressstart: 1400, loading: 2700, neon: 2600,
};

const CTA: Record<GateKind, string> = {
  door: 'Ketuk untuk membuka pintu', glass: 'Ketuk untuk membuka jendela', curtain: 'Ketuk untuk membuka tirai', cloth: 'Ketuk untuk membuka kain',
  envelope: 'Ketuk untuk membuka amplop', portal: 'Ketuk untuk mengaktifkan portal', ring: 'Ketuk untuk memasangkan cincin', bloom: 'Ketuk agar bunga mekar',
  leaves: 'Ketuk untuk menyingkap', balloons: 'Ketuk untuk melepas balon', waves: 'Ketuk untuk memanggil ombak', gift: 'Ketuk untuk membuka kado',
  lantern: 'Ketuk untuk menyalakan lentera', fireworks: 'Ketuk untuk menyalakan kembang api', frost: 'Ketuk untuk mencairkan es', book: 'Ketuk untuk membuka buku',
  pressstart: 'Ketuk untuk mulai', loading: 'Ketuk untuk mulai', neon: 'Ketuk untuk menyalakan',
};

// Adegan gelap memakai teks putih; adegan terang memakai warna teks tema.
const DARK: Partial<Record<GateKind, true>> = { door: true, glass: true, curtain: true, cloth: true, portal: true, lantern: true, fireworks: true, pressstart: true, loading: true, neon: true };
// Adegan yang punya teks sendiri (tanpa judul umum di atas).
const OWN_TITLE: Partial<Record<GateKind, true>> = { envelope: true, book: true, pressstart: true, loading: true, neon: true };

const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

interface SceneProps {
  names: string;
  kicker: string;
  pattern: PatternKind;
  headingFamily: string;
}

// ---------- pintu / jendela kaca patri ----------

function Door({ pattern, glass }: { pattern: PatternKind; glass?: boolean }) {
  const leaf = (side: 'l' | 'r') => (
    <div className={`g-leaf g-${side} ${glass ? 'g-glassleaf' : 'g-wood'}`}>
      {glass ? (
        <div className="g-panes">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="g-pane" style={{ '--c': ['var(--p)', 'var(--s)', 'color-mix(in srgb, var(--p) 55%, #2b5cff)', 'color-mix(in srgb, var(--s) 60%, #ff9f1a)'][(i + (side === 'r' ? 1 : 0)) % 4] } as CSSProperties} />
          ))}
        </div>
      ) : (
        <>
          <PatternLayer kind={pattern} opacity={0.28} color="var(--s)" />
          <span className="g-panel" style={{ top: '7%', height: '38%' }} />
          <span className="g-panel" style={{ top: '52%', height: '41%' }} />
          <span className="g-handle" />
        </>
      )}
    </div>
  );
  return (
    <div className="g-door">
      <div className="g-doorbg" />
      <div className="g-glow" />
      {leaf('l')}
      {leaf('r')}
    </div>
  );
}

// ---------- tirai / kain ----------

function Curtain({ cloth, pattern }: { cloth?: boolean; pattern: PatternKind }) {
  return (
    <div className="g-cwrap">
      <div className="g-stage" />
      <div className={`g-cur g-cl ${cloth ? 'g-ulos' : 'g-velvet'}`}>{cloth && <PatternLayer kind={pattern === 'none' ? 'zigzag' : pattern} opacity={0.3} color="#fff" />}</div>
      <div className={`g-cur g-cr ${cloth ? 'g-ulos' : 'g-velvet'}`}>{cloth && <PatternLayer kind={pattern === 'none' ? 'zigzag' : pattern} opacity={0.3} color="#fff" />}</div>
      {!cloth && <div className="g-valance" />}
    </div>
  );
}

// ---------- amplop ----------

function Envelope({ names, kicker, headingFamily }: SceneProps) {
  return (
    <div className="g-envscene">
      <div className="g-envbg" />
      <div className="g-envwrap">
        <div className="g-envback" />
        <div className="g-card">
          <small>{kicker}</small>
          <b style={{ fontFamily: headingFamily }}>{names}</b>
          <i />
        </div>
        <div className="g-front" />
        <div className="g-flap" />
        <div className="g-seal">
          <svg viewBox="0 0 24 24" width="46%" fill="currentColor" aria-hidden><path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3.5-3 7-10 13Z" /></svg>
        </div>
      </div>
    </div>
  );
}

// ---------- portal sihir ----------

const TICKS = Array.from({ length: 24 }, (_, i) => i);
function Portal() {
  return (
    <div className="g-portalscene">
      <div className="g-portalbg g-holed" />
      <div className="g-rings">
        <svg viewBox="-100 -100 200 200" aria-hidden>
          <g className="g-r1">
            <circle r="94" fill="none" stroke="var(--s)" strokeWidth="1.2" strokeDasharray="3 5" />
            {TICKS.map((i) => (
              <line key={i} x1="0" y1="-98" x2="0" y2={i % 2 ? -90 : -86} stroke="var(--s)" strokeWidth="1.6" transform={`rotate(${i * 15})`} />
            ))}
          </g>
          <g className="g-r2">
            <circle r="76" fill="none" stroke="var(--p)" strokeWidth="2.4" />
            {Array.from({ length: 8 }, (_, i) => (
              <path key={i} d="M0 -76 L5 -66 L-5 -66Z" fill="var(--s)" transform={`rotate(${i * 45})`} />
            ))}
          </g>
          <g className="g-r3">
            <path d="M0 -58 L14 -14 L58 0 L14 14 L0 58 L-14 14 L-58 0 L-14 -14Z" fill="none" stroke="var(--s)" strokeWidth="1.6" />
            <circle r="34" fill="none" stroke="var(--p)" strokeWidth="1.4" strokeDasharray="2 4" />
          </g>
        </svg>
        <div className="g-core" />
      </div>
    </div>
  );
}

// ---------- cincin ----------

const sparkle = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
function Rings() {
  return (
    <div className="g-ringscene">
      <div className="g-ringbg" />
      <div className="g-ringswrap">
        <svg viewBox="0 0 200 120" aria-hidden>
          <defs>
            <linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: 'color-mix(in srgb, var(--s) 70%, #fff)' }} />
              <stop offset="0.5" style={{ stopColor: 'var(--p)' }} />
              <stop offset="1" style={{ stopColor: 'color-mix(in srgb, var(--s) 80%, #000)' }} />
            </linearGradient>
          </defs>
          <g className="g-rA">
            <circle cx="68" cy="66" r="36" fill="none" stroke="url(#g-gold)" strokeWidth="8" />
            <path d="M68 24 L75 31 L68 38 L61 31Z" fill="#fff" stroke="var(--s)" strokeWidth="1.2" />
          </g>
          <g className="g-rB">
            <circle cx="132" cy="66" r="36" fill="none" stroke="url(#g-gold)" strokeWidth="8" />
          </g>
          {[[100, 30, 9], [72, 86, 6], [128, 92, 7], [100, 66, 12], [52, 44, 5], [150, 46, 5]].map(([x, y, r], i) => (
            <path key={i} className="g-sp" style={{ animationDelay: `${0.9 + i * 0.12}s` }} d={sparkle(x!, y!, r!)} fill="#fff" stroke="var(--s)" strokeWidth=".8" />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ---------- bunga ----------

function Bloom() {
  return (
    <div className="g-bloomscene">
      <div className="g-bloombg" />
      <div className="g-flower">
        <svg viewBox="-100 -100 200 200" aria-hidden>
          <ellipse cx="-22" cy="70" rx="32" ry="9" fill="var(--s)" opacity=".7" transform="rotate(-25 -22 70)" />
          <ellipse cx="24" cy="74" rx="32" ry="9" fill="var(--s)" opacity=".7" transform="rotate(20 24 74)" />
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 30})`}>
              <ellipse className="g-petal" style={{ '--i': i } as CSSProperties} cx="0" cy="-42" rx="17" ry="44" fill="var(--p)" opacity=".92" />
            </g>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 45 + 15})`}>
              <ellipse className="g-petal g-inner" style={{ '--i': i + 4 } as CSSProperties} cx="0" cy="-28" rx="11" ry="28" fill="color-mix(in srgb, var(--p) 45%, #fff)" />
            </g>
          ))}
          <circle r="12" fill="var(--s)" />
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={Math.cos((i / 7) * 6.283) * 6} cy={Math.sin((i / 7) * 6.283) * 6} r="1.8" fill="#fff" opacity=".8" />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ---------- daun berguguran / balon ----------

const LEAF_COLORS = ['var(--p)', 'var(--s)', 'color-mix(in srgb, var(--p) 55%, #2f7a3a)', 'color-mix(in srgb, var(--s) 60%, #c2571a)', 'color-mix(in srgb, var(--p) 60%, #fff)'];
const BALLOON_COLORS = ['var(--p)', 'var(--s)', '#ff6b8b', '#4db3ff', '#ffd23f', '#7be08c', '#b18cff'];

function Scatter({ kind }: { kind: 'leaves' | 'balloons' }) {
  const leaves = kind === 'leaves';
  const cols = leaves ? 6 : 5;
  const rows = leaves ? 8 : 6;
  const items = Array.from({ length: cols * rows }, (_, n) => {
    const c = n % cols;
    const r = Math.floor(n / cols);
    return {
      left: ((c + 0.5 + (rand(n, 1) - 0.5) * 0.9) / cols) * 100,
      top: ((r + 0.5 + (rand(n, 2) - 0.5) * 0.9) / rows) * 100,
      size: leaves ? 74 + rand(n, 3) * 60 : 96 + rand(n, 3) * 44,
      rot: Math.round((rand(n, 4) - 0.5) * 140),
      delay: (leaves ? rand(n, 5) * 0.9 : (1 - r / rows) * 0.5 + rand(n, 5) * 0.4).toFixed(2),
      sway: Math.round((rand(n, 6) - 0.5) * 140),
      spin: Math.round((rand(n, 7) - 0.5) * 720),
      color: (leaves ? LEAF_COLORS : BALLOON_COLORS)[n % (leaves ? LEAF_COLORS.length : BALLOON_COLORS.length)],
    };
  });
  return (
    <div className={`g-scatter g-${kind}`}>
      <div className="g-scbg" />
      {items.map((it, i) => (
        <span
          key={i}
          className="g-item"
          style={{ left: `${it.left}%`, top: `${it.top}%`, width: it.size, color: it.color, '--r': `${it.rot}deg`, '--d': `${it.delay}s`, '--sw': `${it.sway}px`, '--sp': `${it.spin}deg`, zIndex: i % 5 } as CSSProperties}
        >
          {leaves ? (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 21C3 10 10 3 21 3c0 11-7 18-18 18Z" />
              <path d="M4 20 18 6" stroke="rgba(255,255,255,.4)" strokeWidth="1" fill="none" />
            </svg>
          ) : (
            <svg viewBox="0 0 40 90" fill="currentColor" aria-hidden>
              <ellipse cx="20" cy="26" rx="18" ry="24" />
              <ellipse cx="13" cy="16" rx="4" ry="7" fill="rgba(255,255,255,.4)" />
              <path d="M17 50h6l-3 5z" />
              <path d="M20 55c-6 10 6 16 0 34" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}

// ---------- ombak ----------

function Waves() {
  const layers = [
    { y0: '74%', delay: 0, color: 'color-mix(in srgb, var(--p) 78%, #fff)' },
    { y0: '68%', delay: 0.16, color: 'var(--p)' },
    { y0: '62%', delay: 0.32, color: 'color-mix(in srgb, var(--p) 70%, #002b45)' },
    { y0: '56%', delay: 0.48, color: 'color-mix(in srgb, var(--s) 50%, var(--p))' },
  ];
  return (
    <div className="g-wavescene">
      <div className="g-sky">
        <span className="g-sun" />
      </div>
      {layers.map((l, i) => (
        <div key={i} className="g-wv" style={{ '--y0': l.y0, '--wd': `${l.delay}s`, background: l.color, color: l.color } as CSSProperties}>
          <svg className="g-crest" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden>
            <path d="M0 30V14C30 2 60 2 100 14S170 26 200 14 270 2 300 14 370 26 400 14V30Z" fill="currentColor" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ---------- kado ----------

function Gift() {
  return (
    <div className="g-giftscene">
      <div className="g-giftbg" />
      <div className="g-giftwrap">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="g-conf" style={{ '--dx': `${Math.round(Math.cos((i / 16) * 6.283) * (90 + rand(i, 1) * 70))}px`, '--dy': `${Math.round(Math.sin((i / 16) * 6.283) * (90 + rand(i, 2) * 70) - 40)}px`, background: ['var(--p)', 'var(--s)', '#fff', '#ffd23f'][i % 4], animationDelay: `${0.2 + rand(i, 3) * 0.15}s` } as CSSProperties} />
        ))}
        <svg viewBox="0 0 120 120" aria-hidden>
          <g className="g-gbody">
            <rect x="10" y="54" width="100" height="60" rx="3" fill="var(--p)" />
            <rect x="54" y="54" width="12" height="60" fill="var(--s)" />
            <rect x="10" y="54" width="100" height="7" fill="rgba(0,0,0,.15)" />
          </g>
          <g className="g-glid">
            <rect x="4" y="38" width="112" height="19" rx="3" fill="color-mix(in srgb, var(--p) 82%, #000)" />
            <rect x="54" y="38" width="12" height="19" fill="var(--s)" />
            <ellipse cx="44" cy="31" rx="17" ry="9" fill="var(--s)" transform="rotate(-24 44 31)" />
            <ellipse cx="76" cy="31" rx="17" ry="9" fill="var(--s)" transform="rotate(24 76 31)" />
            <circle cx="60" cy="35" r="6" fill="color-mix(in srgb, var(--s) 70%, #000)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

// ---------- lentera ----------

function Lanterns() {
  const spots = [
    { x: 24, y: 40, s: 1.05, d: 0 },
    { x: 74, y: 34, s: 1.15, d: 0.12 },
    { x: 49, y: 58, s: 0.8, d: 0.25 },
    { x: 12, y: 68, s: 0.62, d: 0.35 },
    { x: 88, y: 66, s: 0.7, d: 0.2 },
  ];
  return (
    <div className="g-lanscene">
      <div className="g-lanbg" />
      {spots.map((p, i) => (
        <div key={i} className="g-lan" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${26 * p.s}%`, '--d': `${p.d}s`, animationDelay: `-${i * 0.7}s` } as CSSProperties}>
          <svg viewBox="0 0 60 130" aria-hidden>
            <path d="M30 0v22" stroke="var(--s)" strokeWidth="1.5" />
            <rect x="18" y="22" width="24" height="7" rx="2" fill="var(--s)" />
            <ellipse cx="30" cy="56" rx="26" ry="30" fill="var(--p)" />
            <ellipse cx="30" cy="56" rx="26" ry="30" fill="url(#g-lanshine)" />
            <path d="M30 26c-14 12-14 48 0 60M30 26c14 12 14 48 0 60M30 26v60" stroke="rgba(0,0,0,.18)" strokeWidth="1.2" fill="none" />
            <rect x="18" y="84" width="24" height="7" rx="2" fill="var(--s)" />
            <path d="M30 91v12M25 91l-3 22M35 91l3 22" stroke="var(--s)" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <radialGradient id="g-lanshine" cx="50%" cy="45%" r="55%">
                <stop offset="0" stopColor="#ffd98a" stopOpacity=".95" />
                <stop offset="1" stopColor="#ff9a3a" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      ))}
    </div>
  );
}

// ---------- kembang api ----------

const BURSTS = [
  { x: 50, y: 34, color: 'var(--s)', delay: 0.2 },
  { x: 24, y: 50, color: '#ff6b8b', delay: 0.65 },
  { x: 76, y: 44, color: 'color-mix(in srgb, var(--p) 55%, #8ad4ff)', delay: 1.05 },
];
function Fireworks() {
  return (
    <div className="g-fwscene">
      <div className="g-fwbg">
        {Array.from({ length: 26 }, (_, i) => (
          <span key={i} className="g-star" style={{ left: `${rand(i, 1) * 100}%`, top: `${rand(i, 2) * 70}%`, animationDelay: `${(rand(i, 3) * 3).toFixed(2)}s` }} />
        ))}
        <div className="g-city" />
      </div>
      {BURSTS.map((b, bi) => (
        <div key={bi} className="g-burst" style={{ left: `${b.x}%`, top: `${b.y}%`, color: b.color }}>
          <span className="g-rocket" style={{ animationDelay: `${b.delay - 0.2}s`, height: `${100 - b.y}cqh` }} />
          {Array.from({ length: 22 }, (_, i) => {
            const ang = (i / 22) * 6.283;
            const dist = 70 + (i % 3) * 22;
            return <span key={i} className="g-spark" style={{ '--dx': `${Math.round(Math.cos(ang) * dist)}px`, '--dy': `${Math.round(Math.sin(ang) * dist)}px`, animationDelay: `${b.delay}s` } as CSSProperties} />;
          })}
        </div>
      ))}
    </div>
  );
}

// ---------- kaca beku ----------

function Frost() {
  return (
    <div className="g-frost g-holed">
      <svg className="g-flake" viewBox="-50 -50 100 100" aria-hidden>
        <g stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".8">
          {[0, 60, 120].map((r) => (
            <g key={r} transform={`rotate(${r})`}>
              <path d="M0 -44V44" />
              <path d="M-9 -34L0 -26L9 -34M-9 34L0 26L9 34M-7 -18L0 -12L7 -18M-7 18L0 12L7 18" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ---------- buku ----------

function Book({ names, kicker, headingFamily }: SceneProps) {
  return (
    <div className="g-bookscene">
      <div className="g-bookbg" />
      <div className="g-book">
        <div className="g-bkpages" />
        <div className="g-bkcover">
          <div className="g-bkfront">
            <small>{kicker}</small>
            <b style={{ fontFamily: headingFamily }}>{names}</b>
            <i />
          </div>
          <div className="g-bkback" />
        </div>
      </div>
    </div>
  );
}

// ---------- game ----------

function PressStart({ names }: SceneProps) {
  return (
    <div className="g-crt">
      <div className="g-scan" />
      <small className="g-pxs">{names}</small>
      <b className="g-blink">PRESS START</b>
      <small className="g-pxs">1 PLAYER</small>
    </div>
  );
}

function Loading({ names }: SceneProps) {
  return (
    <div className="g-load">
      <PatternLayer kind="grid" opacity={0.22} color="var(--s)" />
      <small className="g-pxs">{names}</small>
      <div className="g-bar"><div className="g-barfill" /></div>
      <span className="g-lt g-lt1">SIAP MAIN?</span>
      <span className="g-lt g-lt2">READY!</span>
    </div>
  );
}

function Neon({ names, headingFamily }: SceneProps) {
  return (
    <div className="g-neonscene">
      <div className="g-neonbg g-holed" />
      <div className="g-neonwrap">
        <div className="g-neonframe">
          <span className="g-neontxt" style={{ fontFamily: headingFamily }}>{names}</span>
        </div>
      </div>
    </div>
  );
}

function Scene({ kind, ...p }: { kind: GateKind } & SceneProps): ReactNode {
  switch (kind) {
    case 'door': return <Door pattern={p.pattern} />;
    case 'glass': return <Door pattern={p.pattern} glass />;
    case 'curtain': return <Curtain pattern={p.pattern} />;
    case 'cloth': return <Curtain cloth pattern={p.pattern} />;
    case 'envelope': return <Envelope {...p} />;
    case 'portal': return <Portal />;
    case 'ring': return <Rings />;
    case 'bloom': return <Bloom />;
    case 'leaves': return <Scatter kind="leaves" />;
    case 'balloons': return <Scatter kind="balloons" />;
    case 'waves': return <Waves />;
    case 'gift': return <Gift />;
    case 'lantern': return <Lanterns />;
    case 'fireworks': return <Fireworks />;
    case 'frost': return <Frost />;
    case 'book': return <Book {...p} />;
    case 'pressstart': return <PressStart {...p} />;
    case 'loading': return <Loading {...p} />;
    case 'neon': return <Neon {...p} />;
  }
}

export function Gate({ kind, phase, embedded, names, kicker, guest, pattern, headingFamily, onOpen }: {
  kind: GateKind;
  phase: GatePhase;
  embedded: boolean;
  names: string;
  kicker: string;
  guest: string | null;
  pattern: PatternKind;
  headingFamily: string;
  onOpen: () => void;
}) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <div className={embedded ? 'absolute inset-x-0 top-0 z-[60] h-[810px]' : 'fixed inset-y-0 left-1/2 z-[60] w-full max-w-[480px] -translate-x-1/2'}>
      <style>{GATE_CSS}</style>
      <div className="wl-gate" data-kind={kind} data-phase={phase} data-tone={DARK[kind] ? 'dark' : 'light'} role="button" tabIndex={0} aria-label={`Buka undangan. ${CTA[kind]}`} onClick={onOpen} onKeyDown={onKey}>
        <Scene kind={kind} names={names} kicker={kicker} pattern={pattern} headingFamily={headingFamily} />
        {!OWN_TITLE[kind] && (
          <div className="wl-gate-title">
            <small>{kicker}</small>
            <b style={{ fontFamily: headingFamily }}>{names}</b>
            {guest && <em>Kepada Yth. {guest}</em>}
          </div>
        )}
        <div className="wl-gate-cta">{CTA[kind]}</div>
      </div>
    </div>
  );
}

const GATE_CSS = `
@property --h{syntax:'<percentage>';inherits:false;initial-value:0%}
.wl-gate{position:absolute;inset:0;overflow:hidden;container-type:size;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none;user-select:none;color:var(--tx)}
.wl-gate[data-tone=dark]{color:#fff}
.wl-gate *{box-sizing:border-box}
.wl-gate svg{display:block}
.wl-gate-cta{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);z-index:30;white-space:nowrap;padding:.75em 1.6em;border-radius:var(--rb);background:var(--p);color:#fff;font-size:13.5px;font-weight:500;letter-spacing:.04em;box-shadow:0 10px 26px -8px rgba(0,0,0,.5);animation:wl-pulse 2.4s ease-in-out infinite;transition:opacity .3s}
.wl-gate:focus-visible .wl-gate-cta{outline:2px solid #fff;outline-offset:3px}
.wl-gate-title{position:absolute;left:0;right:0;top:8%;z-index:30;text-align:center;padding:0 8%;pointer-events:none;transition:opacity .35s;text-shadow:0 2px 14px rgba(0,0,0,.28)}
.wl-gate[data-tone=light] .wl-gate-title{text-shadow:none}
.wl-gate[data-kind=door] .wl-gate-title,.wl-gate[data-kind=glass] .wl-gate-title,.wl-gate[data-kind=cloth] .wl-gate-title,.wl-gate[data-kind=curtain] .wl-gate-title{top:0;padding-top:8%;padding-bottom:14%;background:linear-gradient(rgba(0,0,0,.62),rgba(0,0,0,0))}
.wl-gate-title small{display:block;font-size:11px;letter-spacing:.32em;text-transform:uppercase;opacity:.9}
.wl-gate-title b{display:block;margin-top:.45em;font-weight:600;font-size:1.9rem;line-height:1.12}
.wl-gate-title em{display:block;margin-top:.9em;font-size:13px;font-style:normal;opacity:.9}
.wl-gate[data-phase=opening] .wl-gate-cta,.wl-gate[data-phase=opening] .wl-gate-title{opacity:0}
.wl-gate[data-phase=opening]{cursor:default}

@keyframes g-hole{to{--h:150%}}
.g-holed{-webkit-mask-image:radial-gradient(circle at 50% 46%,transparent var(--h),#000 calc(var(--h) + 3%));mask-image:radial-gradient(circle at 50% 46%,transparent var(--h),#000 calc(var(--h) + 3%))}
@keyframes g-spin{to{transform:rotate(360deg)}}
@keyframes g-bob{0%,100%{translate:0 0}50%{translate:0 -6px}}
@keyframes g-breathe{0%,100%{scale:1;opacity:.78}50%{scale:1.06;opacity:1}}
@keyframes g-blink{50%{opacity:0}}
@keyframes g-twinkle{0%,100%{opacity:.15}50%{opacity:1}}

/* pintu & jendela kaca patri */
.g-door{position:absolute;inset:0;perspective:1400px}
.g-doorbg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,color-mix(in srgb,var(--p) 30%,#000),#000 75%)}
.g-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,color-mix(in srgb,var(--s) 65%,#fff),transparent 70%);opacity:0}
.g-leaf{position:absolute;top:0;bottom:0;width:50.3%;backface-visibility:hidden;transition:transform 1.75s cubic-bezier(.65,0,.25,1) .15s;overflow:hidden}
.g-l{left:0;transform-origin:0 50%}.g-r{right:0;transform-origin:100% 50%}
.g-wood{background:linear-gradient(90deg,color-mix(in srgb,var(--p) 68%,#000),color-mix(in srgb,var(--p) 86%,#000) 50%,color-mix(in srgb,var(--p) 68%,#000));box-shadow:inset 0 0 0 7px color-mix(in srgb,var(--s) 60%,transparent),inset 0 0 70px rgba(0,0,0,.4)}
.g-panel{position:absolute;left:13%;right:13%;border:2px solid color-mix(in srgb,var(--s) 70%,transparent);border-radius:6px;background:rgba(0,0,0,.14)}
.g-handle{position:absolute;top:50%;width:15px;height:15px;border-radius:50%;background:var(--s);box-shadow:0 0 0 4px rgba(0,0,0,.28)}
.g-l .g-handle{right:9%}.g-r .g-handle{left:9%}
.g-glassleaf{background:#1a120c;padding:14px 10px}
.g-panes{display:grid;grid-template-columns:1fr;grid-auto-rows:1fr;gap:8px;height:100%}
.g-panes{grid-template-columns:1fr 1fr}
.g-pane{border-radius:45% 45% 5px 5px/22% 22% 5px 5px;background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--c) 55%,#fff),var(--c) 70%);box-shadow:inset 0 0 14px rgba(0,0,0,.4)}
.wl-gate[data-phase=opening] .g-l{transform:rotateY(-108deg)}
.wl-gate[data-phase=opening] .g-r{transform:rotateY(108deg)}
.wl-gate[data-phase=opening] .g-doorbg{opacity:0;transition:opacity .7s ease 1.4s}
.wl-gate[data-phase=opening] .g-glow{animation:g-glowpulse 2.1s ease .1s forwards}
@keyframes g-glowpulse{0%{opacity:0}45%{opacity:.9}100%{opacity:0}}

/* tirai & kain */
.g-cwrap{position:absolute;inset:0}
.g-stage{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,color-mix(in srgb,var(--s) 60%,transparent),transparent 65%),#0a0a0a}
.g-cur{position:absolute;top:0;bottom:0;width:50.5%;transition:transform 1.9s cubic-bezier(.6,0,.2,1) .2s;overflow:hidden}
.g-cl{left:0}.g-cr{right:0}
.g-velvet{background:repeating-linear-gradient(90deg,color-mix(in srgb,var(--p) 70%,#000) 0 10px,var(--p) 10px 24px,color-mix(in srgb,var(--p) 84%,#fff) 24px 28px,var(--p) 28px 36px);box-shadow:inset 0 -90px 90px -70px rgba(0,0,0,.6)}
.g-ulos{background:repeating-linear-gradient(0deg,var(--p) 0 26px,#141414 26px 32px,#f4efe6 32px 36px,#141414 36px 42px,var(--s) 42px 50px)}
.g-valance{position:absolute;left:0;right:0;top:0;height:9%;z-index:3;background:linear-gradient(color-mix(in srgb,var(--p) 58%,#000),var(--p));border-bottom:4px solid var(--s);transition:transform .7s ease 1.7s}
.wl-gate[data-phase=opening] .g-cl{transform:translateX(-103%)}
.wl-gate[data-phase=opening] .g-cr{transform:translateX(103%)}
.wl-gate[data-phase=opening] .g-valance{transform:translateY(-110%)}
.wl-gate[data-phase=opening] .g-stage{opacity:0;transition:opacity .7s ease 1.5s}

/* amplop */
.g-envscene{position:absolute;inset:0}
.g-envbg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--s) 40%,var(--bg)),var(--bg) 72%);transition:opacity 1s ease 1.6s}
.g-envwrap{position:absolute;left:50%;top:50%;width:82%;aspect-ratio:1.45;transform:translate(-50%,-44%);transition:transform 1.2s cubic-bezier(.6,0,.2,1) 1.7s,opacity .9s ease 1.9s}
.g-envback{position:absolute;inset:0;background:color-mix(in srgb,var(--s) 62%,var(--bg));border-radius:4px;box-shadow:0 24px 44px -18px rgba(0,0,0,.45)}
.g-card{position:absolute;left:7%;right:7%;top:9%;bottom:9%;z-index:2;background:#fffdf8;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#3b2a20;padding:5%;transition:transform 1.05s cubic-bezier(.4,0,.2,1) .75s;box-shadow:0 2px 10px rgba(0,0,0,.15)}
.g-card small{font-size:9px;letter-spacing:.3em;text-transform:uppercase;opacity:.7}
.g-card b{margin-top:.5em;font-size:1.45rem;line-height:1.15;color:var(--p);font-weight:600}
.g-card i{display:block;width:34%;height:1px;margin-top:.9em;background:var(--s)}
.g-front{position:absolute;inset:0;z-index:3;background:color-mix(in srgb,var(--s) 78%,var(--bg));clip-path:polygon(0 0,50% 54%,100% 0,100% 100%,0 100%);filter:drop-shadow(0 -2px 3px rgba(0,0,0,.18))}
.g-flap{position:absolute;left:0;right:0;top:0;height:57%;z-index:4;transform-origin:50% 0;background:color-mix(in srgb,var(--s) 55%,var(--p));clip-path:polygon(0 0,100% 0,50% 100%);transition:transform .9s cubic-bezier(.5,0,.2,1) .05s,z-index 0s .45s}
.g-seal{position:absolute;left:50%;top:54%;width:17%;aspect-ratio:1;transform:translate(-50%,-50%);z-index:5;border-radius:50%;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--p) 60%,#fff),var(--p) 60%,color-mix(in srgb,var(--p) 60%,#000));color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,.35);animation:g-bob 3s ease-in-out infinite}
.wl-gate[data-phase=opening] .g-flap{transform:rotateX(180deg);z-index:1}
.wl-gate[data-phase=opening] .g-seal{opacity:0;transform:translate(-50%,-50%) scale(1.5);transition:opacity .3s,transform .3s;animation:none}
.wl-gate[data-phase=opening] .g-card{transform:translateY(-52%)}
.wl-gate[data-phase=opening] .g-envwrap{transform:translate(-50%,130%) scale(.9);opacity:0}
.wl-gate[data-phase=opening] .g-envbg{opacity:0}

/* portal sihir */
.g-portalscene{position:absolute;inset:0}
.g-portalbg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--p) 45%,#1a0b3a) 0,#05030f 72%);transition:opacity .5s ease 2s}
.g-rings{position:absolute;left:50%;top:46%;width:84%;aspect-ratio:1;transform:translate(-50%,-50%);filter:drop-shadow(0 0 8px var(--s));transition:transform 1.8s cubic-bezier(.6,0,.3,1) .1s,opacity 1s ease 1.2s}
.g-rings svg{width:100%;height:100%}
.g-rings g{transform-box:fill-box;transform-origin:center}
.g-r1{animation:g-spin 20s linear infinite}.g-r2{animation:g-spin 13s linear infinite reverse}.g-r3{animation:g-spin 8s linear infinite}
.g-core{position:absolute;left:50%;top:50%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fff,color-mix(in srgb,var(--s) 70%,transparent) 45%,transparent 70%);animation:g-breathe 2.6s ease-in-out infinite}
.wl-gate[data-phase=opening] .g-rings{transform:translate(-50%,-50%) scale(3.6);opacity:0}
.wl-gate[data-phase=opening] .g-portalbg{animation:g-hole 1.9s cubic-bezier(.5,0,.3,1) .5s forwards;opacity:0}

/* cincin */
.g-ringscene{position:absolute;inset:0}
.g-ringbg{position:absolute;inset:0;background:radial-gradient(circle at 50% 44%,color-mix(in srgb,var(--s) 38%,var(--bg)),var(--bg) 72%);transition:opacity 1s ease 1.7s}
.g-ringswrap{position:absolute;left:50%;top:44%;width:88%;aspect-ratio:5/3;transform:translate(-50%,-50%);filter:drop-shadow(0 6px 10px rgba(0,0,0,.25));transition:opacity .9s ease 1.8s,transform 1.2s ease 1.6s}
.g-ringswrap svg{width:100%;height:100%;overflow:visible}
.g-rA,.g-rB{transition:transform 1.3s cubic-bezier(.5,0,.2,1) .1s;transform-box:fill-box;transform-origin:center;animation:g-bob 3.4s ease-in-out infinite}
.g-rB{animation-delay:-1.7s}
.g-sp{opacity:0;transform-box:fill-box;transform-origin:center}
.wl-gate[data-phase=opening] .g-rA{transform:translateX(17%) rotate(24deg);animation:none}
.wl-gate[data-phase=opening] .g-rB{transform:translateX(-17%) rotate(-24deg);animation:none}
.wl-gate[data-phase=opening] .g-sp{animation:g-pop 1.1s ease-out forwards}
@keyframes g-pop{0%{opacity:0;transform:scale(.2)}35%{opacity:1;transform:scale(1.5)}100%{opacity:0;transform:scale(.8)}}
.wl-gate[data-phase=opening] .g-ringswrap{opacity:0;transform:translate(-50%,-50%) scale(1.3)}
.wl-gate[data-phase=opening] .g-ringbg{opacity:0}

/* bunga */
.g-bloomscene{position:absolute;inset:0}
.g-bloombg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--p) 14%,var(--bg)),var(--bg) 72%);transition:opacity 1s ease 1.7s}
.g-flower{position:absolute;left:50%;top:46%;width:86%;aspect-ratio:1;transform:translate(-50%,-50%);transition:transform 1.5s cubic-bezier(.5,0,.3,1) 1.5s,opacity .9s ease 2s;animation:g-bob 4s ease-in-out infinite}
.g-flower svg{width:100%;height:100%;overflow:visible}
.g-petal{transform-box:fill-box;transform-origin:50% 100%;transform:scale(.28);transition:transform 1.5s cubic-bezier(.3,1.35,.4,1) calc(var(--i) * 45ms + .1s)}
.wl-gate[data-phase=opening] .g-petal{transform:scale(1)}
.wl-gate[data-phase=opening] .g-flower{transform:translate(-50%,-50%) scale(5.5);opacity:0;animation:none}
.wl-gate[data-phase=opening] .g-bloombg{opacity:0}

/* daun berguguran & balon */
.g-scatter{position:absolute;inset:0}
.g-scbg{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--p) 16%,var(--bg)),var(--bg) 75%);transition:opacity 1s ease .55s}
.g-item{position:absolute;transform:translate(-50%,-50%) rotate(var(--r));filter:drop-shadow(0 3px 4px rgba(0,0,0,.18))}
.g-item svg{width:100%;height:auto}
.wl-gate[data-phase=opening] .g-scbg{opacity:0}
.wl-gate[data-phase=opening] .g-leaves .g-item{animation:g-fall 2.1s cubic-bezier(.5,0,.9,.6) var(--d) forwards}
.wl-gate[data-phase=opening] .g-balloons .g-item{animation:g-rise 2.2s cubic-bezier(.4,0,.6,1) var(--d) forwards}
@keyframes g-fall{to{transform:translate(calc(-50% + var(--sw)),150cqh) rotate(calc(var(--r) + var(--sp)))}}
@keyframes g-rise{to{transform:translate(calc(-50% + var(--sw)),-150cqh) rotate(calc(var(--r) * -1))}}

/* ombak */
.g-wavescene{position:absolute;inset:0;overflow:hidden}
.g-sky{position:absolute;inset:0;background:linear-gradient(#ffe9c2,#bfe6ff 62%,color-mix(in srgb,var(--p) 30%,#bfe6ff));transition:opacity .8s ease 1.8s}
.g-sun{position:absolute;left:50%;top:26%;width:26%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle,#fff6d6,#ffd166 60%,transparent 72%)}
.g-wv{position:absolute;left:0;right:0;top:0;height:112%;transform:translateY(var(--y0))}
.g-crest{position:absolute;left:0;top:-29px;width:100%;height:30px;animation:g-bob 3.2s ease-in-out infinite}
.wl-gate[data-phase=opening] .g-wv{animation:g-sweep 2.3s cubic-bezier(.45,0,.3,1) var(--wd) forwards}
.wl-gate[data-phase=opening] .g-sky{opacity:0}
@keyframes g-sweep{0%{transform:translateY(var(--y0))}42%{transform:translateY(-8%)}100%{transform:translateY(115%)}}

/* kado */
.g-giftscene{position:absolute;inset:0}
.g-giftbg{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--s) 30%,var(--bg)),var(--bg) 74%);transition:opacity 1s ease 1.5s}
.g-giftwrap{position:absolute;left:50%;top:50%;width:64%;aspect-ratio:1;transform:translate(-50%,-46%);transition:opacity .8s ease 1.5s}
.g-giftwrap svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 12px 14px rgba(0,0,0,.25));animation:g-bob 3.4s ease-in-out infinite}
.g-glid,.g-gbody{transform-box:fill-box;transform-origin:center;transition:transform 1.1s cubic-bezier(.5,0,.3,1) .1s,opacity .8s ease .3s}
.g-gbody{transition-delay:.9s}
.g-conf{position:absolute;left:50%;top:38%;width:9px;height:14px;border-radius:2px;opacity:0}
.wl-gate[data-phase=opening] .g-glid{transform:translateY(-140%) rotate(-16deg);opacity:0}
.wl-gate[data-phase=opening] .g-gbody{transform:translateY(40%) scale(.7);opacity:0}
.wl-gate[data-phase=opening] .g-conf{animation:g-conf 1.3s ease-out forwards}
.wl-gate[data-phase=opening] .g-giftbg{opacity:0}
.wl-gate[data-phase=opening] .g-giftwrap{opacity:0}
@keyframes g-conf{0%{opacity:0;transform:translate(0,0) rotate(0)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 80px)) rotate(300deg)}}

/* lentera */
.g-lanscene{position:absolute;inset:0}
.g-lanbg{position:absolute;inset:0;background:linear-gradient(#150404,color-mix(in srgb,var(--p) 55%,#000));transition:opacity 1s ease 1.4s}
.g-lan{position:absolute;transform:translate(-50%,-50%);transform-origin:50% 0;animation:g-swing 3.6s ease-in-out infinite alternate;filter:drop-shadow(0 0 16px color-mix(in srgb,var(--s) 80%,#ff9a3a))}
@keyframes g-swing{from{rotate:-3deg}to{rotate:3deg}}
.g-lan svg{width:100%;height:auto}
.wl-gate[data-phase=opening] .g-lan{animation:g-lanrise 2.1s cubic-bezier(.5,0,.7,.4) var(--d) forwards}
@keyframes g-lanrise{0%{transform:translate(-50%,-50%) scale(1)}18%{transform:translate(-50%,-50%) scale(1.18);filter:drop-shadow(0 0 30px #ffb347)}100%{transform:translate(-50%,-190cqh) scale(1)}}
.wl-gate[data-phase=opening] .g-lanbg{opacity:0}

/* kembang api */
.g-fwscene{position:absolute;inset:0}
.g-fwbg{position:absolute;inset:0;background:linear-gradient(#050818,color-mix(in srgb,var(--p) 32%,#050818));transition:opacity .9s ease 2s}
.g-star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;animation:g-twinkle 3s ease-in-out infinite}
.g-city{position:absolute;left:0;right:0;bottom:0;height:16%;background:#02030a;clip-path:polygon(0 60%,6% 60%,6% 30%,14% 30%,14% 55%,22% 55%,22% 20%,30% 20%,30% 50%,38% 50%,38% 35%,47% 35%,47% 62%,56% 62%,56% 25%,64% 25%,64% 52%,73% 52%,73% 30%,82% 30%,82% 58%,90% 58%,90% 40%,100% 40%,100% 100%,0 100%)}
.g-burst{position:absolute;width:0;height:0}
.g-rocket{position:absolute;left:-1px;top:0;width:3px;border-radius:2px;background:linear-gradient(transparent,#fff);opacity:0;transform-origin:50% 0;transform:translateY(0)}
.g-spark{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor;opacity:0}
.wl-gate[data-phase=opening] .g-spark{animation:g-spark 1.4s ease-out forwards}
.wl-gate[data-phase=opening] .g-rocket{animation:g-rocket .5s ease-in forwards}
@keyframes g-spark{0%{opacity:0;transform:translate(0,0) scale(.4)}10%{opacity:1}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 36px)) scale(1)}}
@keyframes g-rocket{0%{opacity:0;transform:translateY(60cqh)}20%{opacity:1}100%{opacity:0;transform:translateY(0)}}
.wl-gate[data-phase=opening] .g-fwbg{opacity:0}

/* kaca beku */
.g-frost{position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.66),rgba(205,230,252,.5) 45%,rgba(255,255,255,.7));-webkit-backdrop-filter:blur(20px) saturate(1.15);backdrop-filter:blur(20px) saturate(1.15);transition:opacity .5s ease 1.6s}
.g-flake{position:absolute;left:50%;top:46%;width:78%;transform:translate(-50%,-50%);animation:g-breathe 5s ease-in-out infinite}
.wl-gate[data-phase=opening] .g-frost{animation:g-hole 1.6s cubic-bezier(.5,0,.3,1) .1s forwards;opacity:0}

/* buku */
.g-bookscene{position:absolute;inset:0}
.g-bookbg{position:absolute;inset:0;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--p) 18%,var(--bg)),var(--bg) 75%);transition:opacity 1s ease 1.8s}
.g-book{position:absolute;left:50%;top:47%;width:64%;aspect-ratio:3/4;transform:translate(-50%,-50%);perspective:1300px;transition:transform 1.3s cubic-bezier(.5,0,.3,1) 1.7s,opacity .9s ease 2s;animation:g-bob 4s ease-in-out infinite}
.g-bkpages{position:absolute;inset:2% 1% 2% 0;border-radius:0 6px 6px 0;background:repeating-linear-gradient(0deg,#f7f0e1 0 3px,#e6dbc5 3px 4px);box-shadow:0 18px 30px -14px rgba(0,0,0,.45)}
.g-bkcover{position:absolute;inset:0;transform-style:preserve-3d;transform-origin:0 50%;transition:transform 1.5s cubic-bezier(.5,0,.2,1) .15s}
.g-bkfront,.g-bkback{position:absolute;inset:0;backface-visibility:hidden;border-radius:4px 10px 10px 4px}
.g-bkfront{background:linear-gradient(135deg,color-mix(in srgb,var(--p) 86%,#fff),color-mix(in srgb,var(--p) 70%,#000));border:3px solid var(--s);box-shadow:inset 0 0 0 6px rgba(0,0,0,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;padding:8%}
.g-bkfront small{font-size:9px;letter-spacing:.3em;text-transform:uppercase;opacity:.85}
.g-bkfront b{margin-top:.6em;font-size:1.55rem;line-height:1.15;font-weight:600;color:#fff}
.g-bkfront i{display:block;width:40%;height:2px;margin-top:1em;background:var(--s)}
.g-bkback{transform:rotateY(180deg);background:repeating-linear-gradient(0deg,#f7f0e1 0 3px,#e6dbc5 3px 4px)}
.wl-gate[data-phase=opening] .g-bkcover{transform:rotateY(-172deg)}
.wl-gate[data-phase=opening] .g-book{transform:translate(-50%,-50%) scale(3);translate:50% 0;opacity:0;animation:none;transition:transform 1.3s cubic-bezier(.5,0,.3,1) 1.7s,opacity .9s ease 2s,translate 1.4s ease .15s}
.wl-gate[data-phase=opening] .g-bookbg{opacity:0}

/* game */
.g-crt{position:absolute;inset:0;background:#05060a;color:#fff;font-family:var(--font-pixel),monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.2em;transform-origin:50% 50%}
.g-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px);pointer-events:none}
.g-pxs{font-size:10px;letter-spacing:.2em;opacity:.85;text-align:center;padding:0 8%;line-height:1.7;text-transform:uppercase}
.g-blink{font-size:1.5rem;letter-spacing:.06em;color:var(--s);text-shadow:0 0 12px var(--p);animation:g-blink 1s steps(2) infinite}
.wl-gate[data-phase=opening] .g-crt{animation:g-crtoff 1.15s cubic-bezier(.7,0,.3,1) .05s forwards}
@keyframes g-crtoff{0%{transform:scale(1,1);filter:brightness(1)}55%{transform:scale(1,.012);filter:brightness(3)}85%{transform:scale(.02,.012);filter:brightness(4)}100%{transform:scale(0,0);opacity:0}}
.g-load{position:absolute;inset:0;background:color-mix(in srgb,var(--p) 22%,#080b1c);color:#fff;font-family:var(--font-pixel),monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6em;transition:opacity .6s ease 2s,transform .6s ease 2s}
.g-bar{width:72%;height:24px;border:3px solid #fff;padding:3px;position:relative;z-index:2}
.g-barfill{height:100%;width:0;background:repeating-linear-gradient(90deg,var(--s) 0 10px,transparent 10px 13px);transition:width 1.6s steps(14) .1s}
.g-lt{position:absolute;left:0;right:0;top:56%;text-align:center;font-size:11px;letter-spacing:.2em;z-index:2}
.g-lt1{animation:g-blink 1.2s steps(2) infinite}
.g-lt2{opacity:0;color:var(--s)}
.wl-gate[data-phase=opening] .g-barfill{width:100%}
.wl-gate[data-phase=opening] .g-lt1{opacity:0;animation:none}
.wl-gate[data-phase=opening] .g-lt2{opacity:1;transition:opacity .1s ease 1.75s}
.wl-gate[data-phase=opening] .g-load{opacity:0;transform:scale(1.06)}
.g-neonscene{position:absolute;inset:0}
.g-neonbg{position:absolute;inset:0;background:#07060d;transition:opacity .5s ease 2s}
.g-neonwrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:transform 1.3s ease .1s,opacity .8s ease 1.1s}
.g-neonframe{padding:1.3em 1.4em;border:3px solid var(--p);border-radius:14px;box-shadow:0 0 12px var(--p),inset 0 0 12px var(--p);max-width:84%;text-align:center}
.g-neontxt{display:block;font-size:2.1rem;line-height:1.2;color:#fff;text-shadow:0 0 6px var(--s),0 0 18px var(--s),0 0 42px var(--p);animation:g-flicker 4s linear infinite}
@keyframes g-flicker{0%,17%,23%,58%,64%,100%{opacity:1}20%,61%{opacity:.35}}
.wl-gate[data-phase=opening] .g-neonwrap{transform:scale(2.6);opacity:0}
.wl-gate[data-phase=opening] .g-neontxt{animation:none;text-shadow:0 0 10px #fff,0 0 30px var(--s),0 0 70px var(--p)}
.wl-gate[data-phase=opening] .g-neonbg{animation:g-hole 1.5s cubic-bezier(.5,0,.3,1) .6s forwards;opacity:0}

/* kurangi gerakan: tanpa gerak, hanya memudar */
@media (prefers-reduced-motion:reduce){
  .wl-gate *{animation:none!important;transition:none!important}
  .wl-gate{transition:opacity .3s ease!important}
  .wl-gate[data-phase=opening]{opacity:0}
}
`;
