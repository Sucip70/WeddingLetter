const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..', 'artwork-handoff', 'india', 'vivaha-rani');
const gate = path.join(root, 'gate-raster');
const content = path.join(root, 'content-raster');

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

async function blackToAlpha(input, output, threshold = 8, mask = null) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const maximum = Math.max(r, g, b);
      let alpha = Math.max(0, Math.min(255, ((maximum - threshold) / (255 - threshold)) * 255));
      alpha = Math.pow(alpha / 255, 0.8) * 255;
      if (mask && !mask(x, y, info.width, info.height, r, g, b)) alpha = 0;
      data[i + 3] = Math.round(alpha);
    }
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
}

async function buildPanels() {
  const input = path.join(gate, 'source-renders', 'left-panel-source.png');
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      data[i + 3] = x <= 515 ? 255 : 0;
    }
  }
  const left = path.join(gate, 'left-panel.png');
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(left);
  await sharp(left).flop().png({ compressionLevel: 9 }).toFile(path.join(gate, 'right-panel.png'));
}

async function buildInfoCard() {
  const input = path.join(content, 'source-renders', 'info-card-source.png');
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const shape = [
    [115, 164], [909, 164], [942, 200], [942, 1340], [912, 1372],
    [112, 1372], [82, 1340], [82, 200],
  ];
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 4;
      data[i + 3] = pointInPolygon(x, y, shape) ? 255 : 0;
    }
  }
  await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(path.join(content, 'info-card.png'));
}

function photoFrameMask(x, y, width, height, r, g, b) {
  const top = y >= 80 && y <= 355;
  const bottom = y >= height - 360 && y <= height - 130;
  const left = x >= 25 && x <= 210 && y >= 80 && y <= height - 130;
  const right = x >= width - 210 && x <= width - 25 && y >= 80 && y <= height - 130;
  const zone = top || bottom || left || right;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return zone && (Math.max(r, g, b) > 105 || chroma > 50);
}

async function run() {
  await buildPanels();
  await Promise.all([
    blackToAlpha(
      path.join(gate, 'source-renders', 'interactive-rosette-source.png'),
      path.join(gate, 'interactive-genda-rosette.png'),
      7,
    ),
    buildInfoCard(),
    blackToAlpha(
      path.join(content, 'source-renders', 'divider-paisley-source.png'),
      path.join(content, 'divider-paisley.png'),
      7,
    ),
    blackToAlpha(
      path.join(content, 'source-renders', 'bottom-zardozi-source.png'),
      path.join(content, 'bottom-zardozi.png'),
      8,
    ),
    blackToAlpha(
      path.join(content, 'source-renders', 'photo-frame-source.png'),
      path.join(content, 'photo-frame.png'),
      24,
      photoFrameMask,
    ),
  ]);

  await sharp(path.join(gate, 'interactive-genda-rosette.png'))
    .resize(512, 512, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(content, 'section-marker-genda.png'));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
