# Pangihot ni Holong — opening motion

Visual revision: `concept-gate-01`

## Layer order

1. Selected invitation cover supplied by the application
2. `gate-background.png`
3. Live gate typography
4. `left-ulos-panel.png` and `right-ulos-panel.png`
5. `interactive-woven-knot.png`

The ulos panels and woven knot are raster PNG files with alpha transparency. Align all gate layers to the same mobile viewport before applying motion.

## Primary motion (1650 ms)

- `0–150 ms`: woven knot scales from `1` to `0.96` and moves down `3px` to acknowledge touch.
- `150–360 ms`: knot returns to `1`, rotates no more than `1.5deg`, and lifts `8px`. The movement represents loosening woven tension, not spinning a badge.
- `280–520 ms`: both ulos panels relax slightly toward the center using `scaleX(1.015)` before opening.
- `430–1420 ms`: left panel translates outward to the left and right panel translates outward to the right by approximately `76%` of their rendered widths. Use `cubic-bezier(0.22, 0.72, 0.18, 1)`.
- `430–1180 ms`: the live gate typography fades out while the invitation cover underneath fades in.
- `520–1280 ms`: the woven knot lifts another `22px`, scales to `0.84`, and fades to `0`.
- `1280–1650 ms`: panels settle with a maximum `3px` secondary sway. Do not loop the tassel movement.

The opening is a textile release. Do not rotate the panels like hinged wooden doors and do not use 3D perspective flips.

## Reduced motion (320 ms)

- Keep both ulos panels stationary.
- Crossfade the entire gate to the selected invitation cover.
- Fade the woven knot without translation, rotation, or scale.

## Live-text safety

- Keep kicker, couple names, date, and guest text within the central 54% of viewport width.
- Keep the guest-name block above the crossing point of the ulos panels.
- Use bone-ivory typography on the closed charcoal field.
- Do not place text over the woven knot or tassels.

## Layering restrictions

- Ulos is the primary structure; do not add a second ornamental frame around it.
- Do not add Sigale-gale, buffalo heads, weapons, churches, Ruma Bolon scenery, or Lake Toba scenery.
- Do not stack additional gorga behind the live text.
- Do not recolor the red-black-bone Ragi Hotang palette into bright gold.
- Do not add particles, sparks, smoke, petals, or fantasy light rays.
- Do not mix Karo, Simalungun, Pakpak, Mandailing, Javanese, Minangkabau, or Balinese ornaments.
