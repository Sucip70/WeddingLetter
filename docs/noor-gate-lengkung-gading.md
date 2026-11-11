# Noor-e-Nikah — Lengkung Gading opening gate

Implements the selected gate preview, independently of the approved first-page cover. No database artwork version is assigned or published by this change.

The gate uses existing manifest-backed `cardFrame` (ivory cusped letter), `gateInteractive` (rosette), `divider`, and optional `bottomDecoration` (inlay). Names, actual date, recipient and CTA remain live text. Missing recipients use `Bapak/Ibu/Saudara/i`; missing dates are omitted.

Two tiny raster crops from the exact approved preview are bundled as content-hashed static media: `assets/noor-gate-cloth.webp` and `assets/noor-gate-jali.webp`. Recreate them with `node apps/web/scripts/build-noor-gate-assets.cjs` from the retained local artist source. These are deterministic crops, not generated replacements, SVGs, or redrawn motifs. Both side strips use the same source, with only the right ornament mirrored. Do not stack the old full doorway panels over the letter or add another top inlay.

The native CTA includes the rosette and label as one keyboard-accessible hit target. It is disabled and the letter is inert during opening. Text/rosette/footer fade first; the two emerald halves slide out after 240 ms over 1100 ms. The gate finishes fading by 1540 ms, within the unchanged 1650 ms host lifecycle. Reduced motion retains only the short host fade and does not slide panels.

The first cover behind this gate continues to use the newly approved ivory-inlay background; the gate does not replace or restyle that cover. Standard invitations remain gate-free.
