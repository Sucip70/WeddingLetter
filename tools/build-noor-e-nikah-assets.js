const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..', 'artwork-handoff', 'pakistan', 'noor-e-nikah');
const gate = path.join(root, 'gate-raster');
const content = path.join(root, 'content-raster');

function insidePolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

async function blackToAlpha(input, output, threshold = 8, mask = null) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const maximum = Math.max(r, g, b);
      let alpha = Math.max(0, Math.min(255, ((maximum - threshold) / (255 - threshold)) * 255));
      alpha = Math.pow(alpha / 255, 0.8) * 255;
      if (mask && !mask(x, y, info.width, info.height, r, g, b)) alpha = 0;
      data[index + 3] = Math.round(alpha);
    }
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
}

async function buildPanels() {
  const source = path.join(gate, 'source-renders', 'left-panel-source.png');
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      data[index + 3] = x <= 528 ? 255 : 0;
    }
  }
  const leftPath = path.join(gate, 'left-panel.png');
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(leftPath);
  await sharp(leftPath).flop().png({ compressionLevel: 9 }).toFile(path.join(gate, 'right-panel.png'));
}

async function buildInfoCard() {
  const input = path.join(content, 'source-renders', 'info-card-source.png');
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const silhouette = [
    [512, 22], [630, 125], [730, 170], [850, 270], [985, 302],
    [985, 1465], [39, 1465], [39, 302], [174, 270], [294, 170], [394, 125],
  ];
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * 4;
      data[index + 3] = insidePolygon(x, y, silhouette) ? 255 : 0;
    }
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(path.join(content, 'info-card.png'));
}

function photoFrameMask(x, y, width, height, r, g, b) {
  const top = y >= 20 && y <= 335;
  const bottom = y >= height - 245 && y <= height - 55;
  const left = x >= 18 && x <= 205 && y >= 20 && y <= height - 55;
  const right = x >= width - 205 && x <= width - 18 && y >= 20 && y <= height - 55;
  const zone = top || bottom || left || right;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return zone && (Math.max(r, g, b) > 100 || chroma > 45);
}

async function run() {
  await buildPanels();
  await Promise.all([
    blackToAlpha(
      path.join(gate, 'source-renders', 'interactive-rosette-source.png'),
      path.join(gate, 'interactive-jali-rosette.png'),
      7,
    ),
    buildInfoCard(),
    blackToAlpha(
      path.join(content, 'source-renders', 'divider-jali-source.png'),
      path.join(content, 'divider-jali.png'),
      7,
    ),
    blackToAlpha(
      path.join(content, 'source-renders', 'bottom-inlay-source.png'),
      path.join(content, 'bottom-inlay.png'),
      8,
    ),
    blackToAlpha(
      path.join(content, 'source-renders', 'photo-frame-source.png'),
      path.join(content, 'photo-frame.png'),
      24,
      photoFrameMask,
    ),
  ]);

  await sharp(path.join(gate, 'interactive-jali-rosette.png'))
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(content, 'section-marker-jali.png'));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
