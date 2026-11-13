# Pawiwahan Agung — Prada Terpusat

Visual revision `prada-terpusat-01`, approved symmetric composition. This changes the Premium opening gate only; the cover choices, user photographs, invitation content and other themes remain unchanged.

## Layering

The original left half of `gateBackground` is mirrored around the exact centerline for equal stone pillars and a complete stone threshold. The doorway is inset 23.65% on each side and 11.65% from the bottom of the original 2:3 artwork stage.

Both door halves reuse `gateTransition` (the left textile source). The right half is a mirror, not the old mismatched `gateForeground`. The old gold edge is cropped out of each half; one restrained central seam remains. Door movement is clipped inside the doorway so it does not slide over the stone pillars.

The central dark letter crops the text-free middle of the same manifest-backed `gateBackground` using CSS background positioning. This works with published CDN artwork and does not add a deployment dependency on a local-only image. An optional artist export is available at `public/themes/pawiwahan-agung/prada-terpusat-01/letter-cloth.webp`. The original `gateInteractive` prada and `divider` remain independent raster layers.

Regenerate the supplemental texture and manifest from the repository root:

```sh
node apps/web/scripts/build-candi-gate-assets.cjs
```

The full-resolution crop is also retained as a PNG master in `.tmp/pawiwahan-prada-terpusat/raster-masters/`. Existing source artwork is untouched. No SVG or newly invented cultural ornament is used.

## Live text and interaction

Kicker, couple names, actual event date, recipient and opening instruction are live React text. The recipient comes from the invitation's personal `?to=` link; missing recipients use “Bapak/Ibu/Saudara/i”, not an invented guest. Missing dates are omitted.

One native button groups the prada with “Buka undangan”. The outer gate is not another button. The existing invitation lifecycle handles click, keyboard, audio unlock, reveal and replay; repeated input is disabled during opening.

The prada lifts slightly, copy fades, and equal panels slide outward for 950ms after a 280ms delay. The stone backdrop then fades to reveal the real selected cover. Keep the existing 1650ms `paras` lifecycle. Reduced motion fades without panel or prada translation.

Never stack this composition with the old right panel, the old mirrored vertical extensions, a second floating prada, the old central gold stripe, or the old pulsing CTA.

## Review

Development-only `/review/pawiwahan-gate` exercises the real gate and personal-link handling. `?long=true`, `?size=narrow`, `?size=tall` and `?tier=standard` cover the accepted long names, 320×640, 440×956 and no-gate Standard cases.

The supplemental manifest is a visual revision, not a replacement database artwork manifest. No immutable database artwork version is assigned or changed.

## Verification — 11 November 2026

- All 20 web tests passed, including seven focused Candi gate tests. TypeScript, focused ESLint, and the isolated optimized production build passed.
- The real Premium catalog preview opens the new gate, reveals its original cover, and replays successfully.
- Long names “Alexandra Putri & Muhammad Rasyid” and an actual personal-link recipient were checked at 320×640 and 440×956. Keyboard Space opens the real gate; Standard renders no gate.
- Raster image elements loaded, no SVG appears in the gate, and the review page reported no console errors.
- Proof screenshot: `.tmp/pawiwahan-prada-terpusat/implemented-gate.jpg`.
