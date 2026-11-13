# Seasonal invitation review — v2

## Decision

The v2 system adopts the Classic category's discipline: one clear typographic axis, generous vertical spacing, low-contrast paper behind copy, and decoration that frames rather than occupies the invitation. Seasonal identity now comes from palette, botanical vocabulary, and controlled edge treatment—not from stacked effects.

Production artwork contains no text. Text appears only in `standard-preview.webp`, `premium-preview.webp`, `catalog-thumbnail.webp`, and `review-board.webp` for hierarchy evaluation.

## Safe areas (1024 × 1536)

| Content | X range | Y range |
| --- | ---: | ---: |
| Kicker | 146–878 | 305–397 |
| Couple names | 146–878 | 420–610 |
| Divider and date | 146–878 | 635–785 |
| Guest name | 146–878 | 865–1005 |
| Opening CTA | 146–878 | 1030–1170 |

Keep essential decoration outside the inner corridor `x=105–919`, `y=270–1200`. Responsive crops may trim the outermost 6% on either side without touching copy.

## Layer combinations

### Standard cover

Use `cover-standard.webp` alone beneath live HTML typography and CTA. It already contains the complete decorative composition.

Allowed:

- One subtle entrance fade for the entire background.
- A very small number of particles after the invitation is opened, never over the closed cover.

Never stack:

- `coverForeground` over `cover-standard.webp`.
- Procedural corner ornaments or floral frames.
- Cover effects, particles, and a foreground simultaneously.

### Premium cover

Use `cover-premium.webp` alone beneath live typography. Premium depth is baked into the background through light and tonal layering.

Allowed:

- Slow background breathe/scale motion of no more than 1.02.
- One restrained seasonal particle system after opening: petals for Spring, no bubbles for Summer, a few leaves for Autumn, fine snow for Winter.

Never stack:

- Any separate large foreground.
- Clouds/rays/aurora overlays.
- Pattern layers, corner ornaments, and particles together.

### Content pages

Use the quiet v1 `page-background.webp`. At a major section transition choose either `divider.webp` or `bottom-decoration.webp`, not both. Use `photo-frame.webp` only around a portrait and do not place a divider immediately beside it.

### Premium gate

Use `gate-background.webp` with live gate text. The existing `gate-foreground.webp` is optional and should be enabled only when the CTA remains above it with at least 48 CSS px clearance. Disable procedural gate ornament/effects whenever both raster gate layers are active.

## Theme refinements

- **Spring:** floral mass is restricted to diagonal edges; the Standard bottom arrangement is shallower, while Premium adds only a faint garden-depth wash.
- **Summer:** literal travel imagery, bubbles, rays, shells, and dramatic surf are removed. Sea identity is conveyed through sea-glass paper, white flowers, slim oats, and abstract ripples.
- **Autumn:** fewer detached leaves, a calmer cream typography field, and editorial copper/umber color replace the previous dense scenic feeling.
- **Winter:** purple fantasy elements, crystals, aurora, and mountains are excluded. White, icy blue, blue-gray foliage, and navy typography dominate.

