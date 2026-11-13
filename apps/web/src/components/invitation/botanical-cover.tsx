'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { CoverKind } from '@/lib/cover-layouts';
import type { CoverProps } from './raster-cover';
import { CoverLayout } from './cover';
import { culturalRevisionSource } from './cultural-artwork';
import type { OrnamentSet } from './ornaments';
import styles from './botanical-cover.module.css';

export type BotanicalCoverProps = Omit<CoverProps, 'kind' | 'artwork'> & {
  kind: CoverKind; artwork?: ArtworkManifest; thumbnail?: boolean; design?: string;
};

// Fit the shared 390x700 composition inside short phones and catalog cards,
// while extending the background to the full viewport (never letterbox it).
export function botanicalCoverSize(width: number, height: number) {
  const scale = width > 0 && height > 0 ? Math.min(width / 390, height / 700) : 1;
  return { scale, width: width > 0 ? width / scale : 390, height: height > 0 ? height / scale : 700 };
}

const emptyOrnaments: OrnamentSet = { Corner: () => <></>, Sprig: () => <></>, Divider: () => <></> };

export function BotanicalCover(p: BotanicalCoverProps) {
  const design = p.design ?? 'lavender';
  const host = useRef<HTMLDivElement>(null);
  const [failedPhotos, setFailedPhotos] = useState<Set<string>>(() => new Set());
  const [fit, setFit] = useState(() => botanicalCoverSize(390, 700));
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const resize = () => setFit(botanicalCoverSize(el.clientWidth, el.clientHeight));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const manifest = p.artwork?.designId === design ? p.artwork : { designId: design, assets: {} } as ArtworkManifest;
  const paper = culturalRevisionSource(manifest, 'stationeryBackground')?.url;
  const available = (src?: string) => src && !failedPhotos.has(src) ? src : undefined;
  const photo = available(p.photo), groom = available(p.groom), bride = available(p.bride);
  const hasPhoto = !!(photo || groom || bride) && p.kind !== 'ornamen';
  const kind = hasPhoto ? p.kind : 'ornamen';
  const background = <div className={styles.paper} style={paper ? { backgroundImage: `url("${paper}")` } : undefined} aria-hidden="true" />;
  const Tag = p.decorative ? 'span' : 'button';
  return <div ref={host} className={styles.host} data-botanical-cover={design} data-stationery={design}
    onErrorCapture={(event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      const src = event.target.getAttribute('src');
      if (src && [p.photo, p.groom, p.bride].includes(src)) setFailedPhotos((current) => new Set(current).add(src));
    }}
    data-lavender={design !== 'hortensia' ? 'cover' : undefined} data-hortensia={design === 'hortensia' ? 'cover' : undefined}
    data-kind={kind} data-photo={String(hasPhoto)} data-long={String(p.names.length > 24)} data-thumbnail={p.thumbnail || undefined}>
    <div className={styles.composition} style={{ width: fit.width, height: fit.height, transform: `scale(${fit.scale})`, '--r': '4px' } as CSSProperties}>
      {kind === 'ornamen' ? <>{background}<div className={styles.ornamentCopy}>
        <p className={styles.kicker}>{p.kicker}</p>
        <h1 className="wl-name-text" style={{ fontSize: p.names.length > 32 ? '2.3rem' : '3rem' }}>{p.names}</h1>
        {p.dateText && <p className={styles.date}>{p.dateText}</p>}
        {p.guest && <div className={styles.recipient}><p>{p.guest.dear}</p><strong>{p.guest.name}</strong></div>}
        <Tag className={styles.action} {...(p.decorative ? {} : { type: 'button' as const, onClick: p.onOpen })}>{p.openLabel}</Tag>
      </div></> : <CoverLayout kind={kind} photo={photo || groom || bride} groom={groom} bride={bride}
        names={p.names} groomName="" brideName="" kicker={p.kicker} dateText={p.dateText} guest={p.guest} openLabel={p.openLabel}
        onOpen={p.onOpen} decorative={p.decorative} animated={false} premium={false}
        heading={{ family: 'var(--font-cormorant), Georgia, serif', size: p.names.length > 32 ? '2.4rem' : '3.2rem', weight: 500 }}
        base={background} decor={null} corners={null} orn={emptyOrnaments} frame="polaroid" photoRadius="2px" buttonRadius="4px"
        letterFont="var(--font-cormorant), Georgia, serif" layerHeight={fit.height} />}
    </div>
  </div>;
}
