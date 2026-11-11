# Ladang Lavender — Herbarium Lavender

Visual revision only, no immutable database artwork version assigned. Approved preview, with the user's final correction: all physical photo mounts are rectangular, never arched/window-shaped.

## Bundled raster files

- `lavender-cover.webp`: 851 × 1849, opaque RGB, text-free botanical stationery. PNG source retained in ignored `.tmp/ladang-lavender-herbarium/cover.png`.
- `lavender-gate.webp`: 850 × 1850, opaque RGB, text-free closed botanical letter. Source `.tmp/ladang-lavender-herbarium/gate.png`.
- `lavender-sample.webp`: 1000 × 1250, opaque RGB, fictional sample photograph used only by catalog/editor/review fixtures. Never injected into customer invitation components. Source `.tmp/ladang-lavender-herbarium/photo.png`.

Artwork generated with the built-in image tool; PNG originals, prompt set and editable review source retained in the ignored working folder. Production exports are WebP quality90 (sample88), imported as bundled static files so deployment does not depend on ignored public artwork. No SVG artwork.

## Composition and layering

Reference canvas 390 × 847.363636 CSS px; every cover and gate element scales uniformly by available width /390. Short viewports scroll. Main invitation owns cover/content scrolling, closed gate has its own temporary scroll surface. Photo, names, date and recipient are separate live elements. Missing/broken photos fall back to text-only stationery, never a fixed bride/groom illustration.

Cover layers: one opaque paper, rectangular CSS hairline mount(s), real uploaded photos, live text, thin CSS divider and CTA. Do not add legacy meadow SVG branches, clouds, particles, old corners or previous artwork overlays. Content uses the same perimeter at14% opacity on ivory; no dense floral foreground behind every section. Forms, maps, calendar, RSVP, digital-envelope copy, guestbook, gallery and music retain existing application functionality. Only enabled sections render.

Gate layers: a single raster correspondence folio plus live text and an accessible seal hit target. Tap acknowledges with a5px ceremonial movement, fades copy, lifts the folio and reveals the selected cover over1650ms; reduced motion fades220ms. No new database gate enum or version required. The composited letter is deliberately animated as one physical sheet, not falsely presented as separate transparent envelope panels.

Catalog uses the same live photo/text components, but reflows its logical canvas to the actual card aspect ratio at a width-based scale. It fills the card without side gutters, with names, date, recipient and CTA intact. The live invitation keeps its original width-scaled composition. Existing thumbnail URLs do not override the upgraded Lavender design.

Footer and thumbnail paper use nine-slice rendering (239/80/280/80 from the851×1849 cover) to preserve the top/bottom flower and corner proportions instead of stretching the entire cover into a shorter box. Footer has a390/600 minimum composition with naturally expandable content. Raster files remain unchanged.

Existing Lavender palette options remain available: live ink and button accents follow the selected palette; the old default Ungu Lilac maps to the approved muted plum ink. The raster paper and painted botanicals retain their original colors, rather than hue-shifting the couple's photo or the whole invitation.
