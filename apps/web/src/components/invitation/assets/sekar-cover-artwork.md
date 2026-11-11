# Sekar Keraton — Bingkai Pusaka

Approved continuous four-sided carved border, replacing the old Pendopo ceiling/stage composition on stationery covers only. Visual revision, not a database artwork version.

- `sekar-cover-paper.webp`: 850 × 1850, opaque, text-free. Built-in image generation PNG master retained at `.tmp/sekar-border-redesign/border-paper-v1.png`; prompt and deterministic WebP export script live beside it (ignored working files).
- `sekar-cover-divider.webp`: 700 × 92 with alpha, existing approved Pendopo divider, bundled unchanged for reliable cover rendering.
- React renders all names, dates, recipient, buttons and user photos. The restrained photo mount is CSS, not SVG; it never embeds a fixed wedding illustration.
- Use the continuous paper border alone. Never stack the old canopy, footer, corners, photo-frame or legacy coverPaper over it.
- Ornamen, Foto Berbingkai and Berdua share the new stationery system. Foto penuh and Terbagi retain their existing layouts. Gate, content sections and other themes are unchanged.
- Existing small kayon is used for the ornament/no-photo fallback. Missing or failed user photos are not replaced by a hard-coded sample photo.
- Preserve full border visibility at mobile aspect ratios. Center text stays within the 15% side margins. Photo height targets 38% of the cover (36% with long names; 34% on short screens with long names), capped by available width. Typography and spacing scale with height too, rather than disproportionately shrinking the photo. Long names wrap with an inline ampersand to avoid an extra line. The CTA retains its 44px minimum height.
- Development validation: `/review/sekar-cover`, hidden in production.
