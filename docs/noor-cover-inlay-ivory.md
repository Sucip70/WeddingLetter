# Noor-e-Nikah — ivory inlay cover

Visual revision implementing the approved first screen **after the opening gate**. The gate and interior sections are unchanged. No database artwork version is assigned.

The text-free approved WebP (851 × 1848, 326186 bytes) is tracked under `apps/web/src/components/invitation/assets/noor-cover-paper.webp`. Next bundles it under a content-hashed static URL; it does not depend on an ignored local theme file being present on deployment. Source PNG and the original built-in image generation prompt remain in `.tmp/noor-cover-upgrade/`.

`NoorCover` is selected only for Noor-e-Nikah Ornament, Foto Berbingkai, and Berdua layouts, including catalog thumbnails. Foto Penuh and Terbagi retain their existing photo-specific compositions. All other themes are unchanged.

Artwork occupies the outer edge, top and bottom. Do not stack the old inlay corner/foreground assets over this paper. Photo frame, photos, divider, optional no-photo marker, names, date, recipient and action remain independent. Existing manifest/CDN frame/divider sources are retained. A future `coverPaper` manifest asset overrides the bundled default without assigning a new version in this code.

The approved photo-first layout keeps names below the portrait. Without a photo, or if its URL fails, it renders the small existing marker and live invitation information, not a fixed bride/groom illustration or empty frame. A newly supplied photo URL is still eligible to load. Names split at the ampersand when long. Controls preserve the existing `onOpen` callback and decorative catalog behavior. Motion respects reduced-motion preferences.

During verification the catalog's shared external demo-photo URL returned an image load failure. Its database configuration was not modified; the local review route uses existing local sample photos to verify the photo composition independently. The new background is bundled and does not depend on that external demo-photo endpoint.

Development-only checks: `/review/noor-cover` with `size=narrow|short|tall`, `long=true`, `kind=ornamen|berdua`, or `photo=none`. The route returns not-found in production.
