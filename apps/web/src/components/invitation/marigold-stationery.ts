import type { CSSProperties } from 'react';
import paper from './assets/marigold-cover.webp';
import gate from './assets/marigold-gate.webp';

export const marigoldArtworkVars = { '--lavender-paper': `url("${paper.src}")`, '--lavender-letter': `url("${gate.src}")` } as CSSProperties;
export function marigoldPalette(primary = '#9c3e1e', text = '#552810'): CSSProperties {
  const accent = primary.toLowerCase() === '#b8500f' ? '#9c3e1e' : primary;
  const ink = text.toLowerCase() === '#4a2410' ? '#552810' : text;
  return { '--p': accent, '--s': '#b47943', '--bg': '#fbf3e6', '--tx': ink, '--lavender-accent': accent, '--lavender-ink': ink, color: ink, backgroundColor: '#fbf3e6' } as CSSProperties;
}
