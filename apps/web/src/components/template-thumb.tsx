'use client';

// Client Component: CoverLayout (cover.tsx) dan orn.Corner/orn.Divider dirender di sini bersama-sama sebagai
// satu pohon client, menghindari batas Server/Client di tengah (fungsi komponen & elemen React yang dikirim
// lewat props tidak aman melewati batas itu). Dipanggil dari Server Component (halaman katalog) seperti biasa.
import type { CSSProperties } from 'react';
import { CoverLayout } from './invitation/cover';
import { defaultCoverLayout, isCoverKind, resolveCover } from '@/lib/cover-layouts';
import type { DemoPhotos } from '@/lib/sample';
import type { Theme } from '@/lib/types';
import { PatternLayer } from './invitation/effects';
import { HEADING, RADIUS, motifFor } from './invitation/motifs';
import { FloralMonogram } from './invitation/bloom-parts';
import { KERATON_BG, keratonVars } from './invitation/batik-art';
import { Gunungan } from './invitation/gunungan-art';
import { DovePair } from './invitation/dove-art';
import { Monogram, ORNAMENTS } from './invitation/ornaments';

// Miniatur sampul template (statis, ringan) untuk kartu katalog. Memakai motif desain: ornamen sudut,
// pola latar, dan font judul yang sama dengan undangan sungguhan.
//
// Bila template punya pilihan tata letak sampul (Standard/Premium, `coverLayouts`) dan foto demo (`photos`) tersedia, kartu
// memakai tata letak yang sama dengan demo template & editor: `coverDefault` pilihan admin, kalau kosong yang khusus tema,
// kalau tidak ada "Foto berbingkai". Tanpa foto (atau layout = "ornamen") jatuh ke tampilan ornamen statis.
export function TemplateThumb({
  theme,
  imageUrl,
  className = '',
  coverLayouts = [],
  coverDefault,
  photos,
}: {
  theme: Theme;
  imageUrl?: string | null;
  className?: string;
  coverLayouts?: string[];
  coverDefault?: string;
  photos?: DemoPhotos;
  // Tidak dipakai lagi (dulu memilih tata letak acak per kartu); dipertahankan agar pemanggil lama tetap valid.
  seed?: string;
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={`h-full w-full object-cover ${className}`} />;
  }
  const motif = motifFor(theme.motif ?? theme.preset);
  const orn = ORNAMENTS[motif.ornament];
  const hf = HEADING[theme.headingFont] ?? HEADING.serif;
  // Elegan: nama beraksara tulisan tangan berlapis emas + monogram (kelas .wl-root/.wl-gilded membawa variabel --foil).
  const gilded = motif.skin === 'gilded';
  const nf = HEADING[motif.names ?? motif.heading ?? theme.headingFont] ?? hf;
  // Buket Pengantin: putih bersih dengan semburat pastel, monogram karangan bunga, dan sudut berbunga yang lebih besar.
  const bloom = motif.skin === 'bloom';
  // Batik Jawa: krem dengan pita parang di tepi, gunungan emas-maroon di tengah.
  const keraton = motif.skin === 'keraton';
  const nameSize = gilded ? 0.58 : keraton ? 0.5 : 0.62;
  const rootClass = gilded ? 'wl-root wl-gilded' : keraton ? 'wl-root wl-keraton' : bloom ? 'wl-bloom' : '';
  const dark = motif.countdown === 'neon' || motif.countdown === 'pixel';
  const rootStyle = {
    '--p': theme.primary,
    '--s': theme.secondary,
    '--bg': theme.background,
    '--tx': theme.text,
    background: bloom
      ? `linear-gradient(180deg, color-mix(in srgb, ${theme.secondary} 10%, #fff), #fff 34%, #fff 66%, color-mix(in srgb, ${theme.primary} 9%, #fff))`
      : `linear-gradient(165deg, color-mix(in srgb, ${theme.primary} 22%, ${theme.background}), ${theme.background} 52%, color-mix(in srgb, ${theme.primary} 10%, color-mix(in srgb, ${theme.secondary} 12%, ${theme.background})))`,
    color: theme.primary,
    ...(keraton ? { ...KERATON_BG, ...keratonVars(theme.primary, theme.secondary, theme.background), background: theme.background, backgroundSize: '9px 9px, 9px 9px, 1px 100%, 1px 100%, 14px 14px', backgroundPosition: 'left top, right top, left 9px top, right 9px top, 0 0' } : null),
  } as CSSProperties;

  // Salah satu tata letak berfoto milik template ini (mis. hasil desain x paket), dipilih dari `seed` supaya
  // stabil per kartu. Kembali ke "ornamen" (tampilan bawaan di bawah) bila tidak ada, atau fotonya belum ada.
  const kinds = coverLayouts.filter(isCoverKind);
  // Aturan yang sama dengan demo template & editor (defaultCoverLayout): pilihan admin, lalu khusus tema, lalu Foto berbingkai.
  const chosen = kinds.length > 0 ? defaultCoverLayout(kinds, coverDefault) : undefined;
  const resolved = chosen ? resolveCover(chosen, { cover: photos?.cover, groom: photos?.groom, bride: photos?.bride }) : undefined;

  const cornersNode = (
    <>
      <orn.Corner className={`absolute left-1.5 top-1.5 ${bloom ? 'w-24' : 'w-14'}`} rotate={0} />
      <orn.Corner className={`absolute right-1.5 top-1.5 ${bloom ? 'w-24' : 'w-14'}`} rotate={90} />
      <orn.Corner className={`absolute bottom-1.5 right-1.5 ${bloom ? 'w-[4.4rem]' : 'w-14'}`} rotate={180} />
      <orn.Corner className={`absolute bottom-1.5 left-1.5 ${bloom ? 'w-[4.4rem]' : 'w-14'}`} rotate={270} />
    </>
  );

  if (resolved && resolved !== 'ornamen') {
    return (
      <div className={`${rootClass} relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`} style={rootStyle}>
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
          heading={{ ...nf, size: `calc(${nf.size} * ${nameSize})` }}
          gilded={gilded}
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
    <div className={`${rootClass} relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`} style={rootStyle}>
      <PatternLayer kind={motif.pattern} opacity={0.1} />
      {cornersNode}
      {gilded && <Monogram a="A" b="S" size={38} className="relative mb-2" />}
      {motif.skin === 'dove' && <DovePair size="w-[2.6rem]" className="relative mb-1" />}
      {bloom && <FloralMonogram a="A" b="S" size={70} className="relative mb-1" />}
      {keraton && <div className="relative mb-1 h-[4.6rem]" style={{ aspectRatio: '200 / 272' }}><Gunungan /></div>}
      <p className="relative text-[8px] uppercase tracking-[0.3em]" style={{ color: theme.text, opacity: 0.7, ...(gilded ? { fontFamily: 'var(--font-cinzel), serif', fontSize: 7, letterSpacing: '0.38em' } : null) }}>{motif.copy?.kicker ?? 'Undangan Pernikahan'}</p>
      <p
        className={`relative mt-2 ${gilded ? 'wl-foil leading-tight' : 'leading-none'}`}
        style={{ fontFamily: nf.family, fontWeight: nf.weight, fontSize: `calc(${nf.size} * ${nameSize})`, letterSpacing: nf.tracking, textTransform: nf.upper ? 'uppercase' : undefined }}
      >
        Andi & Sinta
      </p>
      <orn.Divider className={bloom ? 'relative mt-1 w-32' : 'relative mt-3 w-16 opacity-70'} />
      <p className="relative mt-3 text-[9px] tracking-[0.25em]" style={{ color: theme.text, opacity: 0.75 }}>12 . 12 . 2026</p>
      <span
        className="relative mt-4 px-3 py-1 text-[8px] font-medium tracking-wide text-white"
        style={{ background: gilded ? 'var(--foil)' : bloom ? 'linear-gradient(135deg, color-mix(in srgb, var(--p) 88%, #fff), var(--p))' : dark ? theme.secondary : theme.primary, color: gilded ? 'color-mix(in srgb, var(--tx) 92%, #000)' : dark ? '#111' : '#fff', borderRadius: gilded ? 2 : motif.radius === 'sharp' ? 0 : motif.radius === 'mid' ? 6 : 999 }}
      >
        {motif.copy?.open ?? 'Buka Undangan'}
      </span>
    </div>
  );
}
