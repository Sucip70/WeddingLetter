const path = require('path');
const sharp = require('sharp');

const root = path.resolve(
  __dirname,
  '..',
  'artwork-handoff',
  'chinese-indonesian',
  'peranakan-seruni',
  'content-raster',
);
const sources = path.join(root, 'source-renders-v2');

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

async function blackToAlpha(inputName, outputName, threshold = 10, maskFn = null) {
  const input = path.join(sources, inputName);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const maximum = Math.max(r, g, b);
      let alpha = Math.max(0, Math.min(255, ((maximum - threshold) / (255 - threshold)) * 255));
      alpha = Math.pow(alpha / 255, 0.82) * 255;
      if (maskFn && !maskFn(x, y, info.width, info.height, r, g, b)) alpha = 0;
      data[index + 3] = Math.round(alpha);
    }
  }

  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(path.join(root, outputName));
}

async function cardToAlpha() {
  const input = path.join(sources, 'info-card-v2-source.png');
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const polygon = [
    [140, 120], [884, 120], [884, 126], [922, 151], [922, 176],
    [958, 197], [958, 1315], [929, 1315], [929, 1340], [884, 1384],
    [140, 1384], [95, 1340], [95, 1315], [66, 1315], [66, 197],
    [102, 176], [102, 151], [140, 126],
  ];

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      data[index + 3] = pointInPolygon(x, y, polygon) ? 255 : 0;
    }
  }

  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(path.join(root, 'info-card-v2.png'));
}

function photoFrameMask(x, y, width, height, r, g, b) {
  const top = y >= 105 && y <= 255 && x >= 35 && x <= width - 35;
  const bottom = y >= height - 350 && y <= height - 145 && x >= 35 && x <= width - 35;
  const left = x >= 35 && x <= 185 && y >= 105 && y <= height - 145;
  const right = x >= width - 185 && x <= width - 35 && y >= 105 && y <= height - 145;
  const frameZone = top || bottom || left || right;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return frameZone && (Math.max(r, g, b) > 112 || chroma > 54);
}

async function run() {
  await Promise.all([
    cardToAlpha(),
    blackToAlpha('lantern-pair-v2-source.png', 'ornament-lantern-pair-v2.png', 12),
    blackToAlpha('koi-bottom-v2-source.png', 'ornament-koi-bottom-v2.png', 14),
    blackToAlpha('divider-fan-v2-source.png', 'divider-fan-v2.png', 8),
    blackToAlpha('double-happiness-v2-source.png', 'section-marker-double-happiness-v2.png', 8),
    blackToAlpha('firecracker-coins-v2-source.png', 'ornament-firecracker-coins-v2.png', 12),
    blackToAlpha('photo-frame-v2-source.png', 'photo-frame-v2.png', 28, photoFrameMask),
  ]);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
