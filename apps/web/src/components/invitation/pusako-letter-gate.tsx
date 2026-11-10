'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, type CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { pusakoLetterAssets, pusakoLetterNames, pusakoLetterRecipient } from './pusako-letter-assets';
import styles from './pusako-letter-gate.module.css';

/** Approved Surat Bersegel: live text above two raster-backed sliding paper/door halves. */
export function PusakoLetterGate({ artwork, phase, names, kicker, guest, cta, dateText, onOpen, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  dateText?: string;
  onOpen?: () => void;
  previewState?: 'closed' | 'open';
}) {
  const assets = pusakoLetterAssets(artwork);
  const couple = pusakoLetterNames(names);
  const recipient = pusakoLetterRecipient(guest);
  const opening = phase === 'opening' || previewState === 'open';
  const style = {
    '--plg-cloth': `url("${assets.cloth}")`,
    '--plg-card': `url("${assets.card}")`,
  } as CSSProperties;

  return (
    <div className={styles.gate} data-phase={phase} data-preview={previewState}
      data-long={couple.long ? 'true' : undefined} data-gate-design="surat-bersegel" style={style}>
      {(['left', 'right'] as const).map(side => (
        <div key={side} className={`${styles.leaf} ${styles[side]}`} aria-hidden="true">
          <div className={styles.canvas}>
            <img className={`${styles.post} ${styles.postLeft}`} src={assets.left} alt="" draggable={false} />
            <img className={`${styles.post} ${styles.postRight}`} src={assets.right} alt="" draggable={false} />
            <div className={styles.paper} />
            <img className={styles.foundation} src={assets.foundation} alt="" draggable={false} />
          </div>
        </div>
      ))}
      <div className={styles.copy} inert={opening}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.names} aria-label={couple.text}>
          {couple.parts.map((part, index) => <Fragment key={index}>
            {index > 0 && <span className={styles.amp}>&amp;</span>}
            <span className={styles.name}>{part}</span>
          </Fragment>)}
        </h1>
        {dateText && <p className={styles.date}>{dateText}</p>}
        <img className={styles.divider} src={assets.divider} alt="" draggable={false} />
        <div className={styles.recipient}>
          <p className={styles.dear}>Kepada Yth.</p>
          <p className={styles.guest} data-long-guest={recipient.length > 34 ? 'true' : undefined}>{recipient}</p>
        </div>
      </div>
      <button className={styles.seal} type="button" onClick={onOpen} disabled={opening || !onOpen}
        aria-label={`Buka undangan ${couple.text}`}>
        <img src={assets.seal} alt="" draggable={false} />
        <span>{cta || 'Ketuk gonjong untuk membuka'}</span>
      </button>
    </div>
  );
}
