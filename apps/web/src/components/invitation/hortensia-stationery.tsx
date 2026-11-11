'use client';

/* eslint-disable @next/next/no-img-element */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CoverKind } from '@/lib/cover-layouts';
import type { CoverProps } from './raster-cover';
import type { GatePhase } from './gates';
import paper from './assets/hortensia-cover.webp';
import letter from './assets/hortensia-gate.webp';
import styles from './hortensia-stationery.module.css';

export const HORTENSIA_CANVAS = { width: 390, height: 390 * 956 / 440 };
export const hortensiaRootClass = styles.root;
export const hortensiaRootVars = { '--hortensia-paper': `url("${paper.src}")` } as CSSProperties;
export function hortensiaPalette(primary = '#12494d', text = '#103c40'): CSSProperties {
  const accent = primary.toLowerCase() === '#0f7a8c' ? '#12494d' : primary;
  const ink = text.toLowerCase() === '#0f2f3a' ? '#103c40' : text;
  return { '--p': accent, '--s': '#b59f72', '--bg': '#f8f3eb', '--tx': ink, '--hortensia-accent': accent, '--hortensia-ink': ink, color: ink, backgroundColor: '#f8f3eb' } as CSSProperties;
}
export function hortensiaCanvasSize(width: number, height: number, thumbnail = false) {
  const scale = width / HORTENSIA_CANVAS.width;
  return { scale, height: thumbnail && scale > 0 && height > 0 ? height / scale : HORTENSIA_CANVAS.height };
}
function Canvas({ children, gate = false, opening = false, thumbnail = false, ...data }: {
  children: ReactNode; gate?: boolean; opening?: boolean; thumbnail?: boolean;
  'data-photo'?: string; 'data-long'?: string; 'data-kind'?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: HORTENSIA_CANVAS.height });
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const resize = () => setFit(hortensiaCanvasSize(el.clientWidth, el.clientHeight, thumbnail));
    resize(); const observer = new ResizeObserver(resize); observer.observe(el);
    return () => observer.disconnect();
  }, [thumbnail]);
  return <div ref={root} className={`${styles.host} ${gate ? styles.gateHost : ''}`} data-hortensia={gate ? 'gate' : 'cover'} data-thumbnail={thumbnail || undefined} data-opening={opening || undefined} {...data}>
    <div className={styles.extent} style={{ height: fit.height * fit.scale }}><div className={`${styles.canvas} ${gate ? styles.letter : ''}`} style={{ ...hortensiaRootVars, '--hortensia-letter': `url("${letter.src}")`, '--composition-scale': fit.scale, width: 390, height: fit.height, transform: `scale(${fit.scale})` } as CSSProperties}>{children}</div></div>
  </div>;
}
export function HortensiaDivider() { return <div className={styles.divider} aria-hidden="true" />; }
export function HortensiaPortrait({ src, label }: { src?: string; label: string }) {
  const [failed, setFailed] = useState<string>();
  if (!src || failed === src) return null;
  return <figure className={styles.portrait}><img src={src} alt={label} ref={image => { if (image?.complete && image.naturalWidth === 0) setFailed(src); }} onError={() => setFailed(src)} /></figure>;
}
type Props = Omit<CoverProps, 'kind' | 'artwork'> & { kind: CoverKind; thumbnail?: boolean; design?: string };
export function HortensiaCover(p: Props) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const candidates = p.kind === 'berdua' && (p.groom || p.bride) ? [p.groom, p.bride] : [p.photo || p.groom || p.bride];
  const photos = candidates.filter((src): src is string => !!src && !failed.has(src));
  const withPhoto = p.kind !== 'ornamen' && photos.length > 0;
  const Tag = p.decorative ? 'span' : 'button';
  return <Canvas thumbnail={p.thumbnail} data-kind={p.kind} data-photo={String(withPhoto)} data-long={String(p.names.length > 24)}><div className={styles.stack}>
    <p className={styles.kicker}>{p.kicker}</p>
    {withPhoto && <div className={styles.portraits}>{photos.map((src, i) => <figure className={styles.portrait} key={`${i}-${src}`}><img src={src} alt={p.kind === 'berdua' ? `Foto mempelai ${i + 1}` : 'Foto pasangan'} ref={image => { if (image?.complete && image.naturalWidth === 0) setFailed(current => new Set(current).add(src)); }} onError={() => setFailed(current => new Set(current).add(src))} /></figure>)}</div>}
    <div className={styles.copy}><h1 className={styles.names}>{p.names}</h1>{p.dateText && <p className={styles.date}>{p.dateText}</p>}<HortensiaDivider />
      {p.guest && <div className={styles.recipient}><p>{p.guest.dear}</p><strong>{p.guest.name}</strong></div>}
      <Tag className={styles.action} {...(p.decorative ? {} : { type: 'button' as const, onClick: p.onOpen })}>{p.openLabel}</Tag>
    </div></div></Canvas>;
}
export function HortensiaGate({ names, kicker, dateText, guest, phase, onOpen }: {
  names: string; kicker: string; dateText?: string; guest: string | null; phase: GatePhase; onOpen: () => void;
}) {
  return <Canvas gate opening={phase === 'opening'} data-long={String(names.length > 24)}>
    <div className={styles.gateCard}><p className={styles.kicker}>{kicker}</p><h1 className={styles.names}>{names}</h1>{dateText && <p className={styles.date}>{dateText}</p>}<HortensiaDivider /></div>
    <div className={`${styles.recipient} ${styles.gateRecipient}`}><p>Kepada Yth.</p><strong>{guest || 'Bapak/Ibu/Saudara/i'}</strong></div>
    <button type="button" className={styles.clasp} aria-label={`Buka undangan ${names}`} onClick={onOpen} disabled={phase !== 'closed'} />
    <p className={styles.hint}>Ketuk untuk membuka</p>
  </Canvas>;
}
export function HortensiaBlock({ title, children }: { title: string; children: ReactNode }) {
  return <section className={`${styles.section} wl-block`}><header className={styles.sectionHeading}><h2>{title}</h2><HortensiaDivider /></header><div className={styles.sectionBody}>{children}</div></section>;
}
export function HortensiaClosing({ names, dateText, children, thanks }: { names: string; dateText: string; children?: ReactNode; thanks: string }) {
  return <div className={styles.closing}><HortensiaDivider /><h2>{thanks}</h2><p className={styles.names}>{names}</p>{dateText && <p className={styles.date}>{dateText}</p>}{children}</div>;
}
