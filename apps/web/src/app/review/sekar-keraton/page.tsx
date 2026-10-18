/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import { RasterCover } from '@/components/invitation/raster-cover';
import { PusakoGate } from '@/components/invitation/pusako-gate';
import { UlosGate } from '@/components/invitation/ulos-gate';
import { SekarKeratonGate } from '@/components/invitation/sekar-keraton-gate';
import { RasterCoupleSection } from '@/components/invitation/raster-sections';
import type { ArtworkManifest, ArtworkSource } from '@/lib/types';

const ROOT = '/review/sekar-keraton';
const mk = (design: string, folder: string, files: Record<string, [string, number, number]>): ArtworkManifest => ({
  schemaVersion: 1,
  designId: design,
  artworkVersion: 1,
  assets: Object.fromEntries(Object.entries(files).map(([slot, [file, width, height]]) => [slot, { default: { url: `/themes/${folder}/${file}.webp`, contentType: 'image/webp', width, height, sizeBytes: 1 } as ArtworkSource }])) as ArtworkManifest['assets'],
  presentation: {
    backgroundFit: 'cover', backgroundPosition: 'center', foregroundPosition: 'center', foregroundMotion: 'none',
    opacity: 1, scale: 1, backgroundLayer: 0, decorationLayer: 2, foregroundLayer: 3,
    showOnOrnamentCover: true, showOnPhotoCover: true,
  },
  fallback: { ornament: 'keraton', coverEffect: 'none', particle: 'dust' },
});

// Same slot maps as the manifests in apps/api/src/templates/artwork.ts.
const ARTWORKS: Record<string, ArtworkManifest> = {
  'jawa-sekar-keraton': mk('jawa-sekar-keraton', 'sekar-keraton', {
    coverBackground: ['page-background', 1024, 1536], pageBackground: ['page-tile', 1024, 3072], cornerTopLeft: ['corner-top-left', 1155, 1048],
    cornerBottomRight: ['corner-bottom-right', 1155, 1048], divider: ['divider-kawung', 2208, 364], topDecoration: ['mini-kayon', 838, 1483],
    sectionBackground: ['card-paper-panel', 1000, 1250], cardFrame: ['card-frame', 1101, 1434], photoFrame: ['photo-frame', 1014, 1496],
    bottomDecoration: ['footer-ornament', 2234, 372], gateBackground: ['gate-background', 1024, 1536], gateInteractive: ['kayon-wayang', 1024, 1536],
  }),
  'horas-nauli': mk('horas-nauli', 'horas-nauli', {
    coverBackground: ['page-tile', 1024, 3072], pageBackground: ['page-tile', 1024, 3072], divider: ['divider', 1934, 106], topDecoration: ['mini-knot', 795, 795],
    bottomDecoration: ['ribbon', 1981, 314], cardFrame: ['info-card', 917, 1393], photoFrame: ['photo-frame', 901, 1372],
    gateBackground: ['gate-tile', 1024, 3010], gateTransition: ['gate-panel-left', 675, 1512], gateForeground: ['gate-panel-right', 675, 1512], gateInteractive: ['gate-knot', 1123, 1121],
  }),
  'pusako-minang': mk('pusako-minang', 'pusako-minang', {
    coverBackground: ['page-background', 1024, 1536], pageBackground: ['page-tile', 1024, 3072], cornerTopLeft: ['corner-top-left', 1100, 1105],
    cornerBottomRight: ['corner-bottom-right', 1100, 1105], divider: ['divider', 1996, 274], topDecoration: ['mini-gonjong', 1183, 652],
    cardFrame: ['info-card', 896, 1405], photoFrame: ['photo-frame', 892, 1413], bottomDecoration: ['footer', 2015, 297],
    gateBackground: ['gate-tile', 1024, 3072], gateTransition: ['gate-post-left', 323, 1497], gateForeground: ['gate-post-right', 323, 1497],
    gateInteractive: ['gate-gonjong', 1160, 868],
  }),
};

const reviewKinds = ['ornamen', 'bingkai', 'berdua', 'terbagi'] as const;
type ReviewKind = (typeof reviewKinds)[number];

const labels: Record<ReviewKind, string> = {
  ornamen: 'Ornamen',
  bingkai: 'Foto Berbingkai',
  berdua: 'Berdua',
  terbagi: 'Terbagi',
};

const references: Record<ReviewKind, string> = {
  ornamen: `${ROOT}/reference-ornamen.webp`,
  bingkai: `${ROOT}/reference-bingkai.webp`,
  berdua: `${ROOT}/reference-berdua.webp`,
  terbagi: `${ROOT}/reference-terbagi.webp`,
};

export const metadata = { title: 'Sekar Keraton — Review', robots: { index: false, follow: false } };

