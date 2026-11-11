import revisions from '../../../public/themes/cultural-revisions.json';
import type { ArtworkManifest, ArtworkSlot, ArtworkSource } from '@/lib/types';
import type { CSSProperties } from 'react';

const defaults = revisions.designs as Record<string, Partial<Record<ArtworkSlot, ArtworkSource>>>;

export function stationeryArtworkVars(designId: string, prefix = 'lavender', artwork?: ArtworkManifest): CSSProperties {
  const manifest = artwork?.designId === designId ? artwork : { designId, assets: {} } as ArtworkManifest;
  return {
    [`--${prefix}-paper`]: `url("${culturalRevisionSource(manifest, 'stationeryBackground')?.url}")`,
    [`--${prefix}-letter`]: `url("${culturalRevisionSource(manifest, 'gateDoors')?.url}")`,
  } as CSSProperties;
}

/** Published artwork wins. Local manifests preserve older snapshots and development previews. */
export function culturalRevisionSource(artwork: ArtworkManifest, slot: ArtworkSlot): ArtworkSource | undefined {
  const layer = artwork.assets[slot];
  const published = layer?.mobile ?? layer?.default ?? layer?.desktop;
  if (published) return published;
  const fallback = defaults[artwork.designId]?.[slot];
  if (!fallback?.storageKey) return fallback;
  // Older customer snapshots still identify their storage host through existing
  // layers. Reuse it so a deployed invitation does not depend on local public files.
  for (const oldLayer of Object.values(artwork.assets)) {
    for (const source of Object.values(oldLayer ?? {})) {
      if (source?.storageKey && /^https?:\/\//.test(source.url) && source.url.endsWith(`/${source.storageKey}`)) {
        const base = source.url.slice(0, -source.storageKey.length);
        return { ...fallback, url: `${base}${fallback.storageKey}` };
      }
    }
  }
  return fallback;
}
