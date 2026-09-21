'use client';

/* eslint-disable @next/next/no-img-element */
import { useLayoutEffect } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { CoverFxKind, FrameKind, ParticleKind, ParticleMode, PatternKind } from './motifs';

// Pseudo-acak deterministik (sama di server & klien) supaya hidrasi konsisten.
const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- partikel ----------

const SIZE: Record<ParticleKind, number> = { petal: 15, leaf: 16, maple: 18, snow: 13, heart: 16, star: 12, sparkle: 15, confetti: 9, bubble: 22, firefly: 7, pixel: 9, lantern: 17, bat: 22, coin: 13 };
const COLORS: Record<ParticleKind, string[]> = {
  petal: ['var(--p)', 'var(--s)', 'color-mix(in srgb, var(--p) 45%, #fff)'],
  leaf: ['var(--p)', 'var(--s)'],
  maple: ['var(--p)', 'var(--s)', '#c2571a'],
  snow: ['var(--s)', 'var(--p)', 'color-mix(in srgb, var(--s) 50%, #fff)'],
  heart: ['var(--p)', 'var(--s)', '#ff6b8b'],
  star: ['var(--s)', 'var(--p)'],
  sparkle: ['var(--s)', 'var(--p)', '#f5d76e'],
  confetti: ['var(--p)', 'var(--s)', '#f5c542', '#ffffff', '#3ba3ff'],
  bubble: ['var(--s)', 'var(--p)'],
  firefly: ['#ffe58a', 'var(--s)'],
  pixel: ['var(--p)', 'var(--s)'],
  lantern: ['var(--p)', 'var(--s)', '#f5b342'],
  bat: ['var(--p)', 'var(--tx)'],
  coin: ['#f2c231', '#e8a90c'],
};

function Shape({ kind }: { kind: ParticleKind }) {
  const s = SIZE[kind];
  const common = { width: s, height: s, viewBox: '0 0 24 24', 'aria-hidden': true } as const;
  switch (kind) {
    case 'petal':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2C18 8 18 16 12 22C6 16 6 8 12 2Z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...common} fill="currentColor">
          <path d="M4 20C4 10 10 4 20 4C20 14 14 20 4 20Z" />
        </svg>
      );
    case 'maple':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2l2.5 5 4-1-1 4.5 4 2-4 2 1 4.5-4-1L12 22l-2.5-5-4 1 1-4.5-4-2 4-2-1-4.5 4 1z" />
        </svg>
      );
    case 'snow':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3.5-3 7-10 13Z" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z" />
        </svg>
      );
    case 'confetti':
      return (
        <svg {...common} fill="currentColor">
          <rect x="6" y="3" width="12" height="18" rx="1.5" />
        </svg>
      );
    case 'bubble':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" opacity=".7" />
          <path d="M7.5 9a5 5 0 0 1 3-3" strokeLinecap="round" />
        </svg>
      );
    case 'firefly':
      return <span style={{ display: 'block', width: s, height: s, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px 3px currentColor' }} />;
    case 'pixel':
      return <span style={{ display: 'block', width: s, height: s, background: 'currentColor' }} />;
    case 'lantern':
      return (
        <svg {...common} fill="currentColor">
          <path d="M8 3h8v2H8zM6 5h12c1 4 1 9 0 13H6c-1-4-1-9 0-13zM9 18h6v3H9z" />
        </svg>
      );
    case 'bat':
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 8c-2-3-6-4-10-3 2 1 3 3 3 5 1-1 2-1 3 0 1-1 3-1 4 1 1-2 3-2 4-1 1-1 2-1 3 0 0-2 1-4 3-5-4-1-8 0-10 3z" />
        </svg>
      );
    case 'coin':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <circle cx="12" cy="12" r="6.5" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" />
        </svg>
      );
  }
}

const MODE_CLASS: Record<ParticleMode, string> = { fall: 'wl-fall', rise: 'wl-rise', twinkle: 'wl-twinkle', drift: 'wl-drift' };

