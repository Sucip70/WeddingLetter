import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { sekarKeratonArtwork } from '../src/templates/artwork.js';
import { designById } from '../src/templates/themes.js';

// Memasang manifest artwork Sekar Keraton terbaru (assets raster di apps/web/public/themes/sekar-keraton) ke semua template
// "* Sekar Keraton" (dan menyamakan kategorinya dengan grup desain, 'suku') TANPA menyentuh bagian skema lain (tema, palet, gerbang, bagian, harga, status). Seed biasa tidak menimpa
// template yang sudah ada, dan SEED_OVERWRITE_SEKAR_KERATON=1 menimpa seluruh layoutSchema.
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const artwork = sekarKeratonArtwork();
  const rows = await prisma.template.findMany({ where: { name: { endsWith: ' Sekar Keraton' } }, select: { id: true, name: true, layoutSchema: true } });
  for (const row of rows) {
    const layout = (row.layoutSchema ?? {}) as Record<string, unknown>;
    await prisma.template.update({ where: { id: row.id }, data: { layoutSchema: { ...layout, artwork }, category: designById('jawa-sekar-keraton')?.group } });
    console.log(`Artwork Sekar Keraton v${artwork.artworkVersion} dipasang: ${row.name}`);
  }
  if (!rows.length) console.log('Tidak ada template Sekar Keraton.');
}

main().finally(() => prisma.$disconnect());
