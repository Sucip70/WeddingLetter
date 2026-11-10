const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const sourceRoot = path.resolve('apps/web/public/themes/pusako-minang');
const targetRoot = path.join(sourceRoot, 'surat-bersegel-01');
const mastersRoot = path.resolve('.tmp/pusako-letter-gate-implementation-2026-11-10/raster-masters');
const layers = {
  'gate-cloth': ['gate-tile', 1024, 'opaque'],
  'letter-card': ['info-card', 896, 'opaque'],
  'post-left': ['gate-post-left', 323, 'transparent'],
  'post-right': ['gate-post-right', 323, 'transparent'],
  'gonjong-seal': ['gate-gonjong', 640, 'transparent'],
  'gold-divider': ['divider', 1000, 'transparent'],
  'gold-foundation': ['footer', 1200, 'transparent'],
};

async function main() {
  await fs.mkdir(targetRoot, { recursive: true });
  await fs.mkdir(mastersRoot, { recursive: true });
  const assets = {};
  for (const [name, [original, width, transparency]] of Object.entries(layers)) {
    const source = path.join(sourceRoot, `${original}.webp`);
    const target = path.join(targetRoot, `${name}.webp`);
    await sharp(source).resize({ width, withoutEnlargement: true })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(target);
    // Full-resolution raster masters remain separate and editable; never redraw the ornament.
    await sharp(source).png().toFile(path.join(mastersRoot, `${name}.png`));
    const metadata = await sharp(target).metadata();
    assets[name] = {
      url: `/themes/pusako-minang/surat-bersegel-01/${name}.webp`,
      width: metadata.width, height: metadata.height,
      sizeBytes: (await fs.stat(target)).size, transparency,
      source: `/themes/pusako-minang/${original}.webp`,
    };
  }
  const manifest = {
    designId: 'pusako-minang', visualRevision: 'surat-bersegel-01',
    packageKind: 'renderer-supplement', productionText: false,
    note: 'Visual revision only. Existing database artwork versions are not reassigned.',
    assets,
    geometry: {
      letter: { left: '10%', right: '10%', top: '8%', bottom: '23%', borderSlice: 135, borderWidth: 14 },
      text: { left: '18%', right: '18%', top: '15.5%', bottom: '35%' },
      seal: { left: '21%', right: '21%', top: '68.5%' },
    },
    motion: { durationMs: 1650, paperAndPosts: 'split-left-right', delayMs: 230, reduced: 'fade-only' },
    neverStack: ['old floating gonjong', 'old pulsing CTA', 'old gate glow', 'upgrade-scroll-01 canopy or couple illustrations'],
  };
  await fs.writeFile(path.join(targetRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ targetRoot, mastersRoot, count: Object.keys(assets).length, webpBytes: Object.values(assets).reduce((n, a) => n + a.sizeBytes, 0) }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
