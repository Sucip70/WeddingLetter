'use client';

// Pemilih tata letak sampul (halaman pertama undangan) untuk paket Standard & Premium.
import type { ReactNode } from 'react';
import { COVER_LAYOUTS, isCoverKind } from '@/lib/cover-layouts';
import type { CoverKind } from '@/lib/cover-layouts';
import { cn } from '../ui';

const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const SOLID = { fill: 'currentColor', stroke: 'none' } as const;
const SOFT = { fill: 'currentColor', stroke: 'none', opacity: 0.28 } as const;

// Sketsa layout pada layar ponsel 40x60: garis = teks, blok = foto.
const text = (y: number, w = 16) => <rect x={20 - w / 2} y={y} width={w} height={2.4} rx={1.2} {...SOLID} />;
const button = (y: number) => <rect x={13} y={y} width={14} height={4.5} rx={2.2} {...SOLID} />;

const ICONS: Record<CoverKind, ReactNode> = {
  ornamen: (
    <>
      <path d="M5 13V5h8M35 13V5h-8M5 47v8h8M35 47v8h-8" {...STROKE} />
      {text(22, 20)}
      {text(28, 12)}
      {button(40)}
    </>
  ),
  penuh: (
    <>
      <rect x={4} y={4} width={32} height={52} rx={2} {...SOFT} />
      {text(38, 20)}
      {text(43, 12)}
      {button(48)}
    </>
  ),
  'penuh-atas': (
    <>
      <rect x={4} y={4} width={32} height={52} rx={2} {...SOFT} />
      {text(9, 20)}
      {text(14, 12)}
      {button(48)}
    </>
  ),
  bingkai: (
    <>
      <rect x={11} y={12} width={18} height={22} rx={1} {...STROKE} />
      <rect x={13.5} y={14.5} width={13} height={14} {...SOFT} />
      {text(38, 18)}
      {button(46)}
    </>
  ),
  jendela: (
    <>
      <path d="M11 34V21a9 9 0 0 1 18 0v13Z" {...STROKE} />
      <path d="M13 32V21a7 7 0 0 1 14 0v11Z" {...SOFT} />
      {text(39, 18)}
      {button(46)}
    </>
  ),
  medali: (
    <>
      <circle cx={20} cy={22} r={11} {...STROKE} strokeDasharray="1.5 2.5" />
      <circle cx={20} cy={22} r={8} {...SOFT} />
      {text(38, 18)}
      {button(46)}
    </>
  ),
  terbagi: (
    <>
      <rect x={4} y={4} width={32} height={30} rx={2} {...SOFT} />
      <rect x={7} y={28} width={26} height={26} rx={2} {...STROKE} fill="var(--color-paper, #fff)" />
      {text(35, 16)}
      {button(45)}
    </>
  ),
  berdua: (
    <>
      <rect x={6} y={14} width={13} height={20} rx={5} {...SOFT} transform="rotate(-4 12 24)" />
      <rect x={21} y={14} width={13} height={20} rx={5} {...SOFT} transform="rotate(4 28 24)" />
      {text(39, 20)}
      {button(46)}
    </>
  ),
  'bingkai-penuh': (
    <>
      <rect x={4} y={4} width={32} height={52} rx={2} {...SOFT} />
      <rect x={7} y={7} width={26} height={46} {...STROKE} strokeWidth={1} />
      {text(38, 18)}
      {button(46)}
    </>
  ),
  gapura: (
    <>
      <path d="M10 36V22c0-5 7-6 10-14 3 8 10 9 10 14v14Z" {...STROKE} />
      <path d="M13 34V23c0-3 5-5 7-10 2 5 7 7 7 10v11Z" {...SOFT} />
      {text(40, 18)}
      {button(47)}
    </>
  ),
  hati: (
    <>
      <path d="M20 34C7 24 6 14 13 11c4-1.500 6 .5 7 3 1-2.500 3-4.500 7-3 7 3 6 13-7 23Z" {...STROKE} />
      <path d="M20 31C10 23 9 15 14 13.500c3-1 5 1 6 3.500 1-2.500 3-4.500 6-3.500 5 1.500 4 9.500-6 17.500Z" {...SOFT} />
      {text(40, 18)}
      {button(47)}
    </>
  ),
  portal: (
    <>
      <rect x={4} y={4} width={32} height={52} rx={2} {...SOLID} opacity={0.85} />
      <circle cx={20} cy={24} r={12} fill="none" stroke="#fff" strokeWidth={1.4} strokeDasharray="2 2" />
      <circle cx={20} cy={24} r={8} fill="#fff" opacity={0.35} />
      <rect x={11} y={41} width={18} height={2.4} rx={1.2} fill="#fff" />
      <rect x={13} y={47} width={14} height={4.5} rx={2.2} fill="#fff" />
    </>
  ),
  kristal: (
    <>
      <path d="M20 8l9 4 5 9v10l-5 8-9 4-9-4-5-8V21l5-9Z" {...STROKE} />
      <path d="M20 12l7 3 3 7v8l-4 6-6 3-6-3-4-6v-8l3-7Z" {...SOFT} />
      {text(46, 18)}
      {button(50)}
    </>
  ),
  karakter: (
    <>
      <rect x={4} y={4} width={32} height={52} rx={2} {...SOLID} opacity={0.85} />
      <rect x={7} y={14} width={12} height={17} fill="#fff" opacity={0.45} />
      <rect x={21} y={14} width={12} height={17} fill="#fff" opacity={0.45} />
      <rect x={9} y={36} width={22} height={2.4} fill="#fff" />
      <rect x={13} y={45} width={14} height={4.5} fill="#fff" />
    </>
  ),
  poster: (
    <>
      <rect x={4} y={4} width={32} height={52} rx={1} {...SOLID} opacity={0.85} />
      <path d="M6.500 7v46M33.500 7v46" stroke="#fff" strokeWidth={1.2} strokeDasharray="1.600 2.200" />
      <rect x={10} y={9} width={20} height={26} fill="#fff" opacity={0.4} />
      <rect x={10} y={40} width={20} height={3} fill="#fff" />
      <rect x={14} y={47} width={12} height={4} fill="#fff" opacity={0.9} />
    </>
  ),
};

