'use client';

import { Fragment, type CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { culturalRevisionSource } from './cultural-artwork';
import styles from './toran-gate.module.css';

export function hasToranGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'vivaha-rani' && artwork?.designId === 'vivaha-rani';
}

/** Approved opaque silk doors. Each leaf shows its own half of the same raster. */
export function ToranGate({ artwork, phase, names, guest, onOpen, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  onOpen?: () => void;
  previewState?: 'closed' | 'open';
}) {
  const opening = phase !== 'closed' || previewState === 'open';
  const doors = culturalRevisionSource(artwork, 'gateDoors');
  const style = { '--vivaha-doors': `url("${doors?.url}")` } as CSSProperties;
  return <div className={styles.gate} style={style} data-phase={phase} data-preview={previewState}
    data-gate-design="vivaha-pintu-sutra" data-long={names.length > 24 ? 'true' : undefined}>
    {(['left', 'right'] as const).map(side => <div key={side} className={`${styles.leaf} ${styles[side]}`} aria-hidden="true"><div className={styles.canvas} /></div>)}
    <div className={styles.identity}>
      <p className={styles.kicker}>Pernikahan</p>
      <h1 className={styles.names} aria-label={names}>{names.split(/\s*&\s*/u).map((part, i) => <Fragment key={i}>
        {i > 0 && <span className={styles.amp}> &amp; </span>}<span className={styles.name}>{part}</span>
      </Fragment>)}</h1>
    </div>
    <div className={styles.recipient}><p className={styles.dear}>Kepada Yth.</p><p className={styles.guest}>{guest?.trim() || 'Bapak/Ibu/Saudara/i'}</p></div>
    <button className={styles.action} type="button" onClick={onOpen} disabled={opening || !onOpen}
      aria-label={`Ketuk pintu untuk membuka undangan ${names}`}><span>Ketuk pintu untuk membuka</span></button>
  </div>;
}
