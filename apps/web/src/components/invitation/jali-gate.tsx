'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, type CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';
import { culturalRevisionSource } from './cultural-artwork';
import styles from './jali-gate.module.css';

export function hasJaliGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'noor-e-nikah' && artwork?.designId === 'noor-e-nikah' && !!(
    artwork.assets.cardFrame && artwork.assets.gateInteractive
  );
}

/** Approved Lengkung Gading: ivory letter, mirrored jali edges, independent rosette CTA. */
export function JaliGate({ artwork, phase, names, kicker, guest, cta = 'Buka undangan', previewState, dateText, onOpen }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
  dateText?: string;
  onOpen?: () => void;
}) {
  const opening = phase === 'opening' || previewState === 'open';
  const divider = rasterAsset(artwork, 'divider');
  const footer = rasterAsset(artwork, 'bottomDecoration');
  const cloth = culturalRevisionSource(artwork, 'gateCloth');
  const jali = culturalRevisionSource(artwork, 'gateLattice');
  const style = {
    '--jg-cloth': `url("${cloth?.url}")`,
    '--jg-card': `url("${rasterAsset(artwork, 'cardFrame')}")`,
  } as CSSProperties;
  return (
    <div className={styles.gate} style={style} data-phase={phase} data-preview={previewState}
      data-gate-design="lengkung-gading" data-long={names.length > 24 ? 'true' : undefined}>
      {(['left','right'] as const).map(side => <div key={side} className={`${styles.leaf} ${styles[side]}`} aria-hidden="true">
        <img className={styles.jali} src={jali?.url} alt="" draggable={false} />
      </div>)}
      {footer && <img className={styles.footer} src={footer} alt="" draggable={false} aria-hidden="true" />}
      <div className={styles.stack} inert={opening}>
        <div className={styles.letter}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.names} aria-label={names}>{names.split(/\s*&\s*/u).map((part,i)=><Fragment key={i}>
            {i > 0 && <span className={styles.amp}> &amp; </span>}<span className={styles.name}>{part}</span>
          </Fragment>)}</h1>
          {dateText && <p className={styles.date}>{dateText}</p>}
          {divider && <img className={styles.divider} src={divider} alt="" draggable={false} />}
          <div className={styles.recipient}><p className={styles.dear}>Kepada Yth.</p><p className={styles.guest}>{guest?.trim() || 'Bapak/Ibu/Saudara/i'}</p></div>
        </div>
        <button className={styles.seal} type="button" onClick={onOpen} disabled={opening || !onOpen} aria-label={`Buka undangan ${names}`}>
          <img src={rasterAsset(artwork,'gateInteractive')} alt="" draggable={false} /><span>{cta}</span>
        </button>
      </div>
    </div>
  );
}
