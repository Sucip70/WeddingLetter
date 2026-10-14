# WeddingLetter — Musim artwork handoff

This package completes the visual system for all four `musim` designs: `semi`, `panas`, `gugur`, and `salju`.

## Shared direction

The family is **seasonal watercolor stationery**. The gate and cover carry the cinematic seasonal scene; long content pages become quieter handmade-paper fields; dividers, photo frames, and bottom flourishes repeat the same signature materials without competing with invitation copy.

- No typography is baked into production artwork.
- Primary mobile artboard: 1024 × 1536 (2:3), safe for 390–480 px viewports.
- Keep names, date, CTA, and body content in the open central field.
- Transparent decoration is supplied as both WebP and editable PNG where appropriate.
- `production-preview.webp` shows the intended cover → gate → content visual rhythm.
- `*-contact-sheet.png` and `preview.webp` preserve the approved concept exploration.

## Placement

- `cover-background.webp`: full bleed, `cover`, center-top.
- `cover-foreground.webp`: bottom-center overlay for the opening cover.
- `gate-background.webp`: full bleed gate scene, center.
- `gate-foreground.webp`: bottom-center overlay; place below gate text and controls.
- `page-background.webp`: long-page body field; use as fixed/section background, not as a content image.
- `section-background.webp`: square crop for cards and visually distinct sections.
- `bottom-decoration.webp`: closing flourish or section transition; do not repeat on every section.
- `divider.webp`: between compact content blocks at 160–240 CSS px wide.
- `photo-frame.webp`: overlay above an oval portrait crop; photo stays HTML/CSS.
- `thumbnail.webp`: catalog/admin thumbnail.

## Density rhythm

Use strong decoration at the gate and cover, low decoration through most content, a medium flourish at major transitions, and one strong closing flourish. Avoid stacking the frame, divider, and bottom decoration in the same small viewport.

## Folders

- `semi/v1`: Spring Botanical — blush sakura, peony, sage.
- `panas/v1`: Sea-Glass Summer — aqua waves, white hibiscus, amber sea oats.
- `gugur/v1`: Copper Autumn — maple, chrysanthemum, warm umber twig.
- `salju/v1`: Crystal Winter — frost, hellebore, pine, pale ice.

The two `.mjs` files are reproducible local processing utilities for conversion, alpha preparation, and previews; source generations remain in Codex's generated-image archive.

