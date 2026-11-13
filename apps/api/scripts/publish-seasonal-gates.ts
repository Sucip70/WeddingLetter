import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import sharp from 'sharp';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { StorageService } from '../src/storage/storage.service.js';
import { artworkManifestSchema, type ArtworkManifest, type ArtworkSlot } from '../src/templates/artwork.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_DIR = path.resolve(HERE, '../../../artwork-handoff/musim');
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const DESIGNS = ['semi', 'panas', 'gugur', 'salju'] as const;
const FILES = [
  { slot: 'gateBackground' as const, filename: 'gate-background.webp', contentType: 'image/webp' as const },
  { slot: 'gateTransition' as const, filename: 'transition-layer.png', contentType: 'image/png' as const },
  { slot: 'gateInteractive' as const, filename: 'interactive-object.png', contentType: 'image/png' as const },
];
type UploadedAsset = {
  slot: ArtworkSlot;
  variant: 'default';
  storageKey: string;
  contentType: (typeof FILES)[number]['contentType'];
  sizeBytes: number;
  width: number;
  height: number;
};
const REPLACED = new Set<ArtworkSlot>(['gateBackground', 'gateForeground', 'gateTransition', 'gateInteractive']);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const storage = new StorageService();

function designOf(layoutSchema: unknown) {
  const theme = (layoutSchema as Record<string, unknown>).theme as Record<string, unknown> | undefined;
  return theme?.motif ?? theme?.preset;
}

async function readAsset(designId: string, filename: string) {
  const localPath = path.join(HANDOFF_DIR, designId, 'premium-gate-redesign', filename);
  const body = await readFile(localPath);
  const metadata = await sharp(body, { failOn: 'warning', limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Aset gerbang tidak valid: ${localPath}`);
  return { body, width: metadata.width, height: metadata.height };
}

async function ensureObject(storageKey: string, body: Buffer, contentType: string) {
  const existing = await storage.head(storageKey);
  if (existing && existing.sizeBytes !== body.length) throw new Error(`Konflik objek immutable: ${storageKey}`);
  if (!existing) await storage.put(storageKey, body, contentType, CACHE_CONTROL);
}

async function validatePackage(designId: string) {
  const manifest = JSON.parse(await readFile(path.join(HANDOFF_DIR, designId, 'premium-gate-redesign', 'manifest.json'), 'utf8')) as Record<string, unknown>;
  if (manifest.designId !== designId || manifest.tier !== 'premium' || manifest.visualRevision !== 'premium-gate-redesign' || manifest.productionTextEmbedded !== false) {
    throw new Error(`Paket gerbang ${designId} tidak sesuai handoff yang disetujui`);
  }
  await readFile(path.join(HANDOFF_DIR, designId, 'premium-gate-redesign', 'motion-spec.md'), 'utf8');
}

async function publish(designId: (typeof DESIGNS)[number]) {
  await validatePackage(designId);
  const templates = await prisma.template.findMany({ where: { tier: 'PREMIUM' }, select: { id: true, layoutSchema: true, artworkVersion: { select: { manifest: true } } } });
  const matching = templates.filter(({ layoutSchema }) => designOf(layoutSchema) === designId);
  if (!matching.length) throw new Error(`Template Premium ${designId} tidak ditemukan`);
  const versions = await prisma.templateArtworkVersion.findMany({ where: { designId }, orderBy: { version: 'asc' } });
  // Warisi paket cover Premium terbaru. Bila artwork dasar berubah, hasilnya harus menjadi versi gerbang baru
  // dan tidak boleh mencoba mengubah versi gerbang immutable yang sudah ada.
  const latestPremiumBase = [...versions].reverse().find(({ manifest, status }) => {
    const parsed = artworkManifestSchema.safeParse(manifest);
    return status === 'PUBLISHED' && parsed.success
      && parsed.data.assets.coverBackground?.default?.storageKey?.endsWith('/cover-premium.webp')
      && parsed.data.assets.thumbnail?.default?.storageKey?.endsWith('/catalog-thumbnail-premium.webp');
  });
  const inherited = artworkManifestSchema.parse(latestPremiumBase?.manifest ?? matching[0].artworkVersion?.manifest ?? (matching[0].layoutSchema as Record<string, unknown>).artwork);
  const prepared = await Promise.all(FILES.map(async (file) => ({ ...file, ...(await readAsset(designId, file.filename)) })));
  const retained = Object.fromEntries(Object.entries(inherited.assets).filter(([slot]) => !REPLACED.has(slot as ArtworkSlot)));
  const manifestFor = (candidateVersion: number): ArtworkManifest => {
    const newAssets = Object.fromEntries(prepared.map(({ slot, filename, contentType, body, width, height }) => {
      const storageKey = `templates/${designId}/v${candidateVersion}/${filename}`;
      return [slot, { default: { url: storage.publicUrl(storageKey), storageKey, contentType, width, height, sizeBytes: body.length } }];
    }));
    return artworkManifestSchema.parse({ ...inherited, artworkVersion: candidateVersion, assets: { ...retained, ...newAssets } });
  };
  const existing = versions.find(({ version: candidateVersion, status, manifest: candidateManifest }) => {
    if (status !== 'PUBLISHED') return false;
    const parsed = artworkManifestSchema.safeParse(candidateManifest);
    return parsed.success
      && parsed.data.assets.gateInteractive?.default?.storageKey?.endsWith('/interactive-object.png')
      && parsed.data.assets.gateTransition?.default?.storageKey?.endsWith('/transition-layer.png')
      && isDeepStrictEqual(parsed.data, manifestFor(candidateVersion));
  });
  const version = existing?.version ?? ((versions.at(-1)?.version ?? 0) + 1);
  const manifest = manifestFor(version);

  await Promise.all(prepared.map(({ filename, contentType, body }) => ensureObject(`templates/${designId}/v${version}/${filename}`, body, contentType)));

  if (existing) {
    await prisma.$transaction(matching.map((template) => prisma.template.update({ where: { id: template.id }, data: { artworkVersionId: existing.id, layoutSchema: { ...(template.layoutSchema as object), artwork: manifest } } })));
    console.log(`${designId}: gate v${version} sudah sama`);
    return;
  }

  const uploaded: UploadedAsset[] = [];
  for (const asset of prepared) {
    const storageKey = `templates/${designId}/v${version}/${asset.filename}`;
    uploaded.push({ slot: asset.slot, variant: 'default', storageKey, contentType: asset.contentType, sizeBytes: asset.body.length, width: asset.width, height: asset.height });
  }
  await prisma.$transaction(async (tx) => {
    const created = await tx.templateArtworkVersion.create({ data: { designId, version, status: 'PUBLISHED', manifest, publishedAt: new Date(), assets: { create: uploaded } } });
    for (const template of matching) await tx.template.update({ where: { id: template.id }, data: { artworkVersionId: created.id, layoutSchema: { ...(template.layoutSchema as object), artwork: manifest } } });
  });
  console.log(`${designId}: Premium gate published v${version}`);
}

try {
  for (const designId of DESIGNS) await publish(designId);
} finally {
  await prisma.$disconnect();
}
