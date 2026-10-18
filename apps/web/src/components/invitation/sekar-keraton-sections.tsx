'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import { sekarAsset } from './sekar-keraton-cover';

/* Bagian isi Sekar Keraton. Seluruh gayanya ada di globals.css (.wl-sekar / .sk-*), karena ditulis bersama kulit halaman:
   kertas berukir sebagai ubin selebar layar, bingkai kayu sogan (card-frame + card-paper-panel), pigura foto kertas (photo-frame),
   pemisah kawung, dan kayon mini yang hanya muncul di dua-tiga tempat (README content-raster). */

export interface SekarKeratonPerson {
  nick: string;
  full?: string;
  parents?: string;
  photo?: string;
  role: string;
}

/** Variabel CSS gambar untuk akar undangan: ubin kertas, panel kertas, kayon mini, dan latar gerbang (dipakai countdown). */
export function sekarRootVars(artwork: ArtworkManifest): CSSProperties {
  const url = (slot: Parameters<typeof sekarAsset>[1]) => {
    const u = sekarAsset(artwork, slot);
    return u ? `url(${u})` : 'none';
  };
  const tile = sekarAsset(artwork, 'pageBackground') ?? sekarAsset(artwork, 'coverBackground');
  return {
    ...(tile ? { backgroundImage: `url(${tile})`, backgroundSize: '100% auto', backgroundRepeat: 'repeat-y', backgroundPosition: 'center top' } : null),
    ['--sk-panel' as string]: url('sectionBackground'),
    ['--sk-kayon' as string]: url('topDecoration'),
    ['--sk-gate' as string]: url('gateBackground'),
  } as CSSProperties;
}

/** Pembatas kawung (aset divider); lebar diatur kelas `.sk-divider`. */
export function SekarDivider({ artwork, className = '' }: { artwork?: ArtworkManifest; className?: string }) {
  const src = artwork && sekarAsset(artwork, 'divider');
  return src ? <img src={src} alt="" className={`sk-divider ${className}`} draggable={false} /> : null;
}

/** Kartu informasi: panel kertas + bingkai kayu sogan & emas. Tinggi mengikuti isi (rasio aset adalah tinggi minimum). */
export function SekarCard({ artwork, children, className = '' }: { artwork?: ArtworkManifest; children: ReactNode; className?: string }) {
  const panel = artwork && sekarAsset(artwork, 'sectionBackground');
  const frame = artwork && sekarAsset(artwork, 'cardFrame');
  return (
    <div className={`sk-card ${className}`}>
      {panel && <img src={panel} alt="" className="sk-card-panel" draggable={false} />}
      {frame && <img src={frame} alt="" className="sk-card-frame" draggable={false} />}
      <div className="sk-card-body">{children}</div>
    </div>
  );
}

/** Penutup: kayon mini, nama, lalu ambang keraton (footer-ornament). */
export function SekarFooter({ artwork, names, children }: { artwork?: ArtworkManifest; names: string; children?: ReactNode }) {
  const kayon = artwork && sekarAsset(artwork, 'topDecoration');
  const sill = artwork && sekarAsset(artwork, 'bottomDecoration');
  return (
    <>
      {kayon && <img src={kayon} alt="" className="sk-foot-kayon" draggable={false} />}
      <p className="sk-foot-names">{names}</p>
      {sill && <img src={sill} alt="" className="sk-foot-sill" draggable={false} />}
      {children}
    </>
  );
}

export function SekarKeratonCoupleSection({ artwork, title, people, onAssetError }: {
  artwork: ArtworkManifest;
  title: string;
  people: [SekarKeratonPerson, SekarKeratonPerson];
  animated?: boolean;
  onAssetError?: () => void;
}) {
  const frame = sekarAsset(artwork, 'photoFrame');
  return (
    <section className="wl-block sk-couple relative">
      <div className="wl-reveal relative z-[1] mb-9 text-center">
        <h2 className="sk-h2">{title}</h2>
        <SekarDivider artwork={artwork} />
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
