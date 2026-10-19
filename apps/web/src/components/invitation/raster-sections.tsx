'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import { rasterAsset, rasterTheme, rasterThemeVars } from './raster-theme';

/* Bagian isi desain raster (Sekar Keraton, Pusako Minang). Seluruh gayanya ada di globals.css (.wl-raster / .sk-*), karena ditulis bersama kulit halaman:
   kertas berukir sebagai ubin selebar layar, bingkai kayu sogan (card-frame + card-paper-panel), pigura foto kertas (photo-frame),
   pemisah kawung, dan kayon mini yang hanya muncul di dua-tiga tempat (README content-raster). */

export interface RasterPerson {
  nick: string;
  full?: string;
  parents?: string;
  photo?: string;
  role: string;
}

/** Variabel CSS gambar untuk akar undangan: ubin kertas, panel kertas, kayon mini, dan latar gerbang (dipakai countdown). */
export function rasterRootVars(artwork: ArtworkManifest): CSSProperties {
  const url = (slot: Parameters<typeof rasterAsset>[1]) => {
    const u = rasterAsset(artwork, slot);
    return u ? `url(${u})` : 'none';
  };
  const tile = rasterAsset(artwork, 'pageBackground') ?? rasterAsset(artwork, 'coverBackground');
  return {
    ...(tile ? { backgroundImage: `url(${tile})`, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', backgroundPosition: 'center top' } : null),
    ['--sk-panel' as string]: url('sectionBackground'),
    ['--sk-kayon' as string]: url('topDecoration'),
    ['--sk-gate' as string]: url('gateBackground'),
    ['--sk-card' as string]: url('cardFrame'),
    ...rasterThemeVars(artwork.designId),
  } as CSSProperties;
}

/** Pembatas kawung (aset divider); lebar diatur kelas `.sk-divider`. */
export function RasterDivider({ artwork, className = '' }: { artwork?: ArtworkManifest; className?: string }) {
  const src = artwork && rasterAsset(artwork, 'divider');
  return src ? <img src={src} alt="" className={`sk-divider ${className}`} draggable={false} /> : null;
}

/** Kartu informasi: panel kertas + bingkai kayu sogan & emas. Tinggi mengikuti isi (rasio aset adalah tinggi minimum). */
export function RasterCard({ artwork, children, className = '' }: { artwork?: ArtworkManifest; children: ReactNode; className?: string }) {
  if (rasterTheme(artwork?.designId)?.card.kind === 'sliced' && artwork) {
    const cardCfg = rasterTheme(artwork.designId)?.card;
    const crown = cardCfg?.kind === 'sliced' && cardCfg.crown ? rasterAsset(artwork, 'topDecoration') : undefined;
    const card = rasterAsset(artwork, 'cardFrame');
    return (
      <div className={`sk-card sk-card-sliced ${className}`} style={card ? ({ '--sk-card': `url(${card})` } as CSSProperties) : undefined}>
        {crown && <img src={crown} alt="" className="sk-card-crown" draggable={false} />}
        <div className="sk-card-body">{children}</div>
      </div>
    );
  }
  const panel = artwork && rasterAsset(artwork, 'sectionBackground');
  const frame = artwork && rasterAsset(artwork, 'cardFrame');
  return (
    <div className={`sk-card ${className}`}>
      {panel && <img src={panel} alt="" className="sk-card-panel" draggable={false} />}
      {frame && <img src={frame} alt="" className="sk-card-frame" draggable={false} />}
      <div className="sk-card-body">{children}</div>
    </div>
  );
}

/** Penutup: kayon mini, nama, lalu ambang keraton (footer-ornament). */
export function RasterFooter({ artwork, names, children }: { artwork?: ArtworkManifest; names: string; children?: ReactNode }) {
  const kayon = artwork && rasterAsset(artwork, 'topDecoration');
  const sill = artwork && rasterAsset(artwork, 'bottomDecoration');
  return (
    <>
      {kayon && <img src={kayon} alt="" className="sk-foot-kayon" draggable={false} />}
      <p className="sk-foot-names">{names}</p>
      {sill && <img src={sill} alt="" className="sk-foot-sill" draggable={false} />}
      {children}
    </>
  );
}

export function RasterCoupleSection({ artwork, title, people, onAssetError }: {
  artwork: ArtworkManifest;
  title: string;
  people: [RasterPerson, RasterPerson];
  animated?: boolean;
  onAssetError?: () => void;
}) {
  const frame = rasterAsset(artwork, 'photoFrame');
  return (
    <section className="wl-block sk-couple relative">
      <div className="wl-reveal relative z-[1] mb-9 text-center">
        <h2 className="sk-h2">{title}</h2>
        <RasterDivider artwork={artwork} />
      </div>
      <div className="relative z-[1]">
        {people.map((person, index) => (
          <article key={person.role} className="sk-person wl-reveal" data-side={index === 0 ? 'l' : 'r'}>
            <figure className="sk-mount">
              <div className="sk-mount-photo">
                {person.photo ? <img src={person.photo} alt={person.nick} /> : <span>{person.nick.charAt(0)}</span>}
              </div>
              {frame && <img src={frame} alt="" className="sk-mount-frame" draggable={false} onError={onAssetError} />}
            </figure>
            <p className="sk-role">{person.role}</p>
            <h3 className="sk-person-name">{person.full || person.nick}</h3>
            {person.parents && <p className="sk-parents">{person.parents}</p>}
            {index === 0 && <span className="sk-amp" aria-hidden>&amp;</span>}
          </article>
        ))}
      </div>
    </section>
  );
}
