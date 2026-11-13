# Kembar Bentar Ceremony — opening motion

Visual revision: `concept-gate-01`

## Layer order

1. Selected invitation cover supplied by the application
2. `gate-background.png`
3. Live gate typography
4. `left-prada-panel.png` and `right-prada-panel.png`
5. `interactive-prada-tab.png`

The candi bentar and masonry remain stationary. Only the two inner prada panels and the small textile tab move. Align the full-canvas panel PNGs to the same 2:3 viewport as the background; do not crop each panel independently.

## Primary motion (1580 ms)

- `0–140 ms`: the prada tab scales from `1` to `0.965` and moves down `3px` to acknowledge touch.
- `140–330 ms`: the tab returns to `1`, lifts `7px`, and receives a restrained warm highlight. Do not spin it.
- `260–450 ms`: the two prada panels separate by `4–6px`, revealing the central seam.
- `400–1320 ms`: the left panel translates left and the right panel translates right by approximately `92%` of each panel's visible width. Use `cubic-bezier(0.24, 0.74, 0.2, 1)`.
- `430–1080 ms`: live gate typography fades out while the selected invitation cover fades in below the fixed stone structure.
- `470–1050 ms`: the prada tab rises another `18px`, scales to `0.88`, and fades to `0`.
- `1260–1580 ms`: the panels settle with no more than `2px` of soft secondary movement.

The motion represents layered ceremonial stationery opening within a fixed split gateway. Never rotate the stone structures or hinge the panels like wooden doors. Do not add sparks, smoke, petals, or fantasy light rays.

## Reduced motion (300 ms)

- Keep the candi and panels stationary.
- Crossfade the complete closed gate to the selected invitation cover.
- Fade the prada tab without translation, rotation, or scaling.

## Live-text safety

- Keep kicker, names, date, and guest text within the central 50% of the viewport width.
- Keep the primary text block between approximately `17%` and `72%` of viewport height.
- Place the CTA above the prada tab; the button must not overlap the tab or bottom masonry.
- Use ceremonial ivory or pale warm-gold typography on the closed brick-maroon field.
- Long names may wrap to two centered lines; never reduce side clearance to accommodate them.

## Layering restrictions

- Candi bentar is the architectural frame; do not add a second temple, kori agung, or carved border around it.
- Prada panels are the only moving door-like elements. The stone candi must remain stationary.
- Do not add deities, guardian statues, Barong, Rangda, Garuda, offerings, masks, or sacred objects as interface controls.
- Do not add beaches, rice terraces, palms, dancers, sunsets, or resort scenery.
- Do not add large flowers, bright yellow gold, or dense carving behind live text.
- Do not mix Javanese, Minangkabau, Batak, Lombok, or other regional ornaments into this composition.

## Payas Agung boundary

This gate intentionally contains no bridal figure. If a future preview includes Payas Agung attire, first select one documented regional variant and keep the head, body, and lower-body components internally consistent. Do not combine attire details from different Balinese regions.
