'use client';

/* eslint-disable @next/next/no-img-element */
// Tata letak halaman pertama (sampul) berfoto. Dipilih pembeli di editor (data.cover.tata_letak); daftar id di
// lib/cover-layouts.ts. Layout "ornamen" (tanpa foto) tetap dirender InvitationView. Warna mengikuti tema (--p/--s/--bg/--tx).
import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { CoverKind } from '@/lib/cover-layouts';
import { Particles, PatternLayer, PhotoFrame } from './effects';
import type { FrameKind } from './motifs';
import type { OrnamentSet } from './ornaments';

export interface CoverProps {
  kind: Exclude<CoverKind, 'ornamen'>;
  photo?: string;
  groom?: string;
  bride?: string;
  kicker: string;
  names: string;
  groomName: string;
  brideName: string;
  dateText: string;
  // Sapaan tamu ("Kepada Yth." + nama); null = tidak ditampilkan.
  guest: { dear: string; name: string } | null;
  openLabel: string;
  onOpen: () => void;
  heading: { family: string; size: string; weight: number; tracking?: string; upper?: boolean };
  animated: boolean;
  premium: boolean;
  base: ReactNode;
  decor: ReactNode;
  corners: ReactNode;
  orn: OrnamentSet;
  frame: FrameKind;
  photoRadius: string;
  buttonRadius: string;
  letterFont: string;
  layerHeight: number | string;
}

const PIXEL_CLIP = 'polygon(0 6%, 4% 6%, 4% 3%, 8% 3%, 8% 0, 92% 0, 92% 3%, 96% 3%, 96% 6%, 100% 6%, 100% 94%, 96% 94%, 96% 97%, 92% 97%, 92% 100%, 8% 100%, 8% 97%, 4% 97%, 4% 94%, 0 94%)';

// Bentuk foto berupa path SVG (foto dipotong lewat clipPath, lalu diberi pita warna tema).
const SHAPES = {
  gapura: { box: [100, 130] as const, path: 'M6 130V62C6 42 28 36 37 23C43 15 47 8 50 0C53 8 57 15 63 23C72 36 94 42 94 62V130Z', inset: 0.9 },
  hati: { box: [100, 90] as const, path: 'M50 86C8 54-2 22 18 8C34-2 48 8 50 20C52 8 66-2 82 8C102 22 92 54 50 86Z', inset: 0.92 },
  kristal: { box: [100, 110] as const, path: 'M50 0L80 14L96 40L96 70L80 96L50 110L20 96L4 70L4 40L20 14Z', inset: 0.9 },
};

function ShapedPhoto({ uid, src, shape, className, extra }: { uid: string; src: string; shape: keyof typeof SHAPES; className?: string; extra?: ReactNode }) {
  const { box, path, inset } = SHAPES[shape];
  const [w, h] = box;
  const cx = w / 2;
  const cy = h / 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`overflow-visible ${className ?? ''}`} aria-hidden>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={path} />
        </clipPath>
      </defs>
      <path d={path} fill="var(--p)" />
      <g transform={`translate(${cx} ${cy}) scale(${inset}) translate(${-cx} ${-cy})`}>
        <g clipPath={`url(#${uid}-c)`}>
          <image href={src} x="0" y="0" width={w} height={h} preserveAspectRatio="xMidYMid slice" />
        </g>
      </g>
      <path d={path} fill="none" stroke="var(--s)" strokeWidth="2.2" />
      {extra}
    </svg>
  );
}

const sparkle = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
const LIGHT_KINDS: Partial<Record<CoverProps['kind'], true>> = { penuh: true, 'penuh-atas': true, 'bingkai-penuh': true, portal: true, karakter: true, poster: true };
export const isLightCover = (kind: CoverProps['kind']) => !!LIGHT_KINDS[kind];