export function CoverIcon({ kind, className }: { kind: CoverKind; className?: string }) {
  return (
    <svg viewBox="0 0 40 60" className={className} aria-hidden>
      {ICONS[kind]}
    </svg>
  );
}

export function CoverLayoutPicker({
  available,
  value,
  onChange,
  hasPhoto,
  hasCoupleOnly = false,
  name,
}: {
  available: string[];
  value: string | undefined;
  onChange: (kind: CoverKind) => void;
  // Ada foto sampul; pilihan yang butuh foto tampil tanda "perlu foto" bila belum ada.
  hasPhoto: boolean;
  // Ada foto mempelai (cukup untuk layout "Berdua" & "Pilih karakter").
  hasCoupleOnly?: boolean;
  name: string;
}) {
  const options = available.filter(isCoverKind);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Tata letak sampul">
      {options.map((kind) => {
        const def = COVER_LAYOUTS[kind];
        const missing = def.needs === 'cover' ? !hasPhoto : def.needs === 'couple' ? !(hasPhoto || hasCoupleOnly) : false;
        const selected = value === kind;
        return (
          <label
            key={kind}
            title={def.hint}
            className={cn(
              'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-paper px-1.5 pb-2 pt-2.5 text-center transition-colors hover:border-rose/60',
              selected ? 'border-rose bg-rose-soft/40 ring-1 ring-rose' : 'border-line',
            )}
          >
            <input type="radio" name={name} value={kind} checked={selected} onChange={() => onChange(kind)} className="sr-only" />
            <CoverIcon kind={kind} className={cn('h-16 w-11', selected ? 'text-rose' : 'text-ink-soft')} />
            <span className="text-[11px] font-medium leading-tight text-ink">{def.label}</span>
            {def.themed && <span className="absolute right-1 top-1 rounded-full bg-rose px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-white">Tema</span>}
            {missing && <span className="text-[10px] leading-tight text-ink-soft">perlu foto</span>}
          </label>
        );
      })}
    </div>
  );
}
