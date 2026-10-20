# Jali of Noor — Motion specification

Primary duration: **1550 ms**. Animate the PNG layers with CSS transforms; do not flatten the movement into a video.

1. **0–160 ms — acknowledgement:** scale the rosette from `1` to `0.94` and return to `1`; add no sparkle or particle.
2. **160–420 ms — ceremonial release:** move the rosette upward by approximately `18px`, reduce opacity to `0.55`, then continue fading toward `0`.
3. **240–1400 ms — panel opening:** translate the left and right panels outward to `-102%` and `102%`. Use `cubic-bezier(0.65, 0, 0.22, 1)`.
4. **300–1250 ms — reveal light:** raise the background brightness from `0.94` to `1` and opacity from `0.72` to `1`. Keep the light soft and central.
5. **1400–1550 ms — settle:** stop all movement and enable scrolling/content interaction.

The couple and guest text are live HTML and remain stationary on `gate-background.png`. The CTA must be disabled after the first accepted tap.

## Reduced motion

Use a `240 ms` crossfade from closed gate to revealed cover. Do not translate, rotate, or scale the panels or rosette.
