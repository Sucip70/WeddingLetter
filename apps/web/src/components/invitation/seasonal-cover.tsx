'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { CoverKind } from '@/lib/cover-layouts';
import type { ArtworkManifest } from '@/lib/types';
import { TemplateArtwork } from './template-artwork';

type SeasonalKind = Exclude<CoverKind, 'ornamen'>;

const SEASONS = {
  semi: { tint: 'rgba(228,146,171,.16)', edge: '#d98ca7', edge2: '#8ca889' },
  panas: { tint: 'rgba(29,143,151,.17)', edge: '#168d95', edge2: '#d5b472' },
  gugur: { tint: 'rgba(160,78,34,.18)', edge: '#ad5b2b', edge2: '#6f432d' },
  salju: { tint: 'rgba(112,162,194,.18)', edge: '#8abbd3', edge2: '#334e76' },
} as const;

export interface SeasonalCoverProps {
  kind: SeasonalKind;
  designId: keyof typeof SEASONS;
  artwork: ArtworkManifest;
  photo?: string;
  groom?: string;
  bride?: string;
  kicker: string;
  names: string;
  dateText: string;
  guest: { dear: string; name: string } | null;
  openLabel: string;
  onOpen: () => void;
  heading: { family: string; weight: number; tracking?: string; upper?: boolean };
  animated: boolean;
  premium: boolean;
  buttonRadius: string;
  onAssetError?: () => void;
}

export function SeasonalCoverLayout(p: SeasonalCoverProps) {
  const palette = SEASONS[p.designId];
  const fullPhoto = p.kind === 'penuh' || p.kind === 'penuh-atas' || p.kind === 'bingkai-penuh';
  const enter = (delay: number) => p.animated ? { className: 'wl-enter', style: { '--d': `${delay}ms` } as CSSProperties } : { className: '', style: undefined };
  const availablePortraits = [p.groom, p.bride].filter((src): src is string => !!src);
  const coverPhoto = p.photo ?? availablePortraits[0];

  const kicker = (light = false) => {
    const e = enter(100);
    return <p className={`wl-seasonal-kicker ${e.className}`} style={{ ...e.style, color: light ? '#fff' : 'var(--tx)' }}>{p.kicker}</p>;
  };
  const names = (light = false) => {
    const e = enter(250);
    return <h1 className={`wl-seasonal-names ${e.className}`} style={{ ...e.style, color: light ? '#fff' : 'var(--p)', fontFamily: p.heading.family, fontWeight: p.heading.weight, letterSpacing: p.heading.tracking, textTransform: p.heading.upper ? 'uppercase' : undefined }}>{p.names}</h1>;
  };
  const date = (light = false) => {
    const e = enter(430);
    return p.dateText ? <p className={`wl-seasonal-date ${e.className}`} style={{ ...e.style, color: light ? '#fff' : 'var(--tx)' }}>{p.dateText}</p> : null;
  };
  const divider = (light = false) => (
    <div className="wl-seasonal-divider" style={{ color: light ? '#fff' : 'var(--p)' }} aria-hidden>
      <span />
      {p.artwork.assets.divider ? <TemplateArtwork artwork={p.artwork} context="divider" /> : <i />}
      <span />
    </div>
  );
  const guest = (light = false) => {
    if (!p.guest) return null;
    const e = enter(650);
    return <div className={`wl-seasonal-guest ${e.className}`} style={{ ...e.style, color: light ? '#fff' : 'var(--tx)' }}><p>{p.guest.dear}</p><strong>{p.guest.name}</strong></div>;
  };
  const button = (light = false) => {
    const e = enter(800);
    return <button onClick={p.onOpen} className={`wl-seasonal-cta ${e.className}`} style={{ ...e.style, borderRadius: p.buttonRadius, color: light ? 'var(--p)' : '#fff', background: light ? 'rgba(255,255,255,.94)' : 'var(--p)' }}>{p.openLabel}</button>;
  };
  const paper = <TemplateArtwork artwork={p.artwork} context="cover" onAssetError={p.onAssetError} />;
  const photo = (src: string | undefined, className = '') => src ? <img src={src} alt="" className={`h-full w-full object-cover ${className}`} /> : null;

  if (fullPhoto) {
    const topNames = p.kind === 'penuh-atas';
    return (
      <div className="wl-seasonal-photo-cover" style={{ '--season-tint': palette.tint, '--season-edge': palette.edge, '--season-edge-2': palette.edge2 } as CSSProperties}>
        {photo(coverPhoto, p.premium && p.animated ? 'wl-seasonal-photo-breathe' : '')}
        <div className="wl-seasonal-photo-grade" />
        {p.kind === 'bingkai-penuh' && <div className="wl-seasonal-inner-frame"><span /></div>}
        <div className={`wl-seasonal-full-copy ${topNames ? 'wl-seasonal-full-copy-top' : ''}`}>
          {topNames ? (
            <><div className="wl-seasonal-full-heading">{kicker(true)}{names(true)}{date(true)}{divider(true)}</div><div className="wl-seasonal-full-action">{guest(true)}{button(true)}</div></>
          ) : (
            <>{kicker(true)}<div className="wl-seasonal-full-action">{names(true)}{date(true)}{divider(true)}{guest(true)}{button(true)}</div></>
          )}
        </div>
      </div>
    );
  }

  if (p.kind === 'terbagi') {
    return (
      <div className="wl-seasonal-paper-cover">
        {paper}
        <div className="wl-seasonal-split-photo">{photo(coverPhoto)}</div>
        <div className="wl-seasonal-split-card">
          {p.artwork.assets.sectionBackground && <TemplateArtwork artwork={p.artwork} context="section" onAssetError={p.onAssetError} />}
          <div className="wl-seasonal-split-card-content">{kicker()}{names()}{date()}{guest()}{button()}</div>
        </div>
      </div>
    );
  }

  if (p.kind === 'bingkai') {
    return (
      <div className="wl-seasonal-paper-cover">
        {paper}
        <div className="wl-seasonal-focus-copy">
          <div className="wl-seasonal-photo-card">
            <div>{photo(coverPhoto)}</div>
            {p.dateText && <p>{p.dateText}</p>}
          </div>
          {names()}{divider()}{guest()}{button()}
        </div>
      </div>
    );
  }

  if (p.kind === 'berdua') {
    return (
      <div className="wl-seasonal-paper-cover">
        {paper}
        <div className="wl-seasonal-focus-copy">
          {availablePortraits.length > 1 ? (
            <div className="wl-seasonal-dual-cards">{availablePortraits.slice(0, 2).map((src, index) => <div key={`${src}:${index}`}>{photo(src)}</div>)}</div>
          ) : (
            <div className="wl-seasonal-photo-card wl-seasonal-photo-card-single"><div>{photo(availablePortraits[0] ?? coverPhoto)}</div></div>
          )}
          {names()}{date()}{divider()}{guest()}{button()}
        </div>
      </div>
    );
  }

  return (
    <div className={`wl-seasonal-paper-cover ${`wl-seasonal-fit wl-season-${p.designId}`}`}>
      {paper}
      <div className="wl-seasonal-paper-copy">
        {kicker()}
        {p.kind === 'medali' && <div className="wl-seasonal-medal" style={{ '--season-edge': palette.edge, '--season-edge-2': palette.edge2 } as CSSProperties}>{photo(coverPhoto)}</div>}
        {names()}{date()}{divider()}{guest()}{button()}
      </div>
    </div>
  );
}
