# Gonjong Pusako — opening motion

Visual revision: `concept-gate-01`

## Layer order

1. Invitation cover (application content)
2. `gate-background.png`
3. Live couple and guest text
4. `left-panel.png` and `right-panel.png`
5. `interactive-gonjong.png`

The PNG panel and interactive-object files contain alpha transparency. They use a full transparent canvas so engineering can align every layer to the same mobile coordinate system before applying transforms.

## Primary motion (1550 ms)

- `0–160 ms`: gonjong scales from `1` to `0.96` with a subtle downward movement of `3px`.
- `160–340 ms`: gonjong returns to `1`, lifts `12px`, and receives a restrained warm highlight.
- `280–1240 ms`: left and right panels translate outward by `82%` of their rendered width. Use `cubic-bezier(0.22, 0.72, 0.18, 1)`.
- `380–1320 ms`: the invitation cover beneath fades from `0` to `1`; do not add particles.
- `1080–1550 ms`: gonjong rises another `18px`, scales to `0.82`, and fades to `0` while the panels finish settling.

The panel motion is a horizontal ceremonial reveal, not a hinged 3D door. Avoid perspective flips because they distort the gonjong silhouette and carved relief.

## Reduced motion (320 ms)

- Keep panels stationary.
- Crossfade the complete gate to the invitation cover.
- Gonjong fades from `1` to `0` without translation, rotation, or scale.

## Live-text safety

- Keep live kicker, couple names, date, and guest text inside the central 56% of the viewport width.
- Keep the interactive gonjong below the live guest-name block.
- Do not place additional ornaments behind live text.

## Layering restrictions

- Do not stack a separate suntiang ornament over the gonjong object.
- Do not add falling petals, leaves, sparks, clouds, or fantasy light rays.
- Do not combine these panels with Javanese kayon, Balinese carving, mosque domes, or generic arabesque assets.
- The opening preview contains a sample blank ivory reveal only; the real invitation cover must be supplied by the application.
