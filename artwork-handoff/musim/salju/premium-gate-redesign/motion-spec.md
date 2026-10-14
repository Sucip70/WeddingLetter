# Winter — Frosted Monogram

## Timing

- Primary transition: 1400 ms
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Waiting-state cue: monogram ring opacity 0.7 → 1 → 0.7, once every 5.5s; pause entirely when the document is hidden.
- No continuous decorative motion while waiting.

## Sequence

1. 0–180 ms: monogram acknowledges touch with a restrained warm point of light.
2. 180–1050 ms: frost clears radially from the monogram while the names sharpen.
3. 700–1250 ms: glass opacity falls to zero and the real cover becomes visible.
4. 1100–1400 ms: monogram and warm light fade; optional fine snow begins only after opening.

## Reduced motion

Skip translation, rotation, displacement, and particles. On activation, fade the gate to the real cover over 220 ms. The reduced-motion preview is a visually complete closed state, not a disabled or unfinished screen.

## Layer order

1. Real invitation cover (hidden until transition)
2. `gate-background.webp`
3. `transition-layer.png`
4. Live HTML text
5. `interactive-object.png`

The interaction target should be at least 64 × 64 CSS px even when the visible object is smaller. All preview text is mock content; production text must be rendered by HTML.
