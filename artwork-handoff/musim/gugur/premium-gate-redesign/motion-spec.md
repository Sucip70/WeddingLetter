# Autumn — Letter in the Wind

## Timing

- Primary transition: 1650 ms
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- Waiting-state cue: leaf rotates −1.5° → 1.5° → 0°, once every 5s; pause entirely when the document is hidden.
- No continuous decorative motion while waiting.

## Sequence

1. 0–180 ms: central leaf lifts 10 px from the paper surface.
2. 180–1050 ms: leaf rotates once and travels upward-right out of the central field.
3. 300–1220 ms: cognac tracing paper slides right 260 px with a slight −5° rotation.
4. 1000–1650 ms: ivory card advances 10 px in scale and dissolves into the invitation cover.

## Reduced motion

Skip translation, rotation, displacement, and particles. On activation, fade the gate to the real cover over 220 ms. The reduced-motion preview is a visually complete closed state, not a disabled or unfinished screen.

## Layer order

1. Real invitation cover (hidden until transition)
2. `gate-background.webp`
3. `transition-layer.png`
4. Live HTML text
5. `interactive-object.png`

The interaction target should be at least 64 × 64 CSS px even when the visible object is smaller. All preview text is mock content; production text must be rendered by HTML.
