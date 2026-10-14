# Spring — Vellum Blossom

## Timing

- Primary transition: 1500 ms
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Waiting-state cue: seal scale 1 → 1.025 → 1, once every 4.8s; pause entirely when the document is hidden.
- No continuous decorative motion while waiting.

## Sequence

1. 0–180 ms: seal depresses by 2 px and scales to 0.97.
2. 180–700 ms: seal releases; sage ribbon separates 130 px toward both sides.
3. 360–1250 ms: vellum lifts 90 px and fades to 40% opacity.
4. 850–1500 ms: gate crossfades into the real invitation cover; edge petals exit once.

## Reduced motion

Skip translation, rotation, displacement, and particles. On activation, fade the gate to the real cover over 220 ms. The reduced-motion preview is a visually complete closed state, not a disabled or unfinished screen.

## Layer order

1. Real invitation cover (hidden until transition)
2. `gate-background.webp`
3. `transition-layer.png`
4. Live HTML text
5. `interactive-object.png`

The interaction target should be at least 64 × 64 CSS px even when the visible object is smaller. All preview text is mock content; production text must be rendered by HTML.
