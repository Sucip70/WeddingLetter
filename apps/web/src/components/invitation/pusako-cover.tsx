'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { CoverProps } from './raster-cover';
import { rasterAsset } from './raster-theme';
import paper from './assets/pusako-cover-paper.webp';
import divider from './assets/pusako-cover-divider.webp';
import styles from './pusako-cover.module.css';

export const PUSAKO_CANVAS = { width: 390, height: 390 * 956 / 440 };
export function isPusakoStationery(designId: string | undefined, kind: string) {
  return designId === 'pusako-minang' && ['ornamen', 'bingkai', 'berdua'].includes(kind);
}

/** One width-scaled canvas; its host owns the height and the invitation owns scrolling. */
export function PusakoCover(p: CoverProps) {
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const fit = () => setScale(element.clientWidth / PUSAKO_CANVAS.width);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const photo = p.photo || p.groom || p.bride;
  const candidates = p.kind === 'berdua' ? [p.groom, p.bride] : [photo];
  const portraits = candidates.filter((src): src is string => !!src && !failedPhotos.has(src));
  const withPhoto = p.kind !== 'ornamen' && portraits.length > 0;
  const marker = rasterAsset(p.artwork, 'topDecoration');
  const Tag = p.decorative ? 'span' : 'button';
  const style = {
    '--pusako-paper': `url("${paper.src}")`, '--composition-scale': scale,
    width: PUSAKO_CANVAS.width, height: PUSAKO_CANVAS.height, transform: `scale(${scale})`,
  } as CSSProperties;
  return <div ref={root} className={styles.cover} data-cover-design="pusako-songket" data-kind={p.kind}
    data-long={p.names.length > 24 ? 'true' : undefined} data-photo={withPhoto ? 'true' : 'false'}>
    <div className={styles.composition} style={style}>
      <div className={styles.stack}>
        <p className={styles.kicker}>{p.kicker}</p>
        {withPhoto ? <div className={styles.portraits}>{portraits.map((src, i) => <figure className={styles.portrait} key={`${i}-${src}`}>
          <img className={styles.photo} src={src} alt={p.kind === 'berdua' ? `Foto mempelai ${i + 1}` : 'Foto pasangan'}
            ref={image => { if (image?.complete && image.naturalWidth === 0) setFailedPhotos(current => new Set(current).add(src)); }}
            onError={() => setFailedPhotos(current => new Set(current).add(src))} />
        </figure>)}</div> : marker && <img className={styles.marker} src={marker} alt="" draggable={false} onError={p.onAssetError} />}
        <div className={styles.copy}>
          <h1 className={styles.names} aria-label={p.names}>{p.names.split(/\s*&\s*/u).map((part, i) => <Fragment key={i}>
            {i > 0 && <span className={styles.amp}> &amp; </span>}<span className={styles.name}>{part}</span>
          </Fragment>)}</h1>
          {p.dateText && <p className={styles.date}>{p.dateText}</p>}
          <img className={styles.divider} src={divider.src} alt="" draggable={false} />
          {p.guest && <div className={styles.recipient}><p className={styles.dear}>{p.guest.dear}</p><p className={styles.guest}>{p.guest.name}</p></div>}
          <Tag className={styles.action} {...(p.decorative ? {} : { type: 'button' as const, onClick: p.onOpen })}>{p.openLabel}</Tag>
        </div>
      </div>
    </div>
  </div>;
}
