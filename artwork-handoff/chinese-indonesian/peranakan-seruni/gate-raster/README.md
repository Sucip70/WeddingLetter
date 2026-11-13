# Peranakan Seruni — Gate Raster Handoff

`Folio Seruni Ceremony` is a modern Chinese Indonesian opening gate with a restrained Peranakan memory. It intentionally uses no batik and makes no claim about a specific regional bridal costume.

All production artwork in this directory is raster PNG. No SVG source or decorative vector asset is used.

## Assets

- `gate-background.png` — fixed ivory handmade-paper field, 1024×1536, opaque.
- `left-lacquer-panel.png` — full-canvas transparent left moving panel, 1024×1536.
- `right-lacquer-panel.png` — full-canvas transparent right moving panel, 1024×1536.
- `interactive-seruni-seal.png` — transparent porcelain chrysanthemum touch target, 1254×1254 source canvas.
- `closed-preview.png` — closed-state composition reference, 1024×1536.
- `opening-preview.png` — opening-state composition reference, 1024×1536.

## Implementation notes

- Preserve the 2:3 coordinate system for the background and panel layers.
- Scale the porcelain seal independently and place it at the lower center seam.
- Render live typography above both moving panels and below the seal.
- Fade the opaque gate background during opening to reveal the selected cover.
- Preview files are visual references, not animation layers.
- Do not recolor the garnet panels to bright scarlet or the aged gold to metallic yellow.

## Approved visual vocabulary

- Warm ivory handmade paper
- Deep garnet lacquer paper
- Hairline aged-gold inset
- One ivory porcelain chrysanthemum seal
- Very faint blind-embossed chrysanthemum fragments at opposite outer corners

The gate must remain wedding stationery first. Additional Chinese symbols, architecture, festival props, or regional Indonesian ornaments are not part of this system.
