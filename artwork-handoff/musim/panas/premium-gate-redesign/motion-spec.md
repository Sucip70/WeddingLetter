# Summer — Golden Tide

## Timing

- Primary transition: 1600 ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Waiting-state cue: pearl highlight opacity 0.55 → 0.82 → 0.55, once every 5.2s; pause entirely when the document is hidden.
- No continuous decorative motion while waiting.

## Sequence

1. 0–160 ms: pearl compresses to 0.96 and the champagne reflection brightens.
2. 160–920 ms: two concentric ripples expand from the pearl.
3. 420–1320 ms: the sea-glass field separates softly left and right using a displacement mask.
4. 980–1600 ms: the reflection fades as the invitation cover resolves behind it.

## Reduced motion

Skip translation, rotation, displacement, and particles. On activation, fade the gate to the real cover over 220 ms. The reduced-motion preview is a visually complete closed state, not a disabled or unfinished screen.

## Layer order

1. Real invitation cover (hidden until transition)
2. `gate-background.webp`
3. `transition-layer.png`
4. Live HTML text
5. `interactive-object.png`

The interaction target should be at least 64 × 64 CSS px even when the visible object is smaller. All preview text is mock content; production text must be rendered by HTML.
