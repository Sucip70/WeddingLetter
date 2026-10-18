/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import { SekarKeratonCover } from '@/components/invitation/sekar-keraton-cover';
import { SekarKeratonGate } from '@/components/invitation/sekar-keraton-gate';
import { SekarKeratonCoupleSection } from '@/components/invitation/sekar-keraton-sections';
import type { ArtworkManifest, ArtworkSource } from '@/lib/types';

const ROOT = '/review/sekar-keraton';
const THEME = '/themes/sekar-keraton';
const src = (file: string, width: number, height: number): ArtworkSource => ({ url: `${THEME}/${file}.webp`, contentType: 'image/webp', width, height, sizeBytes: 1 });

// Same slot map as sekarKeratonArtwork() in apps/api/src/templates/artwork.ts.
const artwork: ArtworkManifest = {
  schemaVersion: 1,
  designId: 'jawa-sekar-keraton',
  artworkVersion: 2,
  assets: {
    coverBackground: { default: src('page-background', 1024, 1536) },
    pageBackground: { default: src('page-tile', 1024, 3072) },
    cornerTopLeft: { default: src('corner-top-left', 1155, 1048) },
    cornerBottomRight: { default: src('corner-bottom-right', 1155, 1048) },
    divider: { default: src('divider-kawung', 2208, 364) },
    topDecoration: { default: src('mini-kayon', 838, 1483) },
    sectionBackground: { default: src('card-paper-panel', 1000, 1250) },
    cardFrame: { default: src('card-frame', 1101, 1434) },
    photoFrame: { default: src('photo-frame', 1014, 1496) },
    bottomDecoration: { default: src('footer-ornament', 2234, 372) },
    gateBackground: { default: src('gate-background', 1024, 1536) },
    gateInteractive: { default: src('kayon-wayang', 1024, 1536) },
  },
  presentation: {
    backgroundFit: 'cover', backgroundPosition: 'center', foregroundPosition: 'center', foregroundMotion: 'none',
    opacity: 1, scale: 1, backgroundLayer: 0, decorationLayer: 2, foregroundLayer: 3,
    showOnOrnamentCover: true, showOnPhotoCover: true,
  },
  fallback: { ornament: 'keraton', coverEffect: 'none', particle: 'dust' },
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
  searchParams: Promise<{ layout?: string; compare?: string; view?: string; state?: string }>;
}) {
  const query = await searchParams;
  const kind: ReviewKind = reviewKinds.includes(query.layout as ReviewKind) ? query.layout as ReviewKind : 'ornamen';
  const variables = {
    '--p': '#74401f', '--s': '#aa7d38', '--bg': '#ead6ad', '--tx': '#3a291e',
  } as CSSProperties;
  const props = {
    artwork,
    photo: '/samples/sekar-keraton/cover.webp',
    groom: '/samples/sekar-keraton/groom-v2.webp',
    bride: '/samples/sekar-keraton/bride-v2.webp',
    kicker: 'Pawiwahan Putra-Putri Kami',
    names: 'Raden Andi & Raden Ayu Sinta',
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
          <SekarKeratonCover {...props} kind="ornamen" />
          <div className="absolute inset-0 z-10">
            <SekarKeratonGate artwork={artwork} phase="closed" names={props.names} kicker={props.kicker} guest={props.guest.name} cta="Ketuk kayon untuk membuka" previewState={query.state === 'open' ? 'open' : 'closed'} />
          </div>
        </div>
      </main>
    );
  }

  if (query.view === 'couple') {
    return (
      <main className="min-h-screen bg-[#201610]" style={variables}>
        <div className="mx-auto w-full max-w-[480px] bg-[#ead6ad]">
          <SekarKeratonCoupleSection
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
              <section className="relative h-full px-8"><SekarKeratonCover {...props} kind={kind} /></section>
            </div>
          </figure>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#201610]" style={variables}>
      <div className="relative mx-auto h-[100svh] w-full max-w-[480px] overflow-hidden bg-[#ead6ad]">
        <section className="relative h-full px-8"><SekarKeratonCover {...props} kind={kind} /></section>
      </div>
    </main>
  );
}
