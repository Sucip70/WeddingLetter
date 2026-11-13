import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.join(process.cwd(), "artwork-handoff/musim");
const names = [
  "cover-background.webp",
  "cover-foreground.webp",
  "gate-background.webp",
  "gate-foreground.webp",
  "page-background.webp",
  "section-background.webp",
  "bottom-decoration.webp",
  "bottom-decoration.png",
  "divider.webp",
  "divider.png",
  "photo-frame.webp",
  "photo-frame.png",
  "thumbnail.webp",
  "production-preview.webp",
  "preview.webp",
];

for (const designId of ["semi", "panas", "gugur", "salju"]) {
  const folder = path.join(root, designId, "v1");
  const assets = [];
  for (const filename of names) {
    const file = path.join(folder, filename);
    const [metadata, stat] = await Promise.all([sharp(file).metadata(), fs.stat(file)]);
    assets.push({
      filename,
      width: metadata.width,
      height: metadata.height,
      sizeBytes: stat.size,
      contentType: metadata.format === "png" ? "image/png" : "image/webp",
      transparency: Boolean(metadata.hasAlpha),
    });
  }
  await fs.writeFile(
    path.join(folder, "inventory.json"),
    `${JSON.stringify({ designId, artworkVersion: 1, assets }, null, 2)}\n`,
  );
}

console.log("Generated Musim asset inventories.");
