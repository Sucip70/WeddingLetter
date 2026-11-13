# WeddingLetter — Surat Janji

Approved direction: open burgundy envelope, transparent heart and flowing fold seam.
`surat-janji-master.png` is the high-resolution transparent raster source, extracted
from the approved concept with the built-in image-generation editor. No SVG is used.

Extraction prompt: preserve the large approved symbol, heart cutout, rounded corners,
diagonal folds and curved lower seam; remove lettering, small variants and ivory
background; isolate one burgundy symbol with genuinely transparent negative space.

Run `npm run icons --workspace=web` from the repository root to reproduce the
512px normal/light marks, Next app icon, Apple icon, PWA icons and 16/32/48px ICO.
All variants share one geometry. The maskable variant uses extra safe-area padding.
The wordmark remains accessible live text in `components/logo.tsx`, using the
site's locally hosted Fraunces serif rather than an AI-rendered wordmark image.

Scope: visual identity implementation only. Initial web similarity research is not
trademark clearance or a guarantee of exclusivity. Existing UI accent colors and
invitation artwork are intentionally unchanged.
