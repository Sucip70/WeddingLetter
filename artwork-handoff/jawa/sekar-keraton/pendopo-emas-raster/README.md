# Sekar Keraton — Pendopo Emas

Production-ready raster layers for the approved **Foto Berbingkai / names below photo** cover direction.

## Files

- `cover-paper-background.png` / `.webp` — reusable ivory paper background, 1024×1536.
- `cover-golden-canopy.png` / `.webp` — transparent upper canopy, 1600×500.
- `photo-frame-gold.png` / `.webp` — transparent photo frame, 1200×1600.
- `divider-kawung-gold.png` / `.webp` — transparent divider, 800×160.
- `cover-golden-footer.png` / `.webp` — transparent lower foundation, 1600×360.
- `approved-preview.png` — approved hierarchy preview, 390×844; preview text and sample photo only.
- `manifest.json` — dimensions, placement, order, and stacking rules.
- `source-renders/` — retained high-resolution raster generation sources.

## Implementation notes

Use the WebP files at runtime and retain PNG as the lossless master. Keep names, date, guest name, and CTA as live application elements. The user photo sits behind `photo-frame-gold`.

The top canopy and bottom footer are a paired system. Do not combine them with the rejected `photo-crown`, `cover-top-corners`, the mini kayon, or another full-page border.

All production assets are raster. No SVG assets are used.
