'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';
import styles from './candi-gate.module.css';

export function hasCandiGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'pawiwahan-agung' && artwork?.designId === 'pawiwahan-agung' && !!(
    artwork.assets.gateBackground && artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/** Prada Terpusat: the same left stonework and curtain are mirrored around one exact centerline. */
export function CandiGate({ artwork, phase, names, kicker, guest, cta = 'Buka undangan', previewState, dateText, onOpen }: {
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
  const recipient = guest?.trim() || 'Bapak/Ibu/Saudara/i';
  const curtain = rasterAsset(artwork, 'gateTransition');
  const divider = rasterAsset(artwork, 'divider');
  const style = {
    '--cg-background': `url("${rasterAsset(artwork, 'gateBackground')}")`,
  } as CSSProperties;
  return (
    <div className={styles.gate} style={style} data-phase={phase} data-preview={previewState}
      data-long={names.length > 24 ? 'true' : undefined} data-gate-design="prada-terpusat">
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.portal}>
          <div className={`${styles.panel} ${styles.left}`}><img src={curtain} alt="" draggable={false} /></div>
          <div className={`${styles.panel} ${styles.right}`}><img src={curtain} alt="" draggable={false} /></div>
        </div>
      </div>
      <div className={styles.assembly} inert={opening}>
        <div className={styles.letter}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.names}>{names}</h1>
          {dateText && <p className={styles.date}>{dateText}</p>}
          {divider && <img className={styles.divider} src={divider} alt="" draggable={false} />}
          <div>
            <p className={styles.dear}>Kepada Yth.</p>
            <p className={styles.recipient}>{recipient}</p>
          </div>
        </div>
        <button className={styles.seal} type="button" onClick={onOpen} disabled={opening || !onOpen}
          aria-label={`Buka undangan ${names}`}>
          <img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} />
          <span>{cta}</span>
        </button>
      </div>
    </div>
  );
}
