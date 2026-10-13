import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generated = "C:/Users/ThinkPad/.codex/generated_images/01a1309b-e37e-7b92-880a-a8b0e6c9a1d0";
const handoff = path.join(root, "artwork-handoff/musim");

const themes = {
  semi: {
    title: "SPRING",
    standard: "exec-edd53858-74f9-4144-bffe-578e3710a6a1.png",
    premium: "exec-1b7c9c87-4ec4-4165-a721-4717e618f432.png",
    ink: "#4a3040",
    primary: "#b76182",
  },
  panas: {
    title: "SUMMER",
    standard: "exec-5dfeff7a-422b-42f7-8661-297b027a9410.png",
    premium: "exec-f7915055-bcc7-4a07-93e3-a25710373a3d.png",
    ink: "#0f3d3a",
    primary: "#167d78",
  },
  gugur: {
    title: "AUTUMN",
    standard: "exec-9e58e560-58ae-4a0d-b0f1-c2f63c2b2290.png",
    premium: "exec-9d19951a-2b2d-4878-846f-728b81e85907.png",
    ink: "#3d2410",
    primary: "#9a4c17",
  },
  salju: {
    title: "WINTER",
    standard: "exec-6d920467-b8ba-400b-bd44-f0bbc80afcd2.png",
    premium: "exec-70091e40-0318-4aa1-9a6e-9ca35b47b0a7.png",
    ink: "#1c2f4a",
    primary: "#4b6f9e",
  },
};

function hierarchySvg(theme) {
  return Buffer.from(`<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
    <style>
      .sans { font-family: Arial, Helvetica, sans-serif; fill: ${theme.ink}; text-anchor: middle; }
      .serif { font-family: Georgia, 'Times New Roman', serif; fill: ${theme.ink}; text-anchor: middle; }
    </style>
    <text class="sans" x="512" y="355" font-size="24" letter-spacing="8">THE WEDDING OF</text>
    <text class="serif" x="512" y="520" font-size="82" font-style="italic">Alya &amp; Raka</text>
    <text class="sans" x="512" y="735" font-size="29" letter-spacing="6">12 · 12 · 2026</text>
    <text class="sans" x="512" y="914" font-size="20" letter-spacing="2" opacity="0.72">KEPADA YTH.</text>
    <text class="serif" x="512" y="965" font-size="31">Bapak/Ibu/Saudara/i</text>
    <rect x="287" y="1050" width="450" height="94" rx="47" fill="${theme.primary}"/>
    <text x="512" y="1110" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="3" fill="#ffffff" text-anchor="middle">BUKA UNDANGAN</text>
  </svg>`);
}

function safeAreaSvg(theme) {
  const zone = (y, h, label, color) => `<rect x="146" y="${y}" width="732" height="${h}" rx="18" fill="${color}" fill-opacity="0.10" stroke="${color}" stroke-width="4" stroke-dasharray="16 12"/><text x="168" y="${y + 32}" font-family="Arial" font-size="22" font-weight="700" fill="${color}">${label}</text>`;
  return Buffer.from(`<svg width="1024" height="1536" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1536" fill="#ffffff" fill-opacity="0.52"/>
    ${zone(305, 92, "KICKER", "#356859")}
    ${zone(420, 190, "COUPLE NAMES", "#8b3a62")}
    ${zone(635, 150, "DIVIDER + DATE", "#7b5a22")}
    ${zone(865, 140, "GUEST NAME", "#3d5b8a")}
    ${zone(1030, 140, "CTA", "#8a3d35")}
    <rect x="105" y="270" width="814" height="930" rx="28" fill="none" stroke="${theme.ink}" stroke-width="3" stroke-dasharray="8 12" opacity="0.4"/>
  </svg>`);
}

async function composePreview(background, theme, dividerFile, out) {
  const divider = await sharp(dividerFile).resize({ width: 220, height: 70, fit: "inside" }).toBuffer();
  await sharp(background)
    .resize(1024, 1536, { fit: "cover", position: "centre" })
    .composite([
      { input: hierarchySvg(theme), left: 0, top: 0 },
      { input: divider, left: 402, top: 610 },
    ])
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(out);
}

for (const [id, theme] of Object.entries(themes)) {
  const out = path.join(handoff, id, "v2");
  await fs.mkdir(out, { recursive: true });
  const standardPng = path.join(generated, theme.standard);
  const premiumPng = path.join(generated, theme.premium);
  const standard = path.join(out, "cover-standard.webp");
  const premium = path.join(out, "cover-premium.webp");

  await sharp(standardPng).resize(1024, 1536, { fit: "cover" }).webp({ quality: 89, effort: 6 }).toFile(standard);
  await sharp(premiumPng).resize(1024, 1536, { fit: "cover" }).webp({ quality: 89, effort: 6 }).toFile(premium);
  await fs.copyFile(standard, path.join(out, "cover-final.webp"));

  const dividerFile = path.join(handoff, id, "v1", "divider.webp");
  const standardPreview = path.join(out, "standard-preview.webp");
  const premiumPreview = path.join(out, "premium-preview.webp");
  await composePreview(standard, theme, dividerFile, standardPreview);
  await composePreview(premium, theme, dividerFile, premiumPreview);

  await sharp(standardPreview)
    .resize(480, 720, { fit: "cover" })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(out, "catalog-thumbnail.webp"));

  const safeGuide = path.join(out, "safe-area-guide.webp");
  await sharp(standard)
    .composite([{ input: safeAreaSvg(theme), left: 0, top: 0 }])
    .webp({ quality: 88, effort: 6 })
    .toFile(safeGuide);

  const panels = await Promise.all([standardPreview, premiumPreview, safeGuide].map(file =>
    sharp(file).resize(440, 660, { fit: "cover" }).toBuffer()
  ));
  const label = Buffer.from(`<svg width="1440" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="1440" height="80" fill="#f4f1ec"/><g font-family="Arial" font-size="22" font-weight="700" letter-spacing="3" fill="${theme.ink}" text-anchor="middle"><text x="250" y="49">STANDARD</text><text x="720" y="49">PREMIUM</text><text x="1190" y="49">SAFE AREAS</text></g></svg>`);
  await sharp({ create: { width: 1440, height: 740, channels: 4, background: { r: 244, g: 241, b: 236, alpha: 1 } } })
    .composite([
      { input: label, left: 0, top: 0 },
      { input: panels[0], left: 30, top: 80 },
      { input: panels[1], left: 500, top: 80 },
      { input: panels[2], left: 970, top: 80 },
    ])
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(out, "review-board.webp"));
}

console.log("Built seasonal v2 covers, thumbnails, safe-area guides, and review boards.");
