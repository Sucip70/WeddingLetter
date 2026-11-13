# Folio Seruni Ceremony — opening motion

Visual revision: `concept-gate-01`

## Layer order

From bottom to top:

1. Selected invitation cover supplied by the application
2. `gate-background.png`
3. `left-lacquer-panel.png` and `right-lacquer-panel.png`
4. Live gate typography and CTA
5. `interactive-seruni-seal.png`

Align the background and both panel layers to the same 2:3 viewport. The seal is positioned independently at the lower center seam. The opaque gate background must fade away during opening so the selected invitation cover can be revealed.

## Primary motion (1520 ms)

- `0–140 ms`: the porcelain seal scales from `1` to `0.965` and moves down `2px` to acknowledge touch.
- `140–320 ms`: the seal returns to `1`, receives a restrained warm highlight, and lifts `6px`. Do not rotate or spin it.
- `260–430 ms`: the two lacquer panels separate by `5–7px`, exposing a narrow ivory seam.
- `390–1260 ms`: the left panel translates left and the right panel translates right by approximately `84%` of each panel's rendered width. Use `cubic-bezier(0.22, 0.74, 0.2, 1)`.
- `420–1040 ms`: live gate typography and CTA fade out.
- `430–1120 ms`: `gate-background.png` fades from opacity `1` to `0`, revealing the selected invitation cover beneath it.
- `450–980 ms`: the porcelain seal rises another `16px`, scales to `0.86`, and fades to `0`.
- `1220–1520 ms`: panels settle with no more than `2px` of secondary movement.

The interaction is the opening of a premium stationery folio. Panels slide horizontally; they must not hinge, flip in 3D, curl like fabric, or rotate like architectural doors.

## Reduced motion (300 ms)

- Keep both lacquer panels stationary.
- Crossfade the entire closed gate to the selected invitation cover.
- Fade the porcelain seal and live typography without translation, rotation, or scaling.

## Live-text safety

- Keep kicker, couple names, date, guest text, and CTA within the central 54% of viewport width.
- Keep the main live-text stack between approximately `15%` and `69%` of viewport height.
- Place the CTA above the porcelain seal, with at least `28px` visual clearance at the final rendered scale.
- Use porcelain ivory typography on the garnet panels; antique gold is reserved for small rules or secondary text.
- Long names may wrap to two centered lines. Do not shrink side clearance or place text over the gold panel borders.

## Layering restrictions

- The chrysanthemum seal is the only primary motif. Do not add a second flower medallion.
- Do not add batik, brocade patterns, dense florals, or decorative branches behind live text.
- Do not add the double-happiness symbol, Chinese writing, dragons, phoenixes, lanterns, fans, coins, red envelopes, guardian lions, pagodas, temples, or moon gates.
- Do not use Singapore/Malacca tile styling as a shortcut for Indonesian Peranakan identity.
- Do not add glitter, sparks, petals, smoke, or fantasy light rays.
- Do not mix Javanese, Minangkabau, Batak, Balinese, Betawi, or Cina Benteng wedding ornaments into this composition.

## Identity boundary

This gate represents a contemporary Chinese Indonesian stationery direction. It does not claim a specific regional bridal costume or wedding ritual. If future previews include people, attire, or ritual objects, their regional and family tradition must be selected and documented separately before illustration.
