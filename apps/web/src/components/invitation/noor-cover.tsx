'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, useState, type CSSProperties } from 'react';
import type { CoverProps } from './raster-cover';
import { rasterAsset } from './raster-theme';
import paper from './assets/noor-cover-paper.webp';
import styles from './noor-cover.module.css';

/** The invitation cover AFTER the gate. Artwork never contains names or user photos. */
export function NoorCover(p: CoverProps) {
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const photo = p.photo || p.groom || p.bride;
  const candidates = p.kind === 'berdua' ? [p.groom, p.bride] : [photo];
  const portraits = candidates.filter((src): src is string => !!src && !failedPhotos.has(src));
  const withPhoto = p.kind !== 'ornamen' && portraits.length > 0;
  const divider = rasterAsset(p.artwork, 'divider');
  const marker = rasterAsset(p.artwork, 'topDecoration');
  const frame = rasterAsset(p.artwork, 'photoFrame');
  const style = { '--noor-paper': `url("${rasterAsset(p.artwork, 'coverPaper') ?? paper.src}")` } as CSSProperties;
  const Tag = p.decorative ? 'span' : 'button';
  return (
    <div className={styles.cover} style={style} data-cover-design="noor-inlay-ivory" data-kind={p.kind}
      data-long={p.names.length > 24 ? 'true' : undefined} data-photo={withPhoto ? 'true' : 'false'} data-animated={p.animated ? 'true' : undefined}>
      <div className={styles.paper} aria-hidden="true" />
      <div className={styles.stack}>
        {withPhoto ? <div className={styles.portraits}>
          {portraits.map((src, i) => <figure className={styles.mount} key={`${i}-${src}`}>
            <img className={styles.photo} src={src} alt={p.kind === 'berdua' ? `Foto mempelai ${i + 1}` : 'Foto pasangan'}
              onError={() => setFailedPhotos(current => new Set(current).add(src))} />
            {frame && <img className={styles.frame} src={frame} alt="" draggable={false} onError={p.onAssetError} />}
          </figure>)}
        </div> : marker && <img className={styles.marker} src={marker} alt="" draggable={false} onError={p.onAssetError} />}
        <div className={styles.copy}>
          <p className={styles.kicker}>{p.kicker}</p>
          <h1 className={styles.names} aria-label={p.names}>{p.names.split(/\s*&\s*/u).map((part, i) => <Fragment key={i}>
            {i > 0 && <span className={styles.amp}> &amp; </span>}<span className={styles.name}>{part}</span>
          </Fragment>)}</h1>
          {p.dateText && <p className={styles.date}>{p.dateText}</p>}
          {divider && <img className={styles.divider} src={divider} alt="" draggable={false} onError={p.onAssetError} />}
          {p.guest && <div className={styles.recipient}><p className={styles.dear}>{p.guest.dear}</p><p className={styles.guest}>{p.guest.name}</p></div>}
          <Tag className={styles.action} {...(p.decorative ? {} : {type:'button' as const,onClick:p.onOpen})}>{p.openLabel}</Tag>
        </div>
      </div>
    </div>
  );
}
