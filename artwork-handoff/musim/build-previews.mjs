import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "artwork-handoff/musim");
const ids = ["semi", "panas", "gugur", "salju"];

async function panel(base, backgroundName, overlays) {
  const width = 360;
  const height = 540;
  const background = await sharp(path.join(base, backgroundName))
    .resize(width, height, { fit: "cover", position: "centre" })
    .toBuffer();
  const composites = [];
  for (const overlay of overlays) {
    const image = await sharp(path.join(base, overlay.name))
      .resize({ width: overlay.width, height: overlay.height, fit: "inside", withoutEnlargement: true })
      .toBuffer();
    composites.push({ input: image, left: overlay.left, top: overlay.top });
  }
  return sharp(background).composite(composites).webp({ quality: 88, alphaQuality: 100 }).toBuffer();
}

for (const id of ids) {
  const base = path.join(root, id, "v1");
  const cover = await panel(base, "cover-background.webp", [
    { name: "cover-foreground.webp", width: 360, height: 200, left: 0, top: 340 },
  ]);
  const gate = await panel(base, "gate-background.webp", [
    { name: "gate-foreground.webp", width: 360, height: 185, left: 0, top: 355 },
  ]);
  const content = await panel(base, "page-background.webp", [
    { name: "photo-frame.webp", width: 205, height: 290, left: 78, top: 65 },
    { name: "divider.webp", width: 205, height: 45, left: 78, top: 390 },
    { name: "bottom-decoration.webp", width: 360, height: 120, left: 0, top: 420 },
  ]);

  await sharp({
    create: { width: 1180, height: 590, channels: 4, background: { r: 244, g: 241, b: 236, alpha: 1 } },
  })
    .composite([
      { input: cover, left: 25, top: 25 },
      { input: gate, left: 410, top: 25 },
      { input: content, left: 795, top: 25 },
    ])
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(base, "production-preview.webp"));
}

console.log("Built Musim production previews.");