export function CoverLayout(p: CoverProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const light = isLightCover(p.kind);
  const enter = (ms: number, cls = ''): { className: string; style?: CSSProperties } =>
    p.animated ? { className: `wl-enter ${cls}`.trim(), style: { '--d': `${ms}ms` } as CSSProperties } : { className: cls };

  // ----- bagian teks yang dipakai ulang oleh semua layout -----
  const ink = (l: boolean) => (l ? '#fff' : 'var(--tx)');
  const kickerEl = (l = light) => {
    const e = enter(100);
    return <p className={`text-xs uppercase tracking-[0.35em] opacity-85 ${e.className}`} style={{ ...e.style, color: ink(l) }}>{p.kicker}</p>;
  };
  const namesEl = (scale = 1, l = light) => {
    const e = enter(250);
    return (
      <h1
        className={`mt-3 ${e.className} ${p.premium && !l ? 'wl-shimmer' : ''}`}
        style={{
          ...e.style,
          fontFamily: p.heading.family,
          fontWeight: p.heading.weight,
          letterSpacing: p.heading.tracking,
          textTransform: p.heading.upper ? 'uppercase' : undefined,
          fontSize: `calc(${p.heading.size} * ${scale})`,
          lineHeight: 1.1,
          color: l ? '#fff' : 'var(--p)',
          textShadow: l ? '0 2px 16px rgba(0,0,0,.5)' : undefined,
        }}
      >
        {p.names}
      </h1>
    );
  };
  const dateEl = (l = light) => {
    const e = enter(450);
    return p.dateText ? <p className={`mt-3 text-sm tracking-[0.3em] ${e.className}`} style={{ ...e.style, color: ink(l) }}>{p.dateText}</p> : null;
  };
  const guestEl = (l = light) => {
    if (!p.guest) return null;
    const e = enter(700);
    return (
      <div className={`mt-6 text-sm ${e.className}`} style={{ ...e.style, color: ink(l) }}>
        <p className="opacity-80">{p.guest.dear}</p>
        <p className="mt-0.5 text-lg font-semibold">{p.guest.name}</p>
      </div>
    );
  };
  const buttonEl = (l = light, cls = 'mt-6') => {
    const e = enter(850);
    return (
      <button
        onClick={p.onOpen}
        className={`${cls} px-7 py-3 text-sm font-medium tracking-wide shadow-lg transition-transform hover:scale-[1.03] ${p.premium ? 'wl-pulse' : ''} ${e.className}`}
        style={{ ...e.style, borderRadius: p.buttonRadius, background: l ? 'rgba(255,255,255,.92)' : 'var(--p)', color: l ? '#222' : '#fff' }}
      >
        {p.openLabel}
      </button>
    );
  };
  const photoOf = { cover: p.photo ?? p.groom ?? p.bride, groom: p.groom ?? p.photo ?? p.bride, bride: p.bride ?? p.photo ?? p.groom };
  const fullPhoto = (gradient: string) => (
    <>
      <img src={p.photo} alt="" className={`absolute inset-0 h-full w-full object-cover ${p.premium && p.animated ? 'wl-kenburns' : ''}`} />
      <div className="absolute inset-0" style={{ background: gradient }} />
    </>
  );
  const column = 'relative z-[4] flex w-full flex-col items-center px-8 text-center';

  switch (p.kind) {
    // ---------- foto penuh ----------
    case 'penuh':
    case 'bingkai-penuh':
    case 'penuh-atas': {
      const top = p.kind === 'penuh-atas';
      return (
        <>
          {fullPhoto(top ? 'linear-gradient(180deg,rgba(0,0,0,.62) 0%,rgba(0,0,0,.08) 42%,rgba(0,0,0,.72) 100%)' : 'linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,.04) 32%,rgba(0,0,0,.74) 100%)')}
          {p.kind === 'bingkai-penuh' && <div className="pointer-events-none absolute inset-3.5 z-[3] border border-white/70" style={{ boxShadow: 'inset 0 0 0 4px rgba(255,255,255,.12)' }} aria-hidden />}
          <div className="absolute inset-0 z-[4] flex flex-col items-center justify-between px-8 pb-[9%] pt-[11%] text-center">
            {top ? (
              <>
                <div>{kickerEl()}{namesEl(0.85)}{dateEl()}</div>
                <div className="flex flex-col items-center">{guestEl()}{buttonEl()}</div>
              </>
            ) : (
              <>
                {kickerEl()}
                <div className="flex flex-col items-center">{namesEl(1)}{dateEl()}{buttonEl()}{guestEl()}</div>
              </>
            )}
          </div>
        </>
      );
    }

    // ---------- foto kecil berbingkai (polaroid) ----------
    case 'bingkai': {
      const e = enter(300);
      return (
        <>
          {p.base}{p.decor}{p.corners}
          <div className={column}>
            {kickerEl()}
            <div className={`mt-5 ${p.premium ? 'wl-float' : ''}`}>
              <div className={e.className} style={e.style}>
                <div className="relative bg-white p-2.5 pb-11 shadow-[0_16px_34px_-12px_rgba(0,0,0,.45)]" style={{ width: '15rem', transform: 'rotate(-2deg)' }}>
                  <img src={photoOf.cover} alt="" className="aspect-[4/5] w-full object-cover" />
                  <p className="absolute inset-x-0 bottom-3 text-center text-[13px] tracking-[0.2em]" style={{ fontFamily: p.heading.family, color: '#4a4038' }}>{p.dateText || p.names}</p>
                  <span className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 -rotate-3" style={{ background: 'color-mix(in srgb, var(--s) 55%, #fff)', opacity: 0.85 }} aria-hidden />
                </div>
              </div>
            </div>
            {namesEl(0.85, false)}
            {guestEl(false)}
            {buttonEl(false)}
          </div>
        </>
      );
    }

    // ---------- jendela lengkung ----------
    case 'jendela': {
      const e = enter(300);
      return (
        <>
          {p.base}{p.decor}{p.corners}
          <div className={column}>
            {kickerEl()}
            <div className={`relative mt-5 w-[14.5rem] ${e.className}`} style={e.style}>
              <div className="overflow-hidden rounded-b-md rounded-t-[999px] border-[7px]" style={{ borderColor: 'var(--bg)', outline: '2px solid var(--p)', boxShadow: '0 18px 30px -14px rgba(0,0,0,.4)' }}>
                <div className="relative aspect-[3/4.1]">
                  <img src={photoOf.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2" style={{ background: 'var(--bg)', opacity: 0.85 }} aria-hidden />
                  <span className="absolute inset-x-0 top-[44%] h-[3px]" style={{ background: 'var(--bg)', opacity: 0.85 }} aria-hidden />
                </div>
              </div>
              <div className="-mx-2 mt-1 h-3 rounded-sm" style={{ background: 'var(--p)' }} aria-hidden />
            </div>
            {namesEl(0.85, false)}
            {dateEl(false)}
            {guestEl(false)}
            {buttonEl(false, 'mt-5')}
          </div>
        </>
      );
    }

    // ---------- medali bulat ----------
    case 'medali': {
      const e = enter(300);
      return (
        <>
          {p.base}{p.decor}{p.corners}
          <div className={column}>
            {kickerEl()}
            <div className={`relative mt-4 flex h-[16.5rem] w-[16.5rem] items-center justify-center ${e.className}`} style={e.style}>
              <svg className={`absolute inset-0 ${p.animated ? 'wl-rays' : ''}`} viewBox="-100 -100 200 200" style={{ color: 'var(--p)' }} aria-hidden>
                <circle r="97" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 5" opacity=".7" />
                {Array.from({ length: 36 }, (_, i) => (
                  <line key={i} x1="0" y1="-97" x2="0" y2={i % 3 === 0 ? -88 : -92} stroke="currentColor" strokeWidth="1.6" transform={`rotate(${i * 10})`} opacity=".8" />
                ))}
              </svg>
              <div className="h-[12.6rem] w-[12.6rem] overflow-hidden rounded-full border-[6px]" style={{ borderColor: 'var(--bg)', boxShadow: '0 0 0 2px var(--p), 0 14px 28px -12px rgba(0,0,0,.45)' }}>
                <img src={photoOf.cover} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
            {namesEl(0.85, false)}
            {dateEl(false)}
            {guestEl(false)}
            {buttonEl(false, 'mt-5')}
          </div>
        </>
      );
    }

    // ---------- terbagi: foto memudar + kartu tulisan ----------
    case 'terbagi': {
      const mask = 'linear-gradient(#000 60%, transparent)';
      return (
        <>
          {p.base}
          <div className="absolute inset-x-0 top-0 h-[62%]">
            <img src={photoOf.cover} alt="" className="h-full w-full object-cover" style={{ maskImage: mask, WebkitMaskImage: mask }} />
          </div>
          {p.decor}
          <div className="absolute inset-x-[7%] bottom-[5%] top-[49%] z-[4] flex flex-col items-center justify-center overflow-hidden border px-6 text-center" style={{ borderColor: 'color-mix(in srgb, var(--s) 75%, transparent)', background: 'color-mix(in srgb, var(--bg) 93%, transparent)', borderRadius: 'var(--r)', color: 'var(--tx)' }}>
            <div className="pointer-events-none absolute left-0 top-0 w-16" style={{ color: 'var(--p)' }} aria-hidden><p.orn.Corner className="w-16" rotate={0} /></div>
            <div className="pointer-events-none absolute bottom-0 right-0 w-16" style={{ color: 'var(--p)' }} aria-hidden><p.orn.Corner className="w-16" rotate={180} /></div>
            {kickerEl(false)}
            {namesEl(0.9, false)}
            {dateEl(false)}
            {guestEl(false)}
            {buttonEl(false, 'mt-4')}
          </div>
        </>
      );
    }

    // ---------- berdua ----------
    case 'berdua': {
      const frame = p.frame === 'diamond' || p.frame === 'hex' ? 'arch' : p.frame;
      return (
        <>
          {p.base}{p.decor}{p.corners}
          <div className={column}>
            {kickerEl()}
            <div className="mt-5 flex items-end justify-center" style={{ zoom: 0.82 }}>
              <div className="-mr-3 -rotate-3"><PhotoFrame frame={frame} src={photoOf.groom} label={p.groomName || 'A'} letterFont={p.letterFont} tilt={-2} photoRadius={p.photoRadius} /></div>
              <div className="rotate-3"><PhotoFrame frame={frame} src={photoOf.bride} label={p.brideName || 'S'} letterFont={p.letterFont} tilt={2} photoRadius={p.photoRadius} /></div>
            </div>
            {namesEl(0.85, false)}
            {dateEl(false)}
            {guestEl(false)}
            {buttonEl(false, 'mt-5')}
          </div>
        </>
      );
    }

    // ---------- khusus tema: gapura / hati / kristal ----------
    case 'gapura':
    case 'hati':
    case 'kristal': {
      const e = enter(300);
      const shape = p.kind;
      const width = shape === 'hati' ? 'w-[17rem]' : shape === 'kristal' ? 'w-[14.5rem]' : 'w-[13.5rem]';
      const extra =
        shape === 'gapura' ? (
          <>
            <path d="M50 -9l4 7-4 7-4-7z" fill="var(--s)" />
            {[20, 35, 65, 80].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 44 : 50} r="1.6" fill="var(--s)" opacity=".8" />)}
          </>
        ) : shape === 'kristal' ? (
          <>
            <path d="M50 8L50 102M14 30L86 80M86 30L14 80" stroke="#fff" strokeWidth=".8" opacity=".45" />
            <path d={sparkle(84, 16, 6)} fill="#fff" opacity=".9" />
            <path d={sparkle(14, 96, 4)} fill="#fff" opacity=".8" />
          </>
        ) : (
          <>
            <path d={sparkle(92, 12, 5)} fill="var(--s)" />
            <path d={sparkle(8, 70, 4)} fill="var(--s)" opacity=".8" />
          </>
        );
      return (
        <>
          {p.base}{p.decor}{p.corners}
          <div className={column}>
            {kickerEl()}
            <div className={`mt-5 ${width} ${p.premium ? 'wl-float' : ''}`}>
              <div className={e.className} style={e.style}>
                <ShapedPhoto uid={uid} src={photoOf.cover!} shape={shape} extra={extra} className="w-full drop-shadow-[0_14px_16px_rgba(0,0,0,.28)]" />
              </div>
            </div>
            {namesEl(0.85, false)}
            {dateEl(false)}
            {guestEl(false)}
            {buttonEl(false, 'mt-5')}
          </div>
        </>
      );
    }

    // ---------- portal bercincin ----------
    case 'portal': {
      const e = enter(300);
      return (
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--p) 42%, #1a0b3a) 0, #05030f 72%)' }} />
          <Particles kind="star" count={22} mode="twinkle" height={p.layerHeight} />
          <div className={column}>
            {kickerEl()}
            <div className={`relative mt-4 flex h-[17.5rem] w-[17.5rem] items-center justify-center ${e.className}`} style={{ ...e.style, filter: 'drop-shadow(0 0 10px var(--s))' }}>
              <svg className={`absolute inset-0 ${p.animated ? 'wl-rays' : ''}`} viewBox="-100 -100 200 200" aria-hidden>
                <circle r="96" fill="none" stroke="var(--s)" strokeWidth="1.2" strokeDasharray="3 5" />
                {Array.from({ length: 24 }, (_, i) => <line key={i} x1="0" y1="-96" x2="0" y2={i % 2 ? -88 : -84} stroke="var(--s)" strokeWidth="1.6" transform={`rotate(${i * 15})`} />)}
                <circle r="80" fill="none" stroke="var(--p)" strokeWidth="2.4" />
                {Array.from({ length: 8 }, (_, i) => <path key={i} d="M0 -80 L5 -70 L-5 -70Z" fill="var(--s)" transform={`rotate(${i * 45})`} />)}
              </svg>
              <div className="h-[11.6rem] w-[11.6rem] overflow-hidden rounded-full border-2" style={{ borderColor: 'var(--s)', boxShadow: '0 0 30px 6px color-mix(in srgb, var(--s) 60%, transparent)' }}>
                <img src={photoOf.cover} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
            {namesEl(0.85)}
            {dateEl()}
            {guestEl()}
            {buttonEl(true, 'mt-5')}
          </div>
        </>
      );
    }

    // ---------- pilih karakter (game) ----------
    case 'karakter': {
      const cards = [
        { src: photoOf.groom, tag: 'P1', name: p.groomName, color: 'var(--p)' },
        { src: photoOf.bride, tag: 'P2', name: p.brideName, color: 'var(--s)' },
      ];
      return (
        <>
          <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--p) 24%, #070a1c)' }} />
          <PatternLayer kind="grid" opacity={0.2} color="var(--s)" />
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px)' }} aria-hidden />
          <div className={column} style={{ fontFamily: 'var(--font-pixel), monospace' }}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">{p.kicker}</p>
            <p className="mt-3 text-sm uppercase tracking-widest" style={{ color: 'var(--s)', textShadow: '0 0 10px var(--p)' }}>PILIH KARAKTER</p>
            <div className="mt-5 flex w-full items-start justify-center gap-4">
              {cards.map((c, i) => (
                <div key={c.tag} className="w-[9.6rem]">
                  <div style={{ clipPath: PIXEL_CLIP, background: c.color, padding: 4 }}>
                    <div className="relative aspect-[3/4] overflow-hidden" style={{ clipPath: PIXEL_CLIP, background: '#000' }}>
                      {c.src ? <img src={c.src} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-4xl text-white">{c.name.charAt(0) || '?'}</span>}
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] uppercase leading-relaxed text-white"><span style={{ color: c.color }}>{c.tag}</span> {c.name}</p>
                  {i === 0 && <span className="sr-only">dan</span>}
                </div>
              ))}
            </div>
            <h1 className="mt-5 text-lg uppercase leading-snug text-white" style={{ textShadow: '0 0 12px var(--p)' }}>{p.names}</h1>
            {p.dateText && <p className="mt-3 text-[10px] tracking-[0.2em] text-white/80">{p.dateText}</p>}
            {guestEl(true)}
            {buttonEl(true, 'mt-5')}
          </div>
        </>
      );
    }

    // ---------- poster film ----------
    case 'poster': {
      const holes = 'repeating-linear-gradient(180deg, transparent 0 9px, rgba(232,224,200,.55) 9px 19px)';
      return (
        <>
          <div className="absolute inset-0" style={{ background: '#0b0b0d' }} />
          <div className="absolute inset-y-0 left-1.5 w-2" style={{ background: holes }} aria-hidden />
          <div className="absolute inset-y-0 right-1.5 w-2" style={{ background: holes }} aria-hidden />
          <div className="absolute inset-x-[10%] bottom-[31%] top-[13%] overflow-hidden border-2" style={{ borderColor: 'var(--s)' }}>
            <img src={photoOf.cover} alt="" className={`h-full w-full object-cover ${p.premium && p.animated ? 'wl-kenburns' : ''}`} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.3), transparent 30%, rgba(0,0,0,.65))' }} />
          </div>
          <div className="absolute inset-x-0 top-0 z-[4] px-10 pt-[6%] text-center">
            <p className="text-[11px] uppercase tracking-[0.5em]" style={{ color: 'var(--s)' }}>{p.kicker}</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-[4] flex flex-col items-center px-8 pb-[6%] text-center">
            <h1
              className="uppercase"
              style={{ fontFamily: p.heading.family, fontWeight: p.heading.weight, fontSize: `calc(${p.heading.size} * 0.82)`, letterSpacing: '0.08em', lineHeight: 1.1, color: '#f4ecd8', textShadow: '0 2px 14px rgba(0,0,0,.6)' }}
            >
              {p.names}
            </h1>
            {p.dateText && <p className="mt-2 text-[11px] uppercase tracking-[0.35em]" style={{ color: 'var(--s)' }}>Tayang perdana · {p.dateText}</p>}
            {p.guest && <p className="mt-3 text-xs text-white/75">{p.guest.dear} <span className="font-semibold text-white">{p.guest.name}</span></p>}
            <button
              onClick={p.onOpen}
              className={`mt-4 border px-7 py-2.5 text-sm font-medium uppercase tracking-[0.2em] transition-transform hover:scale-[1.03] ${p.premium ? 'wl-pulse' : ''}`}
              style={{ borderColor: 'var(--s)', color: 'var(--s)', borderRadius: p.buttonRadius, background: 'rgba(0,0,0,.35)' }}
            >
              {p.openLabel}
            </button>
          </div>
        </>
      );
    }
  }
}
