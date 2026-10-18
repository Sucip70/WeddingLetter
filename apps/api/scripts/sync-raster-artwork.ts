import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { RASTER_ARTWORK } from '../src/templates/artwork.js';
import { designById } from '../src/templates/themes.js';

// Memasang manifest artwork terbaru desain beraset raster (Sekar Keraton, Pusako Minang; aset di apps/web/public/themes/*)
// ke template "<Paket> <Nama Desain>" TANPA menyentuh bagian skema lain (tema, palet, gerbang, bagian, harga, status), dan
// menyamakan kategorinya dengan grup desain. Seed biasa tidak menimpa template yang sudah ada.
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  let total = 0;
  for (const [designId, make] of Object.entries(RASTER_ARTWORK)) {
    const design = designById(designId);
    if (!design) continue;
    const artwork = make();
    const rows = await prisma.template.findMany({ where: { name: { endsWith: ` ${design.name}` } }, select: { id: true, name: true, layoutSchema: true } });
    for (const row of rows) {
      const layout = (row.layoutSchema ?? {}) as Record<string, unknown>;
      await prisma.template.update({ where: { id: row.id }, data: { layoutSchema: { ...layout, artwork }, category: design.group } });
      console.log(`Artwork ${design.name} v${artwork.artworkVersion} dipasang: ${row.name}`);
      total++;
    }
  }
  if (!total) console.log('Tidak ada template raster di database (jalankan seed dulu).');
}

main().finally(() => prisma.$disconnect());
