'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, useState, type CSSProperties } from 'react';
import type { CoverProps } from './raster-cover';
import { rasterAsset } from './raster-theme';
import { culturalRevisionSource } from './cultural-artwork';
import styles from './sekar-cover.module.css';

/** Approved Bingkai Pusaka: one continuous raster border, separate live copy and photos. */
export function SekarCover(p: CoverProps) {
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const photo = p.photo || p.groom || p.bride;
  const candidates = p.kind === 'berdua' ? [p.groom, p.bride] : [photo];
  const portraits = candidates.filter((src): src is string => !!src && !failedPhotos.has(src));
  const withPhoto = p.kind !== 'ornamen' && portraits.length > 0;
  const marker = rasterAsset(p.artwork, 'topDecoration');
  // Legacy coverPaper is the old Pendopo paper. Do not stack it or its canopy/footer here.
  const paper = culturalRevisionSource(p.artwork, 'stationeryBackground');
  const divider = culturalRevisionSource(p.artwork, 'stationeryDivider');
  const style = { '--sekar-paper': `url("${paper?.url}")` } as CSSProperties;
  const Tag = p.decorative ? 'span' : 'button';
  return (
    <div className={styles.cover} style={style} data-cover-design="sekar-bingkai-pusaka" data-kind={p.kind}
      data-long={p.names.length > 24 ? 'true' : undefined} data-photo={withPhoto ? 'true' : 'false'} data-animated={p.animated ? 'true' : undefined}>
      <div className={styles.stack}>
        <p className={styles.kicker}>{p.kicker}</p>
        {withPhoto ? <div className={styles.portraits}>
          {portraits.map((src, i) => <figure className={styles.portrait} key={`${i}-${src}`}>
            <img className={styles.photo} src={src} alt={p.kind === 'berdua' ? `Foto mempelai ${i + 1}` : 'Foto pasangan'}
              ref={image => { if (image?.complete && image.naturalWidth === 0) setFailedPhotos(current => new Set(current).add(src)); }}
              onError={() => setFailedPhotos(current => new Set(current).add(src))} />
          </figure>)}
        </div> : marker && <img className={styles.marker} src={marker} alt="" draggable={false} onError={p.onAssetError} />}
        <div className={styles.copy}>
          <h1 className={styles.names} aria-label={p.names}>{p.names.split(/\s*&\s*/u).map((part, i) => <Fragment key={i}>
            {i > 0 && <span className={styles.amp}> &amp; </span>}<span className={styles.name}>{part}</span>
          </Fragment>)}</h1>
          {p.dateText && <p className={styles.date}>{p.dateText}</p>}
          <img className={styles.divider} src={divider?.url} alt="" draggable={false} />
          {p.guest && <div className={styles.recipient}><p className={styles.dear}>{p.guest.dear}</p><p className={styles.guest}>{p.guest.name}</p></div>}
          <Tag className={styles.action} {...(p.decorative ? {} : {type:'button' as const,onClick:p.onOpen})}>{p.openLabel}</Tag>
        </div>
      </div>
    </div>
  );
}
