'use client';

// Client Component: CoverLayout (cover.tsx) dan orn.Corner/orn.Divider dirender di sini bersama-sama sebagai
// satu pohon client, menghindari batas Server/Client di tengah (fungsi komponen & elemen React yang dikirim
// lewat props tidak aman melewati batas itu). Dipanggil dari Server Component (halaman katalog) seperti biasa.
import type { CSSProperties } from 'react';
import { CoverLayout } from './invitation/cover';
import { isCoverKind, resolveCover } from '@/lib/cover-layouts';
import type { DemoPhotos } from '@/lib/sample';
import type { Theme } from '@/lib/types';
import { PatternLayer } from './invitation/effects';
import { HEADING, RADIUS, motifFor } from './invitation/motifs';
import { ORNAMENTS } from './invitation/ornaments';

// Posisi deterministik dalam [0, mod) dari sebuah string (mis. id template): dipakai memilih tata letak
// sampul per kartu supaya berbeda-beda antar kartu tapi stabil di setiap render (SSR = hidrasi, reload tetap sama).
function pick(seed: string, mod: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

// Miniatur sampul template (statis, ringan) untuk kartu katalog. Memakai motif desain: ornamen sudut,
// pola latar, dan font judul yang sama dengan undangan sungguhan.
//
// Bila template punya pilihan tata letak sampul (Standard/Premium, `coverLayouts`) dan foto demo (`photos`)
// tersedia, kartu memakai salah satu tata letak berfoto (dipilih deterministik dari `seed`, biasanya id
// template) supaya grid katalog memperlihatkan variasi tata letak, bukan selalu tampilan ornamen yang sama.
// Tanpa foto (atau layout terpilih = "ornamen"), tetap jatuh ke tampilan ornamen statis seperti semula.
export function TemplateThumb({
  theme,
  imageUrl,
  className = '',
  coverLayouts = [],
  photos,
  seed,
}: {
  theme: Theme;
  imageUrl?: string | null;
  className?: string;
  coverLayouts?: string[];
  photos?: DemoPhotos;
  seed?: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={`h-full w-full object-cover ${className}`} />;
  }
  const motif = motifFor(theme.motif ?? theme.preset);
  const orn = ORNAMENTS[motif.ornament];
  const hf = HEADING[theme.headingFont] ?? HEADING.serif;
  const dark = motif.countdown === 'neon' || motif.countdown === 'pixel';
  const rootStyle = {
    '--p': theme.primary,
    '--s': theme.secondary,
    '--bg': theme.background,
    background: `linear-gradient(165deg, color-mix(in srgb, ${theme.primary} 22%, ${theme.background}), ${theme.background} 52%, color-mix(in srgb, ${theme.primary} 10%, color-mix(in srgb, ${theme.secondary} 12%, ${theme.background})))`,
    color: theme.primary,
  } as CSSProperties;

  // Salah satu tata letak berfoto milik template ini (mis. hasil desain x paket), dipilih dari `seed` supaya
  // stabil per kartu. Kembali ke "ornamen" (tampilan bawaan di bawah) bila tidak ada, atau fotonya belum ada.
  const kinds = coverLayouts.filter(isCoverKind);
  const chosen = kinds.length > 0 && seed ? kinds[pick(seed, kinds.length)] : undefined;
  const resolved = chosen ? resolveCover(chosen, { cover: photos?.cover, groom: photos?.groom, bride: photos?.bride }) : undefined;

  const cornersNode = (
    <>
      <orn.Corner className="absolute left-1.5 top-1.5 w-14" rotate={0} />
      <orn.Corner className="absolute right-1.5 top-1.5 w-14" rotate={90} />
      <orn.Corner className="absolute bottom-1.5 right-1.5 w-14" rotate={180} />
      <orn.Corner className="absolute bottom-1.5 left-1.5 w-14" rotate={270} />
    </>
  );

  if (resolved && resolved !== 'ornamen') {
    return (
      <div className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`} style={rootStyle}>
        <CoverLayout
          kind={resolved}
          photo={photos?.cover}
          groom={photos?.groom}
          bride={photos?.bride}
          kicker={motif.copy?.kicker ?? 'Undangan Pernikahan'}
          names="Andi & Sinta"
          groomName="Andi"
          brideName="Sinta"
          dateText="12 . 12 . 2026"
          guest={null}
          openLabel={motif.copy?.open ?? 'Buka Undangan'}
          heading={{ ...hf, size: `calc(${hf.size} * 0.62)` }}
          animated={false}
          premium={false}
          decorative
          base={<div className="absolute inset-0" style={rootStyle} />}
          decor={<PatternLayer kind={motif.pattern} opacity={0.1} />}
          corners={<div className="pointer-events-none absolute inset-0" aria-hidden>{cornersNode}</div>}
          orn={orn}
          frame={motif.frame}
          photoRadius={RADIUS[motif.radius].photo}
          buttonRadius={RADIUS[motif.radius].button}
          letterFont="var(--font-script)"
          layerHeight="100%"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`} style={rootStyle}>
      <PatternLayer kind={motif.pattern} opacity={0.1} />
      {cornersNode}
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
