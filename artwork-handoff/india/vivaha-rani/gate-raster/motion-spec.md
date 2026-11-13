# Rani Toran — Motion specification

Primary duration: **1500 ms**. Animate the separate PNG layers; do not flatten the motion into video.

1. **0–170 ms:** compress the genda rosette to `0.94`, then return to `1`.
2. **170–420 ms:** lift the rosette about `18px` and fade it from `1` to `0`.
3. **240–1370 ms:** translate the left and right silk panels to `-102%` and `102%` using `cubic-bezier(0.65, 0, 0.22, 1)`.
4. **300–1260 ms:** raise the revealed cover opacity from `0.74` to `1` and brightness from `0.95` to `1`.
5. **1370–1500 ms:** settle, remove the closed-state hit target, and enable invitation scrolling.

Live couple, guest, date and CTA text stay on `gate-background.png`. Do not add petals, powder, sparks or confetti during opening.

## Reduced motion

Crossfade from the closed state to the revealed cover in `240 ms`; do not translate, rotate or scale panels and rosette.
