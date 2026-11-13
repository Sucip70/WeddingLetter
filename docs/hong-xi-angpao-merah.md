# Hong Xi — Angpao Merah

Approved visual revision: Chinese 囍 between the lanterns, red invitation letter, gold cloud above the opening button. No database artwork version is assigned by this change.

`LenteraGate` uses the existing manifest-backed `gateBackground`, `cornerTopLeft`, `gateInteractive`, and optional `divider`. Both moving halves use the same left-side paper/lantern artwork, with only the right decorative canvas mirrored. The Chinese character is a single, independent, unmirrored image. Do not stack the old seam or a second lower xi over this composition.

The approved transparent cloud is bundled as a component asset (`src/components/invitation/assets/hong-xi-cloud.webp`, 1962 × 259, 187508 bytes), rather than referencing an ignored local `public/themes` file. Next emits its content-hashed static URL. It contains no text, and is loaded as an image only when this gate renders. All existing catalog/CDN asset URLs remain intact; no publishing/database write is needed for this layout revision.

Artist source and generation prompt remain in `.tmp/hong-xi-gate-preview/assets/`. The cloud was generated using the built-in image generation tool, not SVG or a vector redraw. Its production copy is the approved WebP export.

Couple names, event date, recipient and CTA remain live text. No missing event date is invented; an absent recipient displays `Bapak/Ibu/Saudara/i`. Long names split at the ampersand. The native opening button supports keyboard activation; it becomes disabled/inert during opening. Gate routing does not retain an outer `role=button` for this composition.

Motion: text and xi fade first, halves slide outward after 260 ms over 1050 ms, remaining gate fades by 1500 ms; existing 1700 ms host lifecycle is retained. Reduced motion uses the host fade without sliding. Standard/no-gate behavior and cover/content sections are unchanged.
