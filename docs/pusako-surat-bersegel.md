# Pusako Minang — Surat Bersegel

Approved visual direction: ivory invitation letter inside the existing maroon songket gate. This is a focused gate upgrade, not a redesign of the invitation cover or content.

## Assets

Runtime package: `apps/web/public/themes/pusako-minang/surat-bersegel-01/`.
`manifest.json` records actual dimensions, transparency, original raster sources, layering geometry and motion. `surat-bersegel-01` is a visual revision, not an immutable database artwork version. No database records or artwork version numbers are changed.

- `gate-cloth.webp`: opaque maroon songket background, repeat vertically.
- `post-left.webp`, `post-right.webp`: separate transparent carved posts.
- `letter-card.webp`: opaque ivory paper with a restrained carved edge. Nine-slice at 135 source pixels on all sides; render border at 14 CSS pixels. Do not stretch the entire card as a normal background image.
- `gold-divider.webp`: small transparent divider between the date and recipient.
- `gonjong-seal.webp`: transparent opening target at the lower edge of the letter, not a second floating centerpiece.
- `gold-foundation.webp`: transparent lower sill.

All production images are text-free. Full-resolution PNG raster masters are retained locally under `.tmp/pusako-letter-gate-implementation-2026-11-10/`; originals in the parent theme folder are untouched. Regenerate the package from the repository root with `node apps/web/scripts/build-pusako-letter-assets.cjs`. No SVG or procedural replacement of carved artwork is used.

## Live layout

`PusakoLetterGate` renders the invitation kicker, couple names, real event date, “Kepada Yth.”, recipient and opening instruction as live React text. Missing recipients fall back to “Bapak/Ibu/Saudara/i”, never an invented personal name. Missing event dates are omitted. The accepted long-name example is Alexandra Putri & Muhammad Rasyid.

Default safe corridor: horizontal 18–82%, vertical 15.5–65%. Card: horizontal 10–90%, vertical 8–77%. The gonjong begins at 68.5%. Taller phones receive the same adjustments as the approved preview: paper 10–76%, text begins at 17%, seal at 69%.

Use only one native opening button around the seal/instruction. The outer gate is not another nested button. Click, touch, Enter and Space use the existing `InvitationView.openGate` lifecycle and audio unlock; repeated input is disabled while opening.

## Layering and motion

Back to front: underlying real invitation cover → two matching, clipped songket/post/card/foundation halves → live copy/divider → gonjong opening button. The two halves are full-size canvases clipped at 50%; they each move 52% of the viewport width to expose the real selected cover. There is no separately baked photo or substitute cover behind the gate.

Copy fades immediately; seal acknowledges the touch and moves up slightly; panel movement lasts 1150ms after a 230ms delay. Keep the existing 1650ms gonjong lifecycle. Reduced motion cross-fades instead of translating the panels. No looping glow, particles, floating objects or pulsing duplicate CTA.

Never stack this gate with the old glow, old central floating gonjong, old gate CTA, or the unapproved canopy/couple illustrations. The unapproved scroll upgrade and its renderer/integration were removed at the user's request before committing. Only the approved Surat Bersegel gate remains; the original covers and content are retained. Custom/CDN asset URLs in saved manifests are not rewritten to local URLs.

The new gate deliberately does not alter Standard invitations, cover-layout selection, photos, content sections, database publishing, or other cultural themes.

## Verification — 10 November 2026

- Web unit suite: 11 tests passed, including six focused gate tests.
- After the user-requested removal of the unapproved scroll package and its tests, the remaining web suite passed all nine tests. Generic worktree changes were kept separate from the gate commit.
- TypeScript and focused ESLint checks passed.
- Optimized production build passed using the isolated `.next-letter-check` output directory; build-only generated configuration changes were restored.
- The actual Premium Pusako catalog preview shows the approved letter, real sample date and neutral guest fallback. Opening/replay reveals its original selected cover.
- Development-only `/review/pusako-letter` checks cover 320×640, 390×700 and 440×956 compositions; the long-name example and a personal `?to=` recipient were verified. Space activation opens the native seal button; the gate disappears after the existing lifecycle. Standard renders no gate.
- The gate uses raster images only; all observed image elements loaded successfully and the review page reported no console errors.

Review image: `.tmp/pusako-letter-gate-implementation-2026-11-10/implemented-gate.jpg`.
