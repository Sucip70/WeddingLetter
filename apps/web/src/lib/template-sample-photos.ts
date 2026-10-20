export type TemplateSamplePhotoSlot = 'cover' | 'groom' | 'bride' | 'gallery1' | 'gallery2';
export type TemplateSamplePhotos = Partial<Record<TemplateSamplePhotoSlot, string>>;

const SEKAR_KERATON_DESIGN_ID = 'jawa-sekar-keraton';
const SEKAR_KERATON_SAMPLE_ROOT = '/samples/sekar-keraton';

export const SEKAR_KERATON_SAMPLE_PHOTOS: Readonly<Required<TemplateSamplePhotos>> = {
  cover: `${SEKAR_KERATON_SAMPLE_ROOT}/cover.webp`,
  groom: `${SEKAR_KERATON_SAMPLE_ROOT}/groom-v2.webp`,
  bride: `${SEKAR_KERATON_SAMPLE_ROOT}/bride-v2.webp`,
  gallery1: `${SEKAR_KERATON_SAMPLE_ROOT}/gallery-walking.webp`,
  gallery2: `${SEKAR_KERATON_SAMPLE_ROOT}/gallery-romantic.webp`,
};

type SamplePhotoLayout = {
  artwork?: { designId: string };
  samplePhotos?: TemplateSamplePhotos;
};

/** Resolve preview-only photos without changing customer invitation media. */
export function resolveTemplateSamplePhotos(
  layout: SamplePhotoLayout,
  globalPhotos: Record<string, string> = {},
): Record<string, string> {
  const builtIn = layout.artwork?.designId === SEKAR_KERATON_DESIGN_ID ? SEKAR_KERATON_SAMPLE_PHOTOS : {};
  // Sekar Keraton has an approved, internally consistent pre-wedding set. Keep it
  // authoritative for previews so stale per-template/R2 demo photos cannot replace it.
  return { ...globalPhotos, ...layout.samplePhotos, ...builtIn };
}
