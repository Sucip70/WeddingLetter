import type { ArtworkManifest, ArtworkSlot } from '@/lib/types';
import { rasterAsset } from './raster-theme';

export const PUSAKO_LETTER_REVISION = 'surat-bersegel-01';
const ROOT = `/themes/pusako-minang/${PUSAKO_LETTER_REVISION}`;

const LAYERS = {
  cloth: ['gateBackground', 'gate-tile', 'gate-cloth'],
  card: ['cardFrame', 'info-card', 'letter-card'],
  left: ['gateTransition', 'gate-post-left', 'post-left'],
  right: ['gateForeground', 'gate-post-right', 'post-right'],
  seal: ['gateInteractive', 'gate-gonjong', 'gonjong-seal'],
  divider: ['divider', 'divider', 'gold-divider'],
  foundation: ['bottomDecoration', 'footer', 'gold-foundation'],
} as const satisfies Record<string, readonly [ArtworkSlot, string, string]>;

/** Optimize the bundled approved raster set, without replacing a custom/published CDN source. */
export function pusakoLetterAssets(artwork: ArtworkManifest) {
  return Object.fromEntries(Object.entries(LAYERS).map(([key, [slot, original, file]]) => {
    const source = rasterAsset(artwork, slot);
    const bundled = `/themes/pusako-minang/${original}.webp`;
    return [key, !source || source === bundled ? `${ROOT}/${file}.webp` : source];
  })) as Record<keyof typeof LAYERS, string>;
}

export function pusakoLetterNames(names: string) {
  const clean = names.trim().replace(/\s+/gu, ' ');
  const parts = clean.split(/\s*&\s*/u);
  return { text: clean, parts, long: clean.length > 24 };
}

export const pusakoLetterRecipient = (guest: string | null) => guest?.trim() || 'Bapak/Ibu/Saudara/i';
