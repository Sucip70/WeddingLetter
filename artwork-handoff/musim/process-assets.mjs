import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generated = "C:/Users/ThinkPad/.codex/generated_images/01a1309b-e37e-7b92-880a-a8b0e6c9a1d0";
const seasonal = path.join(root, "apps/web/public/themes/seasonal");
const handoff = path.join(root, "artwork-handoff/musim");

const themes = {
  semi: {
    existingCover: "spring-bg.webp",
    existingForeground: "spring-fg.webp",
    gate: "exec-755db2fe-26ad-457b-99b7-b68599404c95.png",
    page: "exec-87beaba5-1205-4c40-9497-922ed6431be2.png",
    foreground: "exec-258a91dc-026d-4240-9c1b-05c34031b3b5.png",
    key: [0, 102, 255],
    divider: "exec-82cc34c5-5deb-4744-a27e-e4032523a305.png",
    dividerKey: [0, 102, 255],
    frame: "exec-cb855509-5825-4551-a243-8c62eedeb8e4.png",
  },
  panas: {
    generatedCover: "exec-be871e30-8286-4f5c-a9b0-d1a12f7f6775.png",
    gate: "exec-b4d047d1-4592-4d20-9cc1-53e6279a2b50.png",
    page: "exec-c67fab1f-578f-432f-933a-d75a974b557d.png",
    foreground: "exec-4d276bf4-d8ca-4ebb-9b47-f29815af0d15.png",
    key: [255, 0, 255],
    divider: "exec-5a7a65a8-df8d-4c60-a1ef-2230f8724ba5.png",
    frame: "exec-c9016d5c-1429-4721-aeb0-58f952e795ed.png",
  },
  gugur: {
    existingCover: "autumn-bg.webp",
    existingForeground: "autumn-fg.webp",
    gate: "exec-362b2be0-e803-497f-be74-50288f52f0cf.png",
    page: "exec-d22e8ae5-34a0-43ab-8cc9-14f5532c06c4.png",
    foreground: "exec-3356951e-dfe2-4c1b-94e4-e39047b51944.png",
    key: [0, 255, 255],
    divider: "exec-cad68b32-7b08-41cf-88ad-830c12694af3.png",
    frame: "exec-4d37dba0-caed-4452-b7ad-7dae2e70cb95.png",
  },
  salju: {
    existingCover: "winter-bg.webp",
    existingForeground: "winter-fg.webp",
    gate: "exec-e329d369-9819-47eb-94ee-f9a0ff9711aa.png",
    page: "exec-04892557-3689-41af-8ebc-3491a130baef.png",
    foreground: "exec-858d190a-85e9-431e-bb96-1deac43c6c73.png",
    key: [255, 0, 255],
    divider: "exec-3dbc52b3-9aaf-4338-a9f7-d5f55b633f3e.png",
    frame: "exec-ddc01a5b-c045-4ada-b9f9-d4dbad5da837.png",
  },
};

async function chromaToAlpha(input, output, key) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [kr, kg, kb] = key;
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - kr;
    const dg = data[i + 1] - kg;
    const db = data[i + 2] - kb;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    const matte = Math.max(0, Math.min(255, Math.round((distance - 42) * (255 / 76))));
    data[i + 3] = Math.min(data[i + 3], matte);
  }
  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .png({ compressionLevel: 9 })
    .toFile(output);
}

async function transparentWebp(input, output, width) {
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 91, alphaQuality: 100, effort: 6 })
    .toFile(output);
}

const selectedThemes = new Set(process.argv.slice(2));

for (const [id, theme] of Object.entries(themes)) {
  if (selectedThemes.size > 0 && !selectedThemes.has(id)) continue;
  const out = path.join(handoff, id, "v1");
  await fs.mkdir(out, { recursive: true });

  const coverSource = theme.existingCover
    ? path.join(seasonal, theme.existingCover)
    : path.join(generated, theme.generatedCover);
  await sharp(coverSource)
    .resize(1024, 1536, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(out, "cover-background.webp"));

  await sharp(path.join(generated, theme.gate))
    .resize(1024, 1536, { fit: "cover", position: "centre" })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(out, "gate-background.webp"));

  await sharp(path.join(generated, theme.page))
    .resize(1024, 1536, { fit: "cover", position: "centre" })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(out, "page-background.webp"));

  await sharp(path.join(generated, theme.page))
    .resize(1024, 1024, { fit: "cover", position: "centre" })
    .webp({ quality: 84, effort: 6 })
    .toFile(path.join(out, "section-background.webp"));

  const foregroundPng = path.join(out, "bottom-decoration.png");
  await chromaToAlpha(path.join(generated, theme.foreground), foregroundPng, theme.key);
  await transparentWebp(foregroundPng, path.join(out, "bottom-decoration.webp"), 1200);
  await fs.copyFile(path.join(out, "bottom-decoration.webp"), path.join(out, "gate-foreground.webp"));

  if (theme.existingForeground) {
    await fs.copyFile(path.join(seasonal, theme.existingForeground), path.join(out, "cover-foreground.webp"));
  } else {
    await fs.copyFile(path.join(out, "bottom-decoration.webp"), path.join(out, "cover-foreground.webp"));
  }

  const dividerPng = path.join(out, "divider.png");
  if (theme.dividerKey) {
    await chromaToAlpha(path.join(generated, theme.divider), dividerPng, theme.dividerKey);
  } else {
    await sharp(path.join(generated, theme.divider))
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
      .png({ compressionLevel: 9 })
      .toFile(dividerPng);
  }
  await transparentWebp(dividerPng, path.join(out, "divider.webp"), 900);

  const framePng = path.join(out, "photo-frame.png");
  await sharp(path.join(generated, theme.frame))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .resize({ width: 960, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(framePng);
  await transparentWebp(framePng, path.join(out, "photo-frame.webp"), 960);

  await sharp(path.join(out, "cover-background.webp"))
    .resize(480, 720, { fit: "cover", position: "centre" })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(out, "thumbnail.webp"));

  const contact = path.join(out, `${id}-contact-sheet.png`);
  try {
    await fs.access(contact);
    await sharp(contact).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(path.join(out, "preview.webp"));
  } catch {
    // A missing contact sheet should not block production asset processing.
  }
}

console.log("Processed Musim artwork handoff assets.");