export default async function SekarKeratonReview({ searchParams }: {
  searchParams: Promise<{ layout?: string; compare?: string; view?: string; state?: string; design?: string }>;
}) {
  const query = await searchParams;
  const designId = query.design && ARTWORKS[query.design] ? query.design : 'jawa-sekar-keraton';
  const artwork = ARTWORKS[designId]!;
  const pusako = designId === 'pusako-minang';
  const horas = designId === 'horas-nauli';
  const kind: ReviewKind = reviewKinds.includes(query.layout as ReviewKind) ? query.layout as ReviewKind : 'ornamen';
  const variables = {
    '--p': '#74401f', '--s': '#aa7d38', '--bg': '#ead6ad', '--tx': '#3a291e',
  } as CSSProperties;
  const props = {
    artwork,
    photo: '/samples/sekar-keraton/cover.webp',
    groom: '/samples/sekar-keraton/groom-v2.webp',
    bride: '/samples/sekar-keraton/bride-v2.webp',
    kicker: horas ? 'Pemberkatan & Adat' : pusako ? 'Undangan Pernikahan' : 'Pawiwahan Putra-Putri Kami',
    names: horas ? 'Marolop Simatupang & Sari Sitorus' : pusako ? 'Rizky Pratama & Aisyah Putri' : 'Raden Andi & Raden Ayu Sinta',
    dateText: '17 . 08 . 2027',
    guest: { dear: 'Kepada Yth.', name: 'Bapak/Ibu/Saudara/i' },
    openLabel: 'Buka Undangan',
    animated: false,
    decorative: true,
  } as const;

  if (query.view === 'gate') {
    return (
      <main className="min-h-screen bg-[#201610]" style={variables}>
        <div className="relative mx-auto h-[100svh] w-full max-w-[480px] overflow-hidden bg-[#ead6ad]">
          <RasterCover {...props} kind="ornamen" />
          <div className="absolute inset-0 z-10">
            {horas ? (
              <UlosGate artwork={artwork} phase="closed" names={props.names} kicker={props.kicker} guest={props.guest.name} cta="Ketuk simpul untuk membuka" previewState={query.state === 'open' ? 'open' : 'closed'} />
            ) : pusako ? (
              <PusakoGate artwork={artwork} phase="closed" names={props.names} kicker={props.kicker} guest={props.guest.name} cta="Ketuk gonjong untuk membuka" previewState={query.state === 'open' ? 'open' : 'closed'} />
            ) : (
              <SekarKeratonGate artwork={artwork} phase="closed" names={props.names} kicker={props.kicker} guest={props.guest.name} cta="Ketuk kayon untuk membuka" previewState={query.state === 'open' ? 'open' : 'closed'} />
            )}
          </div>
        </div>
      </main>
    );
  }

  if (query.view === 'couple') {
    return (
      <main className="min-h-screen bg-[#201610]" style={variables}>
        <div className="mx-auto w-full max-w-[480px] bg-[#ead6ad]">
          <RasterCoupleSection
            artwork={artwork}
            title="Mempelai"
            animated={false}
            people={[
              { role: 'Mempelai Pria', nick: 'Andi', full: 'Raden Mas Andi Wicaksana', parents: 'Putra dari Bapak Hadi Wicaksana & Ibu Retno Utami', photo: props.groom },
              { role: 'Mempelai Wanita', nick: 'Sinta', full: 'Raden Ayu Sinta Larasati', parents: 'Putri dari Bapak Bimo Santosa & Ibu Sekar Rahayu', photo: props.bride },
            ]}
          />
        </div>
      </main>
    );
  }

  if (query.compare === '1') {
    return (
      <main className="min-h-screen bg-[#201610] px-6 py-10 text-[#ead6ad]" style={variables}>
        <header className="mx-auto mb-7 max-w-[980px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-[#c9a666]">Sekar Keraton · Design Review</p>
          <h1 className="mt-2 font-serif text-3xl">{labels[kind]}</h1>
        </header>
        <div className="mx-auto grid max-w-[980px] gap-8 md:grid-cols-2">
          <figure>
            <figcaption className="mb-3 text-center text-xs uppercase tracking-[.2em]">Approved Phase 1 concept</figcaption>
            <div className="relative mx-auto aspect-[390/844] w-full max-w-[390px] overflow-hidden bg-[#ead6ad] shadow-2xl">
              <img src={references[kind]} alt={`Approved ${labels[kind]} concept`} className="h-full w-full object-contain" />
            </div>
          </figure>
          <figure>
            <figcaption className="mb-3 text-center text-xs uppercase tracking-[.2em]">New independent implementation</figcaption>
            <div className="relative mx-auto aspect-[390/844] w-full max-w-[390px] overflow-hidden bg-[#ead6ad] shadow-2xl">
              <section className="relative h-full px-8"><RasterCover {...props} kind={kind} /></section>
            </div>
          </figure>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#201610]" style={variables}>
      <div className="relative mx-auto h-[100svh] w-full max-w-[480px] overflow-hidden bg-[#ead6ad]">
        <section className="relative h-full px-8"><RasterCover {...props} kind={kind} /></section>
      </div>
    </main>
  );
}
