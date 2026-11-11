export type TemplateSamplePhotoSlot = 'cover' | 'groom' | 'bride' | 'gallery1' | 'gallery2' | 'gallery3' | 'gallery4';
export type TemplateSamplePhotos = Partial<Record<TemplateSamplePhotoSlot, string>>;

const SEKAR_KERATON_DESIGN_ID = 'jawa-sekar-keraton';
const SEKAR_KERATON_SAMPLE_ROOT = '/samples/sekar-keraton';

export const PUSAKO_MINANG_SAMPLE_PHOTOS: Readonly<TemplateSamplePhotos> = {
  cover: '/samples/pusako-minang/cover.webp',
  groom: '/samples/pusako-minang/groom.webp',
  bride: '/samples/pusako-minang/bride.webp',
  gallery1: '/samples/pusako-minang/gallery-walking.webp',
  gallery2: '/samples/pusako-minang/gallery-romantic.webp',
};

export const SEKAR_KERATON_SAMPLE_PHOTOS: Readonly<TemplateSamplePhotos> = {
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
  const builtIn = layout.artwork?.designId === SEKAR_KERATON_DESIGN_ID ? SEKAR_KERATON_SAMPLE_PHOTOS
    : layout.artwork?.designId === 'pusako-minang' ? PUSAKO_MINANG_SAMPLE_PHOTOS : {};
  return { ...globalPhotos, ...builtIn, ...layout.samplePhotos };
}
