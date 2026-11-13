import marigoldSample from '../../public/samples/marigold/manifest.json';
import wisteriaSample from '../../public/samples/wisteria/manifest.json';
import gardenSample from '../../public/samples/garden/manifest.json';
import hortensiaSample from '../../public/samples/hortensia/manifest.json';
import lavenderSample from '../../public/samples/lavender/manifest.json';
import sekarKeraton from '../../public/samples/sekar-keraton/manifest.json';
import pusakoMinang from '../../public/samples/pusako-minang/manifest.json';
import horasNauli from '../../public/samples/horas-nauli/manifest.json';
import pawiwahanAgung from '../../public/samples/pawiwahan-agung/manifest.json';
import hongXi from '../../public/samples/hong-xi/manifest.json';
import noorENikah from '../../public/samples/noor-e-nikah/manifest.json';
import vivahaRani from '../../public/samples/vivaha-rani/manifest.json';

export type TemplateSamplePhotoSlot = 'cover' | 'groom' | 'bride' | 'gallery1' | 'gallery2' | 'gallery3' | 'gallery4';
export type TemplateSamplePhotos = Partial<Record<TemplateSamplePhotoSlot, string>>;

export const PUSAKO_MINANG_SAMPLE_PHOTOS: Readonly<TemplateSamplePhotos> = pusakoMinang.samplePhotos;
export const SEKAR_KERATON_SAMPLE_PHOTOS: Readonly<TemplateSamplePhotos> = sekarKeraton.samplePhotos;

const SAMPLE_PHOTOS: Record<string, Readonly<TemplateSamplePhotos>> = Object.fromEntries(
  [sekarKeraton, pusakoMinang, horasNauli, pawiwahanAgung, hongXi, noorENikah, vivahaRani, lavenderSample, hortensiaSample, gardenSample, wisteriaSample, marigoldSample]
    .map((manifest) => [manifest.designId, manifest.samplePhotos]),
);

type SamplePhotoLayout = {
  artwork?: { designId: string };
  theme?: { motif?: string; preset: string };
  samplePhotos?: TemplateSamplePhotos;
};

/** Resolve preview-only photos without changing customer invitation media. */
export function resolveTemplateSamplePhotos(
  layout: SamplePhotoLayout,
  globalPhotos: Record<string, string> = {},
): Record<string, string> {
  const designId = layout.artwork?.designId ?? layout.theme?.motif ?? layout.theme?.preset;
  const builtIn = SAMPLE_PHOTOS[designId ?? ''] ?? {};
  return { ...globalPhotos, ...builtIn, ...layout.samplePhotos };
}
