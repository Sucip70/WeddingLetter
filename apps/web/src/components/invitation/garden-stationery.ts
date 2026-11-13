import { stationeryArtworkVars } from './cultural-artwork';
import type { CSSProperties } from 'react';

export const gardenArtworkVars = stationeryArtworkVars('garden');
export function gardenPalette(primary = '#284d3b', text = '#264536'): CSSProperties {
  const accent = primary.toLowerCase() === '#4a6b2f' ? '#284d3b' : primary;
  const ink = text.toLowerCase() === '#2a3722' ? '#264536' : text;
  return { '--p': accent, '--s': '#a58e5c', '--bg': '#f5f1e6', '--tx': ink, '--lavender-accent': accent, '--lavender-ink': ink, color: ink, backgroundColor: '#f5f1e6' } as CSSProperties;
}
