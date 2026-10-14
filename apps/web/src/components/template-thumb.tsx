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
import { STRINGS } from './invitation/i18n';
import { BLOOM_BG, DOVE_BG, GARDEN_BG, GARDEN_FLOURISH, GILDED_BG, KRAFT_COVER, KRAFT_TEXTURE, coverBackgroundFor } from './invitation/skin-bg';
import { FloralPageFrame, GardenPageFrame } from './invitation/garden-parts';
import { MeadowPageFrame } from './invitation/meadow-parts';

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
  phone = false,
}: {
  theme: Theme;
  imageUrl?: string | null;
  className?: string;
  coverLayouts?: string[];
  coverDefault?: string;
  photos?: DemoPhotos;
  // true = ukuran sampul ponsel sungguhan (font, sudut, tombol sama dengan undangan; wadah harus ±390px lebar lalu diskalakan,
  // lihat katalog). false = miniatur sangat kecil (daftar admin, beranda) dengan ukuran dikecilkan.
  phone?: boolean;
  // Tidak dipakai lagi (dulu memilih tata letak acak per kartu); dipertahankan agar pemanggil lama tetap valid.
  seed?: string;
}) {
  if (imageUrl) {
    const designId = theme.motif ?? theme.preset;
    const imageFit = ['semi', 'panas', 'gugur', 'salju'].includes(designId) ? 'object-cover' : 'object-contain';
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={`h-full w-full ${imageFit} ${className}`} />;
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
  // Rustic: kertas kraft bertekstur + jahitan putus-putus di sampul (latar yang sama dengan undangan sungguhan: skin-bg.ts).
  const kraft = motif.skin === 'kraft';
  // Taman Botani: kertas gading berbintik + bingkai berukir (garden-parts.tsx).
  const garden = motif.skin === 'garden';
  const nameSize = phone ? 1 : gilded ? 0.58 : keraton ? 0.5 : 0.62;
  const rootClass = gilded ? 'wl-root wl-gilded' : keraton ? 'wl-root wl-keraton' : bloom ? 'wl-bloom' : kraft ? 'wl-kraft' : garden ? 'wl-garden' : '';
  const dark = motif.countdown === 'neon' || motif.countdown === 'pixel';
  // Ukuran ponsel: latar kulit yang sama persis dengan undangan sungguhan (skin-bg.ts / batik-art.ts). Mini: gradasi sederhana.
  const skinBg: CSSProperties | null = phone
    ? kraft
      ? { backgroundImage: KRAFT_TEXTURE, backgroundBlendMode: 'multiply' }
      : garden
        ? { ...GARDEN_BG, ['--garden-flourish' as string]: GARDEN_FLOURISH }
        : gilded
        ? GILDED_BG
        : motif.skin === 'dove'
          ? DOVE_BG
          : bloom
            ? BLOOM_BG
            : keraton
              ? { ...KERATON_BG, ...keratonVars(theme.primary, theme.secondary, theme.background) }
              : null
    : null;
  const rootStyle = {
    '--p': theme.primary,
    '--s': theme.secondary,
    '--bg': theme.background,
    '--tx': theme.text,
    ...(phone
      ? { backgroundColor: theme.background, color: theme.primary }
      : {
        background: kraft
          ? theme.background
          : bloom
          ? `linear-gradient(180deg, color-mix(in srgb, ${theme.secondary} 10%, #fff), #fff 34%, #fff 66%, color-mix(in srgb, ${theme.primary} 9%, #fff))`
          : `linear-gradient(165deg, color-mix(in srgb, ${theme.primary} 22%, ${theme.background}), ${theme.background} 52%, color-mix(in srgb, ${theme.primary} 10%, color-mix(in srgb, ${theme.secondary} 12%, ${theme.background})))`,
        color: theme.primary,
        ...(kraft ? { backgroundImage: KRAFT_TEXTURE, backgroundBlendMode: 'multiply' } : null),
        ...(keraton ? { ...KERATON_BG, ...keratonVars(theme.primary, theme.secondary, theme.background), background: theme.background, backgroundSize: '9px 9px, 9px 9px, 1px 100%, 1px 100%, 14px 14px', backgroundPosition: 'left top, right top, left 9px top, right 9px top, 0 0' } : null),
      }),
    ...skinBg,
  } as unknown as CSSProperties;

  // Salah satu tata letak berfoto milik template ini (mis. hasil desain x paket), dipilih dari `seed` supaya
  // stabil per kartu. Kembali ke "ornamen" (tampilan bawaan di bawah) bila tidak ada, atau fotonya belum ada.
  const kinds = coverLayouts.filter(isCoverKind);
  // Aturan yang sama dengan demo template & editor (defaultCoverLayout): pilihan admin, lalu khusus tema, lalu Foto berbingkai.
  const chosen = kinds.length > 0 ? defaultCoverLayout(kinds, coverDefault) : undefined;
  const resolved = chosen ? resolveCover(chosen, { cover: photos?.cover, groom: photos?.groom, bride: photos?.bride }) : undefined;

  // Gradasi/sorotan sampul di atas latar kulit (lapisan transparan, bukan bagian dari multiply): sama dengan undangan sungguhan.
  const coverOverlay = phone ? (
    <div className="absolute inset-0" style={{ background: coverBackgroundFor(motif.skin) }} aria-hidden />
  ) : kraft ? (
    <div className="absolute inset-0" style={{ background: KRAFT_COVER }} aria-hidden />
  ) : null;

  const cornerTop = phone ? (motif.cornerSize?.top ?? 'w-24') : bloom ? 'w-24' : 'w-14';
  const cornerBottom = phone ? (motif.cornerSize?.bottom ?? 'w-24') : bloom ? 'w-[4.4rem]' : 'w-14';
  const POS = phone
    ? {
        tl: keraton ? 'left-[30px] top-[30px]' : 'left-2 top-2',
        tr: keraton ? 'right-[30px] top-[30px]' : 'right-2 top-2',
        br: keraton ? 'bottom-[30px] right-[30px]' : 'bottom-2 right-2',
        bl: keraton ? 'bottom-[30px] left-[30px]' : 'bottom-2 left-2',
      }
    : { tl: 'left-1.5 top-1.5', tr: 'right-1.5 top-1.5', br: 'bottom-1.5 right-1.5', bl: 'bottom-1.5 left-1.5' };
  const cornersNode = (
    <>
      {kraft && <div className="wl-cover-stitch" />}
      {phone && garden && <GardenPageFrame />}
      {phone && motif.pageFrame && <MeadowPageFrame meadow={motif.pageFrame} />}
      {phone && motif.ornament === 'romantic' && <FloralPageFrame />}
      {phone && gilded && ['t h', 'b h', 'l v', 'r v', 't h i', 'b h i', 'l v i', 'r v i'].map((c) => <span key={c} className={`wl-gf ${c}`} />)}
      <div className={phone && gilded ? 'wl-corner-in' : undefined}>
        <orn.Corner className={`absolute ${POS.tl} ${cornerTop}`} rotate={0} />
        <orn.Corner className={`absolute ${POS.tr} ${cornerTop}`} rotate={90} />
        <orn.Corner className={`absolute ${POS.br} ${cornerBottom}`} rotate={180} />
        <orn.Corner className={`absolute ${POS.bl} ${cornerBottom}`} rotate={270} />
      </div>
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
          guest={phone ? { dear: STRINGS.id.dear, name: STRINGS.id.guestFallback } : null}
          openLabel={motif.copy?.open ?? 'Buka Undangan'}
          heading={{ ...nf, size: phone ? (gilded ? '4.2rem' : nf.size) : `calc(${nf.size} * ${nameSize})` }}
          gilded={gilded}
          animated={false}
          premium={false}
          decorative
          base={
            <>
              <div className="absolute inset-0" style={rootStyle} />
              {coverOverlay}
            </>
          }
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

  if (phone) {
    const kicker = motif.copy?.kicker ?? 'Undangan Pernikahan';
    const kickerStyle = gilded ? { fontFamily: 'var(--font-cinzel), serif', fontSize: 11, letterSpacing: '0.38em' } : null;
    const dateStyle = gilded
      ? { fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.34em', fontSize: 13 }
      : keraton
        ? { fontFamily: 'var(--font-montserrat), sans-serif', fontWeight: 500, letterSpacing: '0.32em', fontSize: 12.5 }
        : bloom
          ? { fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, letterSpacing: '0.3em', fontSize: 15 }
          : { letterSpacing: '0.3em', fontSize: 14 };
    return (
      <div className={`${rootClass} relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`} style={rootStyle}>
        {coverOverlay}
        <PatternLayer kind={motif.pattern} opacity={0.1} />
        {cornersNode}
        <div className="relative z-[4] flex flex-col items-center" style={{ color: theme.text }}>
          {bloom && <FloralMonogram a="A" b="S" size={128} className="mb-1" />}
          {motif.skin === 'dove' && <div className="mb-3"><DovePair size="w-[4.4rem]" /></div>}
          {gilded && <div className="mb-6"><Monogram a="A" b="S" size={92} /></div>}
          <p className="text-xs uppercase tracking-[0.35em] opacity-80" style={kickerStyle ?? undefined}>{kicker}</p>
          {keraton && <div className="mt-6 h-[13.5rem]" style={{ aspectRatio: '200 / 272' }}><Gunungan /></div>}
          <p
            className={`${keraton ? 'mt-7' : 'mt-4'} ${gilded ? 'wl-foil leading-[1.2]' : 'leading-[1.1]'}`}
            style={{ fontFamily: nf.family, fontWeight: nf.weight, fontSize: gilded ? '4.3rem' : nf.size, letterSpacing: nf.tracking, textTransform: nf.upper ? 'uppercase' : undefined, color: gilded ? undefined : 'var(--p)' }}
          >
            Andi & Sinta
          </p>
          <p className={bloom ? 'mt-3' : keraton ? 'mt-4' : gilded ? 'mt-4' : 'mt-5'} style={dateStyle}>12 . 12 . 2026</p>
          <orn.Divider className={keraton ? 'mt-5 w-52' : bloom ? 'mt-2 w-60' : 'mt-6 w-32 opacity-80'} />
          <div className="mt-8 text-sm">
            <p className="opacity-80" style={gilded ? { fontFamily: 'var(--font-cinzel), serif', fontSize: 10.5, letterSpacing: '0.34em', textTransform: 'uppercase' } : keraton ? { fontFamily: 'var(--font-montserrat), sans-serif', fontSize: 10.5, letterSpacing: '0.3em', textTransform: 'uppercase' } : bloom ? { fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', fontSize: 14 } : undefined}>{STRINGS.id.dear}</p>
            <p className={gilded || keraton ? 'mt-1 text-[1.35rem] font-semibold italic' : bloom ? 'mt-0.5 text-[1.45rem] font-semibold' : 'mt-1 text-lg font-semibold'} style={keraton ? { fontFamily: 'var(--font-playfair), serif' } : gilded || bloom ? { fontFamily: 'var(--font-cormorant), serif' } : undefined}>{STRINGS.id.guestFallback}</p>
          </div>
          <span
            className="wl-btn mt-10 px-7 py-3 text-sm font-medium tracking-wide shadow-lg"
            style={{ borderRadius: RADIUS[motif.radius].button, background: dark ? theme.secondary : 'var(--p)', color: dark ? '#111' : '#fff' }}
          >
            {motif.copy?.open ?? 'Buka Undangan'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${rootClass} relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`} style={rootStyle}>
      {coverOverlay}
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