// Lapisan partikel. `height` = tinggi area (px) dipakai untuk lintasan jatuh/naik.
export function Particles({ kind, count, mode, height }: { kind: ParticleKind; count: number; mode: ParticleMode; height: number | string }) {
  const colors = COLORS[kind];
  const isStatic = mode === 'twinkle' || mode === 'drift';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ '--h': typeof height === 'number' ? `${height}px` : height } as CSSProperties} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const dur = isStatic ? 2.6 + rand(i, 3) * 3.4 : 9 + rand(i, 3) * 10;
        const style = {
          left: `${(rand(i, 1) * 100).toFixed(2)}%`,
          ...(isStatic ? { top: `${(rand(i, 6) * 100).toFixed(2)}%` } : null),
          color: colors[i % colors.length],
          transform: undefined,
          animationDuration: `${dur.toFixed(2)}s`,
          animationDelay: `${(-rand(i, 4) * dur).toFixed(2)}s`,
          '--sway': `${((rand(i, 5) - 0.5) * (mode === 'drift' ? 70 : 90)).toFixed(0)}px`,
          '--rot': `${((rand(i, 7) - 0.5) * 540).toFixed(0)}deg`,
          '--o': (0.55 + rand(i, 8) * 0.4).toFixed(2),
          scale: (0.65 + rand(i, 2) * 0.85).toFixed(2),
        } as CSSProperties;
        return (
          <span key={i} className={`wl-particle ${MODE_CLASS[mode]}`} style={style}>
            <Shape kind={kind} />
          </span>
        );
      })}
    </div>
  );
}

// ---------- pola latar (mask, mengikuti warna tema) ----------

