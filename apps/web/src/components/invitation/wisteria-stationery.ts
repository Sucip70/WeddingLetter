import { stationeryArtworkVars } from './cultural-artwork';
import type { CSSProperties } from 'react';

export type BotanicalDesign = 'lavender' | 'wisteria';
export const wisteriaArtworkVars = stationeryArtworkVars('wisteria');
export function wisteriaPalette(primary = '#284f7d', text = '#213c62'): CSSProperties {
  // Old Wisteria used the generic Hortensia palette; map its default to the approved ink.
  const accent = primary.toLowerCase() === '#3f5fb0' ? '#284f7d' : primary;
  const ink = text.toLowerCase() === '#1a2547' ? '#213c62' : text;
  return { '--p': accent, '--s': '#9db2c7', '--bg': '#f5f6f5', '--tx': ink, '--lavender-accent': accent, '--lavender-ink': ink, color: ink, backgroundColor: '#f5f6f5' } as CSSProperties;
}
