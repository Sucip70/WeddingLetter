import { z } from 'zod';

export const ARTWORK_SLOTS = [
  'coverBackground', 'coverForeground', 'pageBackground', 'sectionBackground',
  'topDecoration', 'bottomDecoration', 'cornerTopLeft', 'cornerTopRight',
  'cornerBottomLeft', 'cornerBottomRight', 'divider', 'photoFrame', 'texture',
  'thumbnail', 'gateBackground', 'gateForeground', 'gateTransition', 'gateInteractive', 'cardFrame',
] as const;
export type ArtworkSlot = (typeof ARTWORK_SLOTS)[number];

export const ARTWORK_VARIANTS = ['default', 'mobile', 'desktop'] as const;
export type ArtworkVariant = (typeof ARTWORK_VARIANTS)[number];
export const ARTWORK_FALLBACK_ORNAMENTS = ['vine', 'geo', 'star8', 'lotus', 'sparkle', 'snow', 'twig', 'deco', 'lily', 'flora', 'romantic', 'botani', 'keraton', 'sakura', 'autumn', 'winter', 'lavender', 'hortensia', 'marigold'] as const;
export const ARTWORK_FALLBACK_EFFECTS = ['none', 'aurora', 'rays', 'curtain', 'scanlines', 'spotlight', 'clouds', 'halo', 'sky', 'bloom'] as const;
export const ARTWORK_FALLBACK_PARTICLES = ['petal', 'leaf', 'maple', 'snow', 'heart', 'star', 'sparkle', 'confetti', 'bubble', 'firefly', 'pixel', 'lantern', 'bat', 'coin', 'dust', 'feather', 'blossom', 'bloomflower'] as const;

export const artworkSourceSchema = z.object({
  url: z.string().max(700),
  storageKey: z.string().regex(/^templates\/[a-z0-9-]{2,80}\/v[1-9]\d*\/[a-z0-9-]+\.(webp|png|avif)$/).optional(),
  contentType: z.enum(['image/webp', 'image/png', 'image/avif']),
  width: z.number().int().min(16).max(12000),
  height: z.number().int().min(16).max(12000),
  sizeBytes: z.number().int().positive().max(12 * 1024 * 1024),
}).superRefine((source, ctx) => {
  const localOwned = /^\/themes\/[a-z0-9/-]+\.webp$/.test(source.url);
  const published = /^https?:\/\/[^\s]+$/.test(source.url) && !!source.storageKey;
  if (!localOwned && !published) ctx.addIssue({ code: 'custom', path: ['url'], message: 'URL harus aset /themes milik aplikasi atau URL storage dengan key immutable' });
});

export const artworkLayerSchema = z.object({
  default: artworkSourceSchema.optional(),
  mobile: artworkSourceSchema.optional(),
  desktop: artworkSourceSchema.optional(),
}).refine((layer) => !!(layer.default || layer.mobile || layer.desktop), 'Layer artwork harus memiliki minimal satu sumber');

const assetsShape = Object.fromEntries(ARTWORK_SLOTS.map((slot) => [slot, artworkLayerSchema.optional()])) as {
  [K in ArtworkSlot]: z.ZodOptional<typeof artworkLayerSchema>;
};

export const DEFAULT_ARTWORK_PRESENTATION = {
  backgroundFit: 'cover',
  backgroundPosition: 'center-top',
  foregroundPosition: 'bottom-center',
  foregroundMotion: 'none',
  opacity: 1,
  scale: 1,
  backgroundLayer: 0,
  decorationLayer: 1,
  foregroundLayer: 3,
  showOnOrnamentCover: true,
  showOnPhotoCover: false,
} as const;

export const artworkPresentationSchema = z.object({
  backgroundFit: z.enum(['cover', 'contain', 'fill']).default('cover'),
  backgroundPosition: z.enum(['center', 'center-top', 'center-bottom', 'left-top', 'right-top', 'left-bottom', 'right-bottom']).default('center-top'),
  foregroundPosition: z.enum(['top-center', 'bottom-center', 'center', 'left-center', 'right-center']).default('bottom-center'),
  foregroundMotion: z.enum(['none', 'breathe', 'float']).default('none'),
  opacity: z.number().min(0).max(1).default(1),
  scale: z.number().min(0.5).max(2).default(1),
  backgroundLayer: z.number().int().min(0).max(2).default(0),
  decorationLayer: z.number().int().min(1).max(3).default(1),
  foregroundLayer: z.number().int().min(3).max(5).default(3),
  showOnOrnamentCover: z.boolean().default(true),
  showOnPhotoCover: z.boolean().default(false),
});

export const artworkFallbackSchema = z.object({
  ornament: z.enum(ARTWORK_FALLBACK_ORNAMENTS).optional(),
  coverEffect: z.enum(ARTWORK_FALLBACK_EFFECTS).optional(),
  particle: z.enum(ARTWORK_FALLBACK_PARTICLES).optional(),
}).default({});

