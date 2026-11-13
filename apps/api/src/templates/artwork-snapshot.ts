import { artworkManifestSchema } from './artwork.js';
import type { TemplateLayout } from './layout.js';

const BOTANICAL_DESIGNS = new Set(['garden', 'lavender', 'wisteria', 'marigold', 'hortensia']);

/** Read-time compatibility for purchases made before botanical artwork was
 * published. Never replace an existing artwork snapshot or other paid settings. */
export function withLegacyBotanicalArtwork(snapshot: TemplateLayout, templateLayout: unknown): TemplateLayout {
  if (snapshot.artwork) return snapshot;
  const designId = snapshot.theme?.motif ?? snapshot.theme?.preset;
  if (!BOTANICAL_DESIGNS.has(designId)) return snapshot;
  if (!templateLayout || typeof templateLayout !== 'object' || Array.isArray(templateLayout)) return snapshot;
  const result = artworkManifestSchema.safeParse((templateLayout as Record<string, unknown>).artwork);
  if (!result.success || result.data.designId !== designId) return snapshot;
  return { ...snapshot, artwork: result.data };
}