const P = (w: number, h: number, body: string) => ({ w, h, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="#000" stroke-width="1.4">${body}</svg>` });
const star8At = (cx: number, cy: number, r: number) => {
  const b = r * 0.72;
  return `M${cx} ${cy - r}L${cx + b * 0.38} ${cy - b * 0.38}L${cx + r} ${cy}L${cx + b * 0.38} ${cy + b * 0.38}L${cx} ${cy + r}L${cx - b * 0.38} ${cy + b * 0.38}L${cx - r} ${cy}L${cx - b * 0.38} ${cy - b * 0.38}Z`;
};
const sparkleAt = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

const PATTERNS: Record<Exclude<PatternKind, 'none'>, { w: number; h: number; svg: string }> = {
  dots: P(24, 24, '<circle cx="12" cy="12" r="1.8" fill="#000" stroke="none"/>'),
  kawung: P(40, 40, '<circle cx="20" cy="0" r="14"/><circle cx="0" cy="20" r="14"/><circle cx="40" cy="20" r="14"/><circle cx="20" cy="40" r="14"/><circle cx="20" cy="20" r="2.4" fill="#000" stroke="none"/>'),
  zigzag: P(32, 18, '<path d="M0 13L8 5L16 13L24 5L32 13" stroke-width="2"/>'),
  diamond: P(28, 28, '<path d="M14 2L26 14L14 26L2 14Z"/><circle cx="14" cy="14" r="1.6" fill="#000" stroke="none"/>'),
  scallop: P(40, 20, '<path d="M0 20A20 20 0 0 1 40 20"/><path d="M8 20A12 12 0 0 1 32 20"/>'),
  grid: P(16, 16, '<path d="M16 0V16M0 16H16" stroke-width="1"/>'),
  stars: P(60, 60, `<path d="${sparkleAt(12, 14, 6)}" fill="#000" stroke="none"/><path d="${sparkleAt(42, 30, 4)}" fill="#000" stroke="none"/><path d="${sparkleAt(24, 50, 5)}" fill="#000" stroke="none"/>`),
  star8: P(36, 36, `<path d="${star8At(18, 18, 12)}"/>`),
  hearts: P(36, 36, '<path d="M18 26C12 21 9 18 9 15a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 3-3 6-9 11Z" fill="#000" stroke="none"/>'),
  leaves: P(44, 44, '<ellipse cx="12" cy="12" rx="8" ry="3.4" transform="rotate(-35 12 12)" fill="#000" stroke="none"/><ellipse cx="32" cy="33" rx="8" ry="3.4" transform="rotate(35 32 33)" fill="#000" stroke="none"/>'),
  stripes: P(20, 20, '<path d="M0 20L20 0" stroke-width="3"/>'),
  cross: P(28, 28, '<path d="M14 8v12M8 14h12" stroke-width="1.8"/>'),
};

export function PatternLayer({ kind, opacity = 0.09 }: { kind: PatternKind; opacity?: number }) {
  if (kind === 'none') return null;
  const p = PATTERNS[kind];
  const url = `url("data:image/svg+xml,${encodeURIComponent(p.svg)}")`;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: 'var(--p)', opacity, WebkitMaskImage: url, maskImage: url, WebkitMaskSize: `${p.w}px ${p.h}px`, maskSize: `${p.w}px ${p.h}px`, WebkitMaskRepeat: 'repeat', maskRepeat: 'repeat' }}
      aria-hidden
    />
  );
}

// ---------- efek latar sampul ----------

export function CoverFx({ kind, animate }: { kind: CoverFxKind; animate: boolean }) {
  const anim = (cls: string) => (animate ? cls : '');
  switch (kind) {
    case 'none':
      return null;
    case 'aurora':
      return (
        <div
          className={`pointer-events-none absolute inset-0 opacity-70 ${anim('wl-aurora')}`}
          style={{ backgroundImage: 'linear-gradient(120deg, color-mix(in srgb, var(--p) 34%, transparent), color-mix(in srgb, var(--s) 42%, transparent), color-mix(in srgb, var(--p) 22%, transparent), color-mix(in srgb, var(--s) 34%, transparent))', backgroundSize: '180% 180%' }}
          aria-hidden
        />
      );
    case 'rays':
      return (
        <div className="pointer-events-none absolute left-1/2 top-[28%] h-[240%] w-[240%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
          <div
            className={`h-full w-full ${anim('wl-rays')}`}
            style={{ backgroundImage: 'repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--s) 32%, transparent) 0deg 5deg, transparent 5deg 16deg)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 48%)', maskImage: 'radial-gradient(circle, #000 0%, transparent 48%)' }}
          />
        </div>
      );
    case 'spotlight':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className={`absolute -top-[10%] left-[-25%] h-[120%] w-[150%] ${anim('wl-spot')}`} style={{ background: 'radial-gradient(ellipse 34% 62% at 50% 0%, color-mix(in srgb, var(--s) 55%, transparent), transparent 72%)' }} />
        </div>
      );
    case 'scanlines':
      return (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 1px, transparent 1px 3px)' }} />
          <div className={`absolute inset-0 ${anim('wl-scan')}`} style={{ backgroundImage: 'linear-gradient(transparent 0, color-mix(in srgb, var(--s) 11%, transparent) 50%, transparent 100%)', backgroundSize: '100% 110px', backgroundRepeat: 'repeat' }} />
        </div>
      );
    case 'clouds':
      return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[
            { top: '9%', w: 130, dur: 56, del: -8, o: 0.6 },
            { top: '30%', w: 90, dur: 72, del: -40, o: 0.45 },
            { top: '68%', w: 150, dur: 64, del: -22, o: 0.5 },
          ].map((c, i) => (
            <div key={i} className={`absolute left-0 ${anim('wl-cloud')}`} style={{ top: c.top, width: c.w, height: c.w * 0.3, borderRadius: 999, background: '#fff', opacity: c.o, filter: 'blur(7px)', animationDuration: `${c.dur}s`, animationDelay: `${c.del}s` }} />
          ))}
        </div>
      );
    case 'curtain': {
      const cloth = 'repeating-linear-gradient(90deg, color-mix(in srgb, var(--p) 78%, #000) 0 13px, var(--p) 13px 27px)';
      return (
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden>
          <div className={`absolute inset-y-0 left-0 w-1/2 ${anim('wl-curtain-l')}`} style={{ backgroundImage: cloth, boxShadow: '4px 0 18px rgba(0,0,0,.35)', display: animate ? undefined : 'none' }} />
          <div className={`absolute inset-y-0 right-0 w-1/2 ${anim('wl-curtain-r')}`} style={{ backgroundImage: cloth, boxShadow: '-4px 0 18px rgba(0,0,0,.35)', display: animate ? undefined : 'none' }} />
        </div>
      );
    }
  }
}

// ---------- bingkai foto mempelai ----------

const CLIP: Partial<Record<FrameKind, string>> = {
  diamond: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
  hex: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)',
  notch: 'polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%)',
  pixel: 'polygon(0 6%, 4% 6%, 4% 3%, 8% 3%, 8% 0, 92% 0, 92% 3%, 96% 3%, 96% 6%, 100% 6%, 100% 94%, 96% 94%, 96% 97%, 92% 97%, 92% 100%, 8% 100%, 8% 97%, 4% 97%, 4% 94%, 0 94%)',
};

export function PhotoFrame({ frame, src, label, placeholders, letterFont, tilt = 0, photoRadius }: { frame: FrameKind; src?: string; label: string; placeholders?: boolean; letterFont: string; tilt?: number; photoRadius: string }) {
  const filler = (cls: string, style?: CSSProperties): ReactNode =>
    src ? (
      <img src={src} alt={label} className={`${cls} object-cover`} style={style} />
    ) : (
      <div className={`${cls} flex items-center justify-center`} style={{ ...style, background: placeholders ? 'linear-gradient(160deg, color-mix(in srgb, var(--p) 25%, var(--bg)), color-mix(in srgb, var(--s) 45%, var(--bg)))' : 'color-mix(in srgb, var(--p) 10%, var(--bg))' }}>
        <span className="text-5xl" style={{ fontFamily: letterFont, color: 'var(--p)' }}>{label.charAt(0)}</span>
      </div>
    );
  const ring = { border: '1px solid color-mix(in srgb, var(--p) 45%, transparent)' };

  switch (frame) {
    case 'arch':
      return <div className="rounded-t-[999px] rounded-b-3xl p-1.5" style={ring}>{filler('h-56 w-44 rounded-t-[999px] rounded-b-2xl')}</div>;
    case 'oval':
      return <div className="rounded-[50%] p-1.5" style={ring}>{filler('h-56 w-44 rounded-[50%]')}</div>;
    case 'round':
      return <div className="rounded-full p-1.5" style={ring}>{filler('h-48 w-48 rounded-full')}</div>;
    case 'square':
      return <div className="p-1.5" style={{ ...ring, borderRadius: photoRadius }}>{filler('h-52 w-44', { borderRadius: photoRadius })}</div>;
    case 'polaroid':
      return (
        <div className="bg-white p-2.5 pb-9 shadow-[0_10px_26px_-8px_rgba(0,0,0,.35)]" style={{ transform: `rotate(${tilt}deg)` }}>
          {filler('h-44 w-40')}
        </div>
      );
    default: {
      const clip = CLIP[frame] ?? CLIP.notch!;
      const size = frame === 'diamond' ? 'h-52 w-52' : frame === 'hex' ? 'h-52 w-48' : 'h-56 w-44';
      return (
        <div className="p-[3px]" style={{ background: 'var(--p)', clipPath: clip }}>
          {filler(size, { clipPath: clip })}
        </div>
      );
    }
  }
}

// ---------- muncul saat digulir ----------

export function Reveal({ children, delay = 0, className = '', style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={`wl-reveal ${className}`} style={{ ...style, '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

// Root sudah membawa data-armed dari server (keadaan awal tersembunyi); hook ini menandai elemen .wl-reveal
// yang masuk layar. Dengan "kurangi gerakan" / tanpa efek semuanya tetap terlihat. `scope` berubah => elemen baru ikut diamati.
export function useReveal(rootRef: RefObject<HTMLElement | null>, enabled: boolean, embedded: boolean, scope: string) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Tanpa efek atau "kurangi gerakan": tidak ada yang disembunyikan (CSS juga menjaga ini).
    if (!enabled || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      root.querySelectorAll('.wl-reveal').forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { root: embedded ? root : null, threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    );
    root.querySelectorAll('.wl-reveal:not(.is-in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef, enabled, embedded, scope]);
}
