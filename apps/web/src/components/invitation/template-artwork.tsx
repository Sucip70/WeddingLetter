import type { CSSProperties } from 'react';
import type { ArtworkLayer, ArtworkManifest, ArtworkSlot } from '@/lib/types';

type ArtworkContext = 'cover' | 'page' | 'section' | 'photo' | 'gate';

const CONTEXT_SLOTS: Record<ArtworkContext, ArtworkSlot[]> = {
  cover: ['coverBackground', 'texture', 'topDecoration', 'bottomDecoration', 'cornerTopLeft', 'cornerTopRight', 'cornerBottomLeft', 'cornerBottomRight', 'coverForeground'],
  page: ['pageBackground', 'texture'],
  section: ['sectionBackground', 'topDecoration', 'bottomDecoration', 'divider'],
  photo: ['photoFrame'],
  gate: ['gateBackground', 'gateForeground'],
};

const BACKGROUNDS = new Set<ArtworkSlot>(['coverBackground', 'pageBackground', 'sectionBackground', 'gateBackground', 'texture']);
const FOREGROUNDS = new Set<ArtworkSlot>(['coverForeground', 'gateForeground']);

const POSITIONS: Record<string, string> = {
  center: 'center', 'center-top': 'center top', 'center-bottom': 'center bottom',
  'left-top': 'left top', 'right-top': 'right top', 'left-bottom': 'left bottom', 'right-bottom': 'right bottom',
  'top-center': 'center top', 'bottom-center': 'center bottom', 'left-center': 'left center', 'right-center': 'right center',
};

function source(layer: ArtworkLayer) {
  return layer.default ?? layer.mobile ?? layer.desktop;
}

function ArtworkImage({ layer, slot, artwork, eager, reducedMotion, onAssetError }: { layer: ArtworkLayer; slot: ArtworkSlot; artwork: ArtworkManifest; eager: boolean; reducedMotion: boolean; onAssetError?: () => void }) {
  const fallback = source(layer);
  if (!fallback) return null;
  const p = artwork.presentation;
  const background = BACKGROUNDS.has(slot);
  const foreground = FOREGROUNDS.has(slot);
  const position = foreground ? p.foregroundPosition : p.backgroundPosition;
  const layerIndex = foreground ? p.foregroundLayer : background ? p.backgroundLayer : p.decorationLayer;
  const foregroundPlacement = p.foregroundPosition === 'top-center' ? 'inset-x-0 top-0' : p.foregroundPosition === 'center' ? 'inset-0 m-auto' : p.foregroundPosition === 'left-center' ? 'inset-y-0 left-0 my-auto' : p.foregroundPosition === 'right-center' ? 'inset-y-0 right-0 my-auto' : 'inset-x-0 bottom-0';
  const className = [
    'pointer-events-none absolute select-none',
    background ? 'inset-0 h-full w-full' : '',
    slot === 'topDecoration' ? 'inset-x-0 top-0 h-auto w-full' : '',
    slot === 'bottomDecoration' ? 'inset-x-0 bottom-0 h-auto w-full' : '',
    foreground ? `${foregroundPlacement} h-auto w-full` : '',
    slot === 'photoFrame' ? 'inset-0 h-full w-full object-contain' : '',
    slot === 'divider' ? 'bottom-0 left-1/2 h-auto w-2/3 -translate-x-1/2' : '',
    slot === 'cornerTopLeft' ? 'left-0 top-0 h-auto w-1/3' : '',
    slot === 'cornerTopRight' ? 'right-0 top-0 h-auto w-1/3' : '',
    slot === 'cornerBottomLeft' ? 'bottom-0 left-0 h-auto w-1/3' : '',
    slot === 'cornerBottomRight' ? 'bottom-0 right-0 h-auto w-1/3' : '',
    !reducedMotion && foreground && p.foregroundMotion !== 'none' ? `wl-art-${p.foregroundMotion}` : '',
  ].filter(Boolean).join(' ');
  const style: CSSProperties = {
    zIndex: layerIndex,
    opacity: p.opacity,
    objectFit: background ? p.backgroundFit : 'contain',
    objectPosition: POSITIONS[position] ?? 'center',
    scale: !background && p.scale !== 1 ? String(p.scale) : undefined,
  };
  return (
    <picture>
      {layer.desktop && <source media="(min-width: 768px)" srcSet={layer.desktop.url} />}
      {layer.mobile && <source media="(max-width: 767px)" srcSet={layer.mobile.url} />}
      <img
        src={fallback.url}
        alt=""
        width={fallback.width}
        height={fallback.height}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={style}
        onError={(event) => { event.currentTarget.style.display = 'none'; onAssetError?.(); }}
      />
    </picture>
  );
}

export function TemplateArtwork({ artwork, context, hasUserPhoto = false, reducedMotion = false, onAssetError }: {
  artwork?: ArtworkManifest;
  context: ArtworkContext;
  hasUserPhoto?: boolean;
  reducedMotion?: boolean;
  onAssetError?: () => void;
}) {
  if (!artwork) return null;
  const p = artwork.presentation;
  if (context === 'cover' && hasUserPhoto && !p.showOnPhotoCover) return null;
  if (context === 'cover' && !hasUserPhoto && !p.showOnOrnamentCover) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CONTEXT_SLOTS[context].map((slot) => {
        const layer = artwork.assets[slot];
        return layer ? <ArtworkImage key={slot} layer={layer} slot={slot} artwork={artwork} eager={context === 'cover' && (slot === 'coverBackground' || slot === 'coverForeground')} reducedMotion={reducedMotion} onAssetError={onAssetError} /> : null;
      })}
    </div>
  );
}