export const artworkManifestSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  designId: z.string().regex(/^[a-z0-9-]{2,80}$/),
  artworkVersion: z.number().int().positive(),
  assets: z.object(assetsShape).default({}),
  presentation: artworkPresentationSchema.default(DEFAULT_ARTWORK_PRESENTATION),
  fallback: artworkFallbackSchema,
});

export type ArtworkManifest = z.infer<typeof artworkManifestSchema>;

export function parseArtwork(value: unknown): ArtworkManifest | undefined {
  const parsed = artworkManifestSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

// Compatibility manifests for the four approved proof-of-concept packages. They intentionally use
// application-owned /public assets; every new admin publication uses immutable R2/local storage keys.
const SEASONAL: Record<string, { file: string; bgBytes: number; fgBytes: number; fgHeight: number }> = {
  'sakura-anime': { file: 'sakura-pastel', bgBytes: 112_914, fgBytes: 248_762, fgHeight: 592 },
  semi: { file: 'spring', bgBytes: 158_158, fgBytes: 340_584, fgHeight: 683 },
  gugur: { file: 'autumn', bgBytes: 282_146, fgBytes: 182_744, fgHeight: 465 },
  salju: { file: 'winter', bgBytes: 230_662, fgBytes: 274_242, fgHeight: 581 },
};

export function seasonalArtworkFor(designId: string): ArtworkManifest | undefined {
  const item = SEASONAL[designId];
  if (!item) return undefined;
  const source = (kind: 'bg' | 'fg') => ({
    url: `/themes/seasonal/${item.file}-${kind}.webp`,
    contentType: 'image/webp' as const,
    width: kind === 'bg' ? 1024 : 960,
    height: kind === 'bg' ? 1536 : item.fgHeight,
    sizeBytes: kind === 'bg' ? item.bgBytes : item.fgBytes,
  });
  return artworkManifestSchema.parse({
    schemaVersion: 1,
    designId,
    artworkVersion: 1,
    assets: {
      coverBackground: { default: source('bg') },
      coverForeground: { default: source('fg') },
    },
    presentation: {
      backgroundFit: 'cover',
      backgroundPosition: 'center-top',
      foregroundPosition: 'bottom-center',
      foregroundMotion: 'breathe',
      showOnOrnamentCover: true,
      showOnPhotoCover: false,
    },
    fallback: {},
  });
}

// Sekar Keraton: raster artwork painted by The Artist (artwork-handoff/jawa/sekar-keraton/{content,kayon}-raster), served from
// apps/web/public/themes/sekar-keraton/. Slot usage is specific to this design (sekar-keraton-cover/-sections/-gate.tsx):
//   coverBackground = page-background (cover paper)     pageBackground = page-tile (mirrored, seamless vertical tile for the body)
//   cornerTopLeft/BottomRight = carved corners          topDecoration = mini-kayon         divider = kawung divider
//   sectionBackground = card-paper-panel                cardFrame = card-frame             photoFrame = photo mount (2:3)
//   bottomDecoration = footer ornament                  gateBackground = gate-background   gateInteractive = kayon-wayang
export function sekarKeratonArtwork(): ArtworkManifest {
  const source = (file: string, width: number, height: number, sizeBytes: number) => ({
    url: `/themes/sekar-keraton/${file}.webp`,
    contentType: 'image/webp' as const,
    width,
    height,
    sizeBytes,
  });
  return artworkManifestSchema.parse({
    schemaVersion: 1,
    designId: 'jawa-sekar-keraton',
    artworkVersion: 2,
    assets: {
      coverBackground: { default: source('page-background', 1024, 1536, 236_000) },
      pageBackground: { default: source('page-tile', 1024, 3072, 439_000) },
      cornerTopLeft: { default: source('corner-top-left', 1155, 1048, 149_000) },
      cornerBottomRight: { default: source('corner-bottom-right', 1155, 1048, 149_000) },
      divider: { default: source('divider-kawung', 2208, 364, 108_000) },
      topDecoration: { default: source('mini-kayon', 838, 1483, 232_000) },
      sectionBackground: { default: source('card-paper-panel', 1000, 1250, 215_000) },
      cardFrame: { default: source('card-frame', 1101, 1434, 135_000) },
      photoFrame: { default: source('photo-frame', 1014, 1496, 126_000) },
      bottomDecoration: { default: source('footer-ornament', 2234, 372, 109_000) },
      gateBackground: { default: source('gate-background', 1024, 1536, 332_000) },
      gateInteractive: { default: source('kayon-wayang', 1024, 1536, 454_000) },
    },
    presentation: {
      backgroundFit: 'cover',
      backgroundPosition: 'center',
      foregroundPosition: 'center',
      foregroundMotion: 'none',
      opacity: 1,
      scale: 1,
      backgroundLayer: 0,
      decorationLayer: 2,
      foregroundLayer: 3,
      showOnOrnamentCover: true,
      showOnPhotoCover: true,
    },
    fallback: { ornament: 'keraton', coverEffect: 'none', particle: 'dust' },
  });
}
