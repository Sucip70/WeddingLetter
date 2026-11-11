'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, type CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';
import { culturalRevisionSource } from './cultural-artwork';
import styles from './lentera-gate.module.css';

export function hasLenteraGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'hong-xi' && artwork?.designId === 'hong-xi' && !!(artwork.assets.gateBackground && artwork.assets.cornerTopLeft && artwork.assets.gateInteractive);
}

/** Angpao Merah: mirror paper/lanterns only; never mirror the Chinese character. */
export function LenteraGate({ artwork, phase, names, kicker, guest, cta = 'Buka undangan', previewState, dateText, onOpen }: {
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
  const cloud = culturalRevisionSource(artwork, 'gateCta');
  const style = { '--lg-paper': `url("${rasterAsset(artwork, 'gateBackground')}")` } as CSSProperties;
  return (
    <div className={styles.gate} data-phase={phase} data-preview={previewState}
      data-long={names.length > 24 ? 'true' : undefined} data-gate-design="angpao-merah" style={style}>
      {(['left', 'right'] as const).map(side => (
        <div className={`${styles.leaf} ${styles[side]}`} key={side} aria-hidden="true">
          <div className={styles.canvas}><img className={styles.lamps} src={rasterAsset(artwork, 'cornerTopLeft')} alt="" draggable={false} /></div>
        </div>
      ))}
      <img className={styles.xi} src={rasterAsset(artwork, 'gateInteractive')} alt="" aria-hidden="true" draggable={false} />
      <div className={styles.assembly} inert={opening}>
        <div className={styles.letter}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.names} aria-label={names}>{names.split(/\s*&\s*/u).map((part, i) => (
            <Fragment key={i}>{i > 0 && <span className={styles.amp}> &amp; </span>}<span className={styles.name}>{part}</span></Fragment>
          ))}</h1>
          {dateText && <p className={styles.date}>{dateText}</p>}
          {divider && <img className={styles.divider} src={divider} alt="" draggable={false} />}
          <div><p className={styles.dear}>Kepada Yth.</p><p className={styles.guest}>{guest?.trim() || 'Bapak/Ibu/Saudara/i'}</p></div>
        </div>
        <button className={styles.seal} type="button" onClick={onOpen} disabled={opening || !onOpen} aria-label={`Buka undangan ${names}`}>
          <img src={cloud?.url} width={cloud?.width} height={cloud?.height} alt="" draggable={false} />
          <span>{cta}</span>
        </button>
      </div>
    </div>
  );
}
