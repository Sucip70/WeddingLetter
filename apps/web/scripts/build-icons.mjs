// Approved Surat Janji raster master; no SVG. Run: npm run icons --workspace=web
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...parts) => path.join(root, ...parts);
const ivory = '#fbf7f1';
const mark = await sharp(out('public/brand/surat-janji-master.png')).trim().png().toBuffer();
const logo = await sharp(mark).resize(512, 512, { fit: 'contain', background: '#00000000' }).png().toBuffer();
mkdirSync(out('public/brand'), { recursive: true });
writeFileSync(out('public/brand/logo-mark.png'), logo);
const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += info.channels) {
  data[i] = 251;
  data[i + 1] = 247;
  data[i + 2] = 241;
}
writeFileSync(out('public/brand/logo-mark-light.png'), await sharp(data, { raw: info }).png().toBuffer());

async function icon(size, fraction = 0.76) {
  const artwork = await sharp(mark).resize(Math.round(size * fraction), Math.round(size * fraction), { fit: 'inside' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: ivory } })
    .composite([{ input: artwork, gravity: 'centre' }]).png({ compressionLevel: 9 }).toBuffer();
}

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

writeFileSync(out('src/app/icon.png'), await icon(512));
writeFileSync(out('src/app/apple-icon.png'), await icon(180));
writeFileSync(out('public/icon-192.png'), await icon(192));
writeFileSync(out('public/icon-512.png'), await icon(512));
// Keep the entire symbol inside the maskable icon central safe circle.
writeFileSync(out('public/icon-maskable-512.png'), await icon(512, 0.56));
writeFileSync(out('src/app/favicon.ico'), ico(await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await icon(size, 0.88) })),
)));
console.log('Surat Janji raster logo, favicon, Apple and PWA icons generated.');
