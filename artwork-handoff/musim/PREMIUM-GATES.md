# Premium Seasonal opening gates

The four gates are a new interaction system rather than variants of the approved invitation covers. Each gate uses one focal object, one seasonal ritual, restrained stationery materials, and a text-safe center.

| Theme | Concept | Interactive object | Primary duration |
| --- | --- | --- | --- |
| Spring | Vellum Blossom | Blush seal with sage ribbon | 1500 ms |
| Summer | Golden Tide | Pearl over a champagne reflection | 1600 ms |
| Autumn | Letter in the Wind | Small copper maple leaf | 1650 ms |
| Winter | Frosted Monogram | Thin circular A·S monogram | 1400 ms |

Production raster layers are text-free. Text in the state previews is evaluation copy and must be rendered as live HTML in the product.

Every package contains a fully composed closed state, a representative mid-animation frame, the cover-reveal transition frame, and a complete reduced-motion state. The reduced-motion implementation is a 220 ms crossfade with no translation, rotation, displacement, or particles.

## Shared safe areas

- Live text: x 150–874, y 300–1125 on the 1024×1536 artboard.
- Crop-safe visual envelope: x 110–914, y 190–1320.
- Minimum interaction hit target: 64×64 CSS px.
- No continuous decorative animation while the gate waits for input.

## Engineering notes

- Layer the live cover beneath the gate so the final reveal cannot flash a blank frame.
- Keep preview text out of production assets.
- The full-artboard transparent PNG layers share the same origin as the background and require no positional offsets.
- Autumn and Spring edge particles are one-shot exit details, not waiting-state loops.
- Winter snow and any seasonal ambient particles may begin only after the gate is fully open.
