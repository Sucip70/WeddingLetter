'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { Theme } from '@/lib/types';
import type { CoverProps } from './raster-cover';
import { RasterCover } from './raster-cover';
import { Gate } from './gates';
import { HEADING, motifFor } from './motifs';
import styles from './cultural-template-thumb.module.css';

const CULTURAL_DESIGNS = new Set([
  'jawa-sekar-keraton', 'pusako-minang', 'horas-nauli', 'pawiwahan-agung',
  'hong-xi', 'noor-e-nikah', 'vivaha-rani',
]);

/** These catalog images must not override the live invitation with obsolete illustration exports. */
export function usesLiveCulturalThumbnail(designId: string | undefined, theme: Theme) {
  return !!designId && CULTURAL_DESIGNS.has(designId) && designId === (theme.motif || theme.preset);
}

/** Same closed gate/cover as the invitation, rendered at phone size and scaled as one unit. */
export function CulturalTemplateThumb({ theme, className = '', ...cover }: {
  theme: Theme;
  className?: string;
} & Omit<CoverProps, 'onOpen' | 'decorative' | 'animated'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, height: 810 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const scale = el.clientWidth / 390 || 1;
      setBox({ scale, height: el.clientHeight / scale || 810 });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const gate = theme.gate && theme.gate !== 'none' ? theme.gate : null;
  const motif = motifFor(theme.motif || theme.preset);
  return <div ref={ref} className={`${styles.thumbnail} ${className}`} aria-hidden="true" inert data-cultural-thumbnail={gate ? 'gate' : 'cover'}>
    <div className={styles.screen} style={{ width:390, height:box.height, transform:`scale(${box.scale})`, background:theme.background }}>
      {gate ? <Gate kind={gate} phase="closed" embedded names={cover.names} kicker={cover.kicker}
        guest={cover.guest?.name ?? null} dateText={cover.dateText} artwork={cover.artwork}
        pattern={motif.pattern} motif={theme.motif || theme.preset} headingFamily={(HEADING[theme.headingFont] ?? HEADING.serif).family}
        onOpen={() => undefined} /> : <RasterCover {...cover} animated={false} decorative />}
    </div>
  </div>;
}
