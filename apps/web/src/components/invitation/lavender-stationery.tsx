'use client';

import type { ArtworkManifest } from '@/lib/types';
import { stationeryArtworkVars } from './cultural-artwork';
import { BotanicalCover } from './botanical-cover';

/* eslint-disable @next/next/no-img-element */
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CoverKind } from '@/lib/cover-layouts';
import type { CoverProps } from './raster-cover';
import type { GatePhase } from './gates';
import type { OrnamentSet } from './ornaments';
import styles from './lavender-stationery.module.css';
import type { BotanicalDesign } from './wisteria-stationery';

type StationeryDesign = BotanicalDesign | 'marigold' | 'garden';

export const LAVENDER_CANVAS = { width: 390, height: 390 * 956 / 440 };
export function lavenderCanvasSize(width: number, height: number, thumbnail = false) {
  const scale = width / LAVENDER_CANVAS.width;
  return { scale, height: thumbnail && scale > 0 && height > 0 ? height / scale : LAVENDER_CANVAS.height };
}
export const lavenderRootClass = styles.root;
export const lavenderRootVars = stationeryArtworkVars('lavender', 'lavender');
/** Keep the approved default ink; existing palette choices still change live accents and type. */
export function lavenderPalette(primary = '#62446e', text = '#49344f'): CSSProperties {
  const accent = primary.toLowerCase() === '#6b3fa0' ? '#62446e' : primary;
  const ink = text.toLowerCase() === '#2d2147' ? '#49344f' : text;
  return { '--p': accent, '--s': '#b4a17e', '--bg': '#f8f3eb', '--tx': ink, '--lavender-accent': accent, '--lavender-ink': ink, color: ink, backgroundColor: '#f8f3eb' } as CSSProperties;
}
export function LavenderDivider({ className = '' }: { className?: string }) {
  return <div className={`${styles.rule} ${className}`} aria-hidden="true"><span>✦</span></div>;
}
export const LAVENDER_ORNAMENTS: OrnamentSet = {
  Corner: () => <Fragment />,
  Divider: LavenderDivider,
  Sprig: () => <Fragment />,
};

/** The host reserves this canvas's aspect ratio; only the main invitation scrolls. */
function Canvas({ children, gate = false, opening = false, thumbnail = false, design = 'lavender', artwork, ...data }: {
  children: ReactNode; gate?: boolean; opening?: boolean; thumbnail?: boolean; artwork?: ArtworkManifest;
  design?: StationeryDesign;
  'data-photo'?: string; 'data-long'?: string; 'data-kind'?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: LAVENDER_CANVAS.height });
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const resize = () => {
      setFit(lavenderCanvasSize(el.clientWidth, el.clientHeight, thumbnail));
    };
    resize(); const observer = new ResizeObserver(resize); observer.observe(el);
    return () => observer.disconnect();
  }, [thumbnail]);
  return <div ref={root} className={`${styles.host} ${gate ? styles.gateHost : ''}`} data-lavender={gate ? 'gate' : 'cover'} data-stationery={design} data-thumbnail={thumbnail || undefined} data-opening={opening || undefined} {...data}>
    <div className={styles.extent} style={{ height: fit.height * fit.scale }}>
      <div className={`${styles.canvas} ${gate ? styles.letter : ''}`} style={{ ...stationeryArtworkVars(design, 'lavender', artwork), '--composition-scale': fit.scale, width: 390, height: fit.height, transform: `scale(${fit.scale})` } as CSSProperties}>
        {gate && (design === 'wisteria' || design === 'garden') && <div aria-hidden="true"><div className={styles.panelLeft} /><div className={styles.panelRight} /></div>}
        {children}</div>
    </div>
  </div>;
}

export function LavenderPortrait({ src, label, className = '' }: { src?: string; label: string; className?: string }) {
  const [failed, setFailed] = useState<string>();
  if (!src || failed === src) return null;
  return <figure className={`${styles.portrait} ${className}`}>
    <img src={src} alt={label} ref={image => { if (image?.complete && image.naturalWidth === 0) setFailed(src); }} onError={() => setFailed(src)} />
  </figure>;
}

type LavenderCoverProps = Omit<CoverProps, 'kind' | 'artwork'> & { kind: CoverKind; artwork?: ArtworkManifest; thumbnail?: boolean; design?: StationeryDesign };
export function LavenderCover(p: LavenderCoverProps) {
  return <BotanicalCover {...p} />;
}

export function LavenderGate({ names, kicker, dateText, guest, phase, onOpen, design = 'lavender', artwork }: {
  names: string; kicker: string; dateText?: string; guest: string | null; phase: GatePhase; onOpen: () => void; artwork?: ArtworkManifest;
  design?: StationeryDesign;
}) {
  return <Canvas artwork={artwork} design={design} gate opening={phase === 'opening'} data-long={String(names.length > 24)}>
    <div className={styles.gateTop}><p className={styles.label}>{kicker}</p>
      <h1 className={styles.gateNames} aria-label={names}>{names.split(/\s*&\s*/u).map((part, i) => <Fragment key={i}>{i > 0 && <span className={styles.amp}>&amp;</span>}<span>{part}</span></Fragment>)}</h1>
      {dateText && <p className={styles.date}>{dateText}</p>}
    </div>
    {design !== 'marigold' && design !== 'garden' && <button type="button" className={styles.seal} aria-label={`Buka undangan ${names}`} onClick={onOpen} disabled={phase !== 'closed'} />}
    <div className={styles.gateBottom}><p className={styles.dear}>Kepada Yth.</p><p className={styles.guest}>{guest || 'Bapak/Ibu/Saudara/i'}</p>{design === 'marigold' || design === 'garden' ? <button type="button" className={styles.action} aria-label={`Buka undangan ${names}`} onClick={onOpen} disabled={phase !== 'closed'}>Buka Undangan</button> : <p className={styles.hint}>{design === 'wisteria' ? 'Ketuk pengait untuk membuka' : 'Ketuk segel untuk membuka'}</p>}</div>
  </Canvas>;
}

export function LavenderBlock({ title, children }: { title: string; children: ReactNode }) {
  return <section className={`${styles.section} wl-block`}><header className={styles.sectionHeading}><h2>{title}</h2><LavenderDivider /></header><div className={styles.sectionBody}>{children}</div></section>;
}

export function LavenderClosing({ names, dateText, children, thanks }: { names: string; dateText: string; children?: ReactNode; thanks: string }) {
  return <div className={styles.closing}><LavenderDivider /><h2>{thanks}</h2><p className={styles.names}>{names}</p>{dateText && <p className={styles.date}>{dateText}</p>}{children}</div>;
}
