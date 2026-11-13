# Vivaha Rani — approved silk doors and zardozi cover

Visual revision only, approved in the design review on 2026-11-11. No database artwork version is assigned here.

| Bundled raster | Dimensions | Alpha | Role |
| --- | --- | --- | --- |
| vivaha-gate-doors.webp | 851 × 1847 | No | Complete closed silk doors, including attached handles |
| vivaha-cover-paper.webp | 851 × 1849 | No | Approved first-page stationery background |

Both are text-free WebP exports (quality 90) of the approved image-generation PNG masters. Typography, recipients, dates and user photos are rendered separately by React. No SVG artwork was introduced.

The original PNG masters, prompts, preview fragments, export script and QA screenshots remain in the ignored `.tmp/vivaha-rani-redesign/` working folder. `export-production.cjs` reproduces these exports without altering the masters.

## Layering

- Gate: two clipped halves of the SAME complete door raster. The right half is offset, **not mirrored**. Overlay live "Pernikahan", couple names, recipient and opening hint. Do not stack the old toran, scalloped curtains, genda seal, ivory letter or extra ornaments over these doors.
- Opening: text fades; left and right door halves slide outward. Existing 1600 ms gate lifecycle remains. Reduced motion uses a short fade instead of a slide.
- First page: approved paper + existing manifest photo frame around a real user photo + live copy and divider. Ornamen uses the existing small marker instead of a photo. Berdua uses two independently replaceable portraits. Keep shared particles behind the opaque cover; content-section effects are unchanged.
- Foto penuh and Terbagi retain their existing layouts. They were not part of this approved first-page redesign. Standard uses the updated cover without a gate; Premium reveals the selected cover through the new doors.
- Missing or failed photos fall back to the ornament composition, not a hard-coded wedding illustration.

Implementation: `toran-gate.tsx`, `vivaha-cover.tsx`, their CSS modules and the existing Gate/RasterCover routing. The development-only `/review/vivaha` route supports small screens, long names, no-photo and portrait validation and returns 404 in production.
