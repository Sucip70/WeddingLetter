# Pawiwahan Agung — gate raster handoff

`Kembar Bentar Ceremony` is a raster-only opening gate for the Bali theme. No SVG source or derivative is used.

## Assets

- `gate-background.png` — fixed warm-paras candi bentar and masonry, 1024×1536, opaque.
- `left-prada-panel.png` — full-canvas transparent left moving panel, 1024×1536.
- `right-prada-panel.png` — full-canvas transparent right moving panel, 1024×1536.
- `interactive-prada-tab.png` — transparent touch target artwork, 1254×1254 source canvas; render small at the lower central seam.
- `closed-preview.png` — approved closed-state composition reference, 1024×1536.
- `opening-preview.png` — opened-state composition reference, 1024×1536.

## Implementation notes

- Preserve the 2:3 coordinate system for the background and both panel layers.
- Scale the interactive tab independently while retaining its aspect ratio.
- Live typography belongs to the application and must remain above the background but below the moving panels.
- The preview files are references, not animation layers.
- Do not recolor the paras stone to cold gray or the aged prada to bright metallic yellow.

## Source note

The image-generation source renders remain outside the product bundle. Production-ready assets in this directory are PNG raster files; movable assets include alpha transparency.
