import type { CSSProperties } from 'react';
import type { Theme } from '@/lib/types';
import { PatternLayer } from './invitation/effects';
import { HEADING, motifFor } from './invitation/motifs';
import { ORNAMENTS } from './invitation/ornaments';

// Miniatur sampul template (statis, ringan) untuk kartu katalog. Memakai motif desain: ornamen sudut,
// pola latar, dan font judul yang sama dengan undangan sungguhan.
export function TemplateThumb({ theme, imageUrl, className = '' }: { theme: Theme; imageUrl?: string | null; className?: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={`h-full w-full object-cover ${className}`} />;
  }
  const motif = motifFor(theme.motif ?? theme.preset);
  const orn = ORNAMENTS[motif.ornament];
  const hf = HEADING[theme.headingFont] ?? HEADING.serif;
  const dark = motif.countdown === 'neon' || motif.countdown === 'pixel';
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`}
      style={
        {
          '--p': theme.primary,
          '--s': theme.secondary,
          '--bg': theme.background,
          background: `linear-gradient(165deg, color-mix(in srgb, ${theme.primary} 22%, ${theme.background}), ${theme.background} 52%, color-mix(in srgb, ${theme.primary} 10%, color-mix(in srgb, ${theme.secondary} 12%, ${theme.background})))`,
          color: theme.primary,
        } as CSSProperties
      }
    >
      <PatternLayer kind={motif.pattern} opacity={0.1} />
      <orn.Corner className="absolute left-1.5 top-1.5 w-14" rotate={0} />
      <orn.Corner className="absolute right-1.5 top-1.5 w-14" rotate={90} />
      <orn.Corner className="absolute bottom-1.5 right-1.5 w-14" rotate={180} />
      <orn.Corner className="absolute bottom-1.5 left-1.5 w-14" rotate={270} />
      <p className="relative text-[8px] uppercase tracking-[0.3em]" style={{ color: theme.text, opacity: 0.7 }}>{motif.copy?.kicker ?? 'Undangan Pernikahan'}</p>
      <p
        className="relative mt-2 leading-none"
        style={{ fontFamily: hf.family, fontWeight: hf.weight, fontSize: `calc(${hf.size} * 0.62)`, letterSpacing: hf.tracking, textTransform: hf.upper ? 'uppercase' : undefined }}
      >
        Andi & Sinta
      </p>
      <orn.Divider className="relative mt-3 w-16 opacity-70" />
      <p className="relative mt-3 text-[9px] tracking-[0.25em]" style={{ color: theme.text, opacity: 0.75 }}>12 . 12 . 2026</p>
      <span
        className="relative mt-4 px-3 py-1 text-[8px] font-medium tracking-wide text-white"
        style={{ background: dark ? theme.secondary : theme.primary, color: dark ? '#111' : '#fff', borderRadius: motif.radius === 'sharp' ? 0 : motif.radius === 'mid' ? 6 : 999 }}
      >
        {motif.copy?.open ?? 'Buka Undangan'}
      </span>
    </div>
  );
}
