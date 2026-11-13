const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const packageDir = path.join(
  root,
  'artwork-handoff',
  'jawa',
  'sekar-keraton',
  'pendopo-emas-raster',
);
const sourceDir = path.join(packageDir, 'source-renders');
const contentDir = path.join(
  root,
  'artwork-handoff',
  'jawa',
  'sekar-keraton',
  'content-raster',
);

function source(name) {
  return path.join(sourceDir, `${name}-source.png`);
}

async function keyToAlpha(inputPath, key) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const originalAlpha = data[i + 3];
    let matte;

    if (key === 'green') {
      const distance = Math.sqrt(r * r + (g - 255) ** 2 + b * b);
      if (distance <= 28) matte = 0;
      else if (distance >= 130) matte = 255;
      else matte = Math.round(((distance - 28) / 102) * 255);
      if (g > Math.max(r, b)) data[i + 1] = Math.max(r, b);
    } else {
      const brightness = Math.max(r, g, b);
      if (brightness <= 7) matte = 0;
      else if (brightness >= 36) matte = 255;
      else matte = Math.round(((brightness - 7) / 29) * 255);

      // Generated black-matte sources may contain a thin synthetic red key fringe.
      // Remove only the vivid fringe while preserving the intended deep-maroon inlay.
      if (r > 165 && g < 58 && b < 58) matte = 0;
    }

    data[i + 3] = Math.round((originalAlpha * matte) / 255);
  }

  removeSmallIslands(data, info.width, info.height, 300);
  if (key === 'black') contractAlphaEdge(data, info.width, info.height);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

function contractAlphaEdge(data, width, height) {
  const alpha = new Uint8Array(width * height);
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = data[i * 4 + 3];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (alpha[index] <= 18) continue;
      let touchesTransparent = false;
      for (let dy = -1; dy <= 1 && !touchesTransparent; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (alpha[(y + dy) * width + x + dx] <= 18) {
            touchesTransparent = true;
            break;
          }
        }
      }
      if (touchesTransparent) data[index * 4 + 3] = 0;
    }
  }
}

function removeSmallIslands(data, width, height, minimumSize) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);

  for (let start = 0; start < total; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= 18) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const current = queue[head++];
      const x = current % width;
      const y = Math.floor(current / width);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (visited[next] || data[next * 4 + 3] <= 18) continue;
          visited[next] = 1;
          queue[tail++] = next;
        }
      }
    }

    if (tail < minimumSize) {
      for (let i = 0; i < tail; i += 1) data[queue[i] * 4 + 3] = 0;
    }
  }
}

async function placeOnCanvas(buffer, width, height, options = {}) {
  const {
    fitWidth = width,
    fitHeight = height,
    gravity = 'centre',
    brightness = 1,
    saturation = 1,
  } = options;
  const trimmed = await sharp(buffer)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .resize({ width: fitWidth, height: fitHeight, fit: 'inside' })
    .modulate({ brightness, saturation })
    .png()
    .toBuffer();
  const metadata = await sharp(trimmed).metadata();

  let left = Math.round((width - metadata.width) / 2);
  let top = Math.round((height - metadata.height) / 2);
  if (gravity === 'north') top = 0;
  if (gravity === 'south') top = height - metadata.height;

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: trimmed, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writePair(name, pngBuffer) {
  await sharp(pngBuffer).toFile(path.join(packageDir, `${name}.png`));
  await sharp(pngBuffer)
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(packageDir, `${name}.webp`));
}

async function despillGreenBuffer(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && data[i + 1] > data[i] * 1.15 && data[i + 1] > data[i + 2] * 1.15) {
      data[i + 1] = Math.max(data[i], data[i + 2]);
    }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png().toBuffer();
}

async function build() {
  const required = [
    source('cover-golden-canopy'),
    source('cover-golden-footer'),
    source('photo-frame-gold'),
    source('divider-kawung-gold'),
  ];
  for (const file of required) {
    if (!fs.existsSync(file)) throw new Error(`Missing source: ${file}`);
  }

  const canopy = await placeOnCanvas(
    await keyToAlpha(source('cover-golden-canopy'), 'black'),
    1600,
    500,
    { fitWidth: 1600, fitHeight: 470, gravity: 'north', brightness: 0.88, saturation: 0.82 },
  );
  await writePair('cover-golden-canopy', canopy);

  const footer = await despillGreenBuffer(await placeOnCanvas(
    await keyToAlpha(source('cover-golden-footer'), 'green'),
    1600,
    360,
    { fitWidth: 1600, fitHeight: 330, gravity: 'south', brightness: 0.86, saturation: 0.8 },
  ));
  await writePair('cover-golden-footer', footer);

  const frame = await placeOnCanvas(
    await keyToAlpha(source('photo-frame-gold'), 'black'),
    1200,
    1600,
    { fitWidth: 1160, fitHeight: 1560, gravity: 'centre', brightness: 0.92, saturation: 0.84 },
  );
  await writePair('photo-frame-gold', frame);

  const divider = await despillGreenBuffer(await placeOnCanvas(
    await keyToAlpha(source('divider-kawung-gold'), 'green'),
    800,
    160,
    { fitWidth: 700, fitHeight: 120, gravity: 'centre', brightness: 0.9, saturation: 0.82 },
  ));
  await writePair('divider-kawung-gold', divider);

  const background = await sharp(path.join(contentDir, 'page-background.png'))
    .resize(1024, 1536, { fit: 'cover' })
    .modulate({ brightness: 0.98, saturation: 0.88 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(background).toFile(path.join(packageDir, 'cover-paper-background.png'));
  await sharp(background)
    .webp({ quality: 94, effort: 6 })
    .toFile(path.join(packageDir, 'cover-paper-background.webp'));

  const approvedPreview = path.join(contentDir, 'pendopo-emas-names-below-preview.png');
  await sharp(approvedPreview)
    .resize(390, 844, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(packageDir, 'approved-preview.png'));

  const outputs = [
    'cover-golden-canopy.png',
    'cover-golden-canopy.webp',
    'cover-golden-footer.png',
    'cover-golden-footer.webp',
    'photo-frame-gold.png',
    'photo-frame-gold.webp',
    'divider-kawung-gold.png',
    'divider-kawung-gold.webp',
    'cover-paper-background.png',
    'cover-paper-background.webp',
    'approved-preview.png',
  ];
  for (const name of outputs) {
    const file = path.join(packageDir, name);
    const metadata = await sharp(file).metadata();
    console.log(`${name}: ${metadata.width}x${metadata.height}, ${metadata.format}, alpha=${metadata.hasAlpha}`);
  }
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
