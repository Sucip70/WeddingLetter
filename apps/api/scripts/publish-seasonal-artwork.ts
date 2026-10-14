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

const DESIGNS = [
  { designId: 'semi', fallback: { ornament: 'sakura', coverEffect: 'none', particle: 'petal' } },
  { designId: 'panas', fallback: { ornament: 'sparkle', coverEffect: 'none', particle: 'bubble' } },
  { designId: 'gugur', fallback: { ornament: 'autumn', coverEffect: 'none', particle: 'maple' } },
  { designId: 'salju', fallback: { ornament: 'winter', coverEffect: 'none', particle: 'snow' } },
] as const;
const TIERS = [
  { tier: 'STANDARD', suffix: 'standard', motion: 'none' },
  { tier: 'PREMIUM', suffix: 'premium', motion: 'breathe' },
] as const;
const REPLACED_SLOTS = new Set<ArtworkSlot>(['coverBackground', 'coverForeground', 'thumbnail']);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const storage = new StorageService();

function templateDesign(layoutSchema: unknown) {
  const layout = layoutSchema as Record<string, unknown>;
  const theme = layout.theme as Record<string, unknown> | undefined;
  return theme?.motif ?? theme?.preset;
}

async function readFinalAsset(designId: string, filename: string) {
  const localPath = path.join(HANDOFF_DIR, designId, 'v2-final', filename);
  const body = await readFile(localPath);
  const metadata = await sharp(body, { failOn: 'warning', limitInputPixels: 40_000_000 }).metadata();
  if (metadata.format !== 'webp' || !metadata.width || !metadata.height) throw new Error(`Artwork tidak valid: ${localPath}`);
  return { body, width: metadata.width, height: metadata.height };
}

async function ensureObject(storageKey: string, body: Buffer, contentType: string) {
  const existing = await storage.head(storageKey);
  if (existing && existing.sizeBytes !== body.length) throw new Error(`Konflik objek immutable: ${storageKey}`);
  if (!existing) await storage.put(storageKey, body, contentType, CACHE_CONTROL);
}

async function ensureRetainedAssets(designId: string, assets: ArtworkManifest['assets']) {
  for (const layer of Object.values(assets)) {
    if (!layer) continue;
    for (const source of Object.values(layer)) {
      if (!source?.storageKey) throw new Error(`Aset turunan ${designId} tidak memiliki storageKey R2`);
      const expectedUrl = storage.publicUrl(source.storageKey);
      if (source.url !== expectedUrl || !expectedUrl.startsWith('https://') || /localhost|127\.0\.0\.1/i.test(expectedUrl)) {
        throw new Error(`URL aset bukan URL publik R2: ${source.url}`);
      }
      const filename = path.basename(source.storageKey);
      const body = await readFile(path.join(HANDOFF_DIR, designId, 'v1', filename));
      if (source.sizeBytes !== body.length) throw new Error(`Ukuran aset lokal tidak cocok dengan manifest immutable: ${source.storageKey}`);
      await ensureObject(source.storageKey, body, source.contentType);
    }
  }
}

async function uploadAsset(designId: string, version: number, slot: ArtworkSlot, filename: string) {
  const { body, width, height } = await readFinalAsset(designId, filename);
  const storageKey = `templates/${designId}/v${version}/${filename}`;
  await ensureObject(storageKey, body, 'image/webp');
  const source = { url: storage.publicUrl(storageKey), storageKey, contentType: 'image/webp' as const, width, height, sizeBytes: body.length };
  return { slot, variant: 'default', storageKey, contentType: 'image/webp' as const, sizeBytes: body.length, width, height, source };
}

async function validateHandoff(designId: string) {
  const raw = JSON.parse(await readFile(path.join(HANDOFF_DIR, designId, 'v2-final', 'manifest.json'), 'utf8')) as Record<string, unknown>;
  if (raw.designId !== designId || raw.visualRevision !== 'v2-final' || raw.productionTextEmbedded !== false) {
    throw new Error(`Manifest handoff ${designId} bukan paket final text-free yang disetujui`);
  }
}

async function publishTier(design: (typeof DESIGNS)[number], tierSpec: (typeof TIERS)[number]) {
  const templates = await prisma.template.findMany({ where: { tier: tierSpec.tier }, select: { id: true, layoutSchema: true, artworkVersion: { select: { manifest: true } } } });
  const matching = templates.filter(({ layoutSchema }) => templateDesign(layoutSchema) === design.designId);
  if (!matching.length) {
    console.log(`${design.designId}/${tierSpec.tier}: tidak ada template, dilewati`);
    return;
  }

  const coverFilename = `cover-${tierSpec.suffix}.webp`;
  const thumbnailFilename = `catalog-thumbnail-${tierSpec.suffix}.webp`;
  const versions = await prisma.templateArtworkVersion.findMany({ where: { designId: design.designId }, orderBy: { version: 'asc' } });
  const alreadyPublished = versions.find(({ manifest }) => {
    const parsed = artworkManifestSchema.safeParse(manifest);
    return parsed.success && parsed.data.assets.coverBackground?.default?.storageKey?.endsWith(`/${coverFilename}`)
      && parsed.data.assets.thumbnail?.default?.storageKey?.endsWith(`/${thumbnailFilename}`);
  });
  const version = alreadyPublished?.version ?? ((versions.at(-1)?.version ?? 0) + 1);

  const inherited = artworkManifestSchema.safeParse(alreadyPublished?.manifest ?? matching[0].artworkVersion?.manifest ?? (matching[0].layoutSchema as Record<string, unknown>).artwork);
  const retainedAssets = inherited.success
    ? Object.fromEntries(Object.entries(inherited.data.assets).filter(([slot]) => !REPLACED_SLOTS.has(slot as ArtworkSlot)))
    : {};
  const files = [
    { slot: 'coverBackground' as const, filename: coverFilename },
    { slot: 'thumbnail' as const, filename: thumbnailFilename },
  ];
  const prepared = await Promise.all(files.map(({ filename }) => readFinalAsset(design.designId, filename).then((asset) => ({ filename, ...asset }))));
  const sources = Object.fromEntries(prepared.map(({ filename, body, width, height }, index) => {
    const storageKey = `templates/${design.designId}/v${version}/${filename}`;
    return [files[index].slot, { default: { url: storage.publicUrl(storageKey), storageKey, contentType: 'image/webp' as const, width, height, sizeBytes: body.length } }];
  }));
  const manifest: ArtworkManifest = artworkManifestSchema.parse({
    schemaVersion: 1,
    designId: design.designId,
    artworkVersion: version,
    assets: { ...retainedAssets, ...sources },
    presentation: {
      backgroundFit: 'cover', backgroundPosition: 'center-top', foregroundPosition: 'bottom-center',
      foregroundMotion: tierSpec.motion, showOnOrnamentCover: true, showOnPhotoCover: false,
    },
    fallback: design.fallback,
  });

  await ensureRetainedAssets(design.designId, retainedAssets);
  await Promise.all(prepared.map(({ filename, body }) => ensureObject(`templates/${design.designId}/v${version}/${filename}`, body, 'image/webp')));

  if (alreadyPublished) {
    if (alreadyPublished.status !== 'PUBLISHED' || !isDeepStrictEqual(artworkManifestSchema.parse(alreadyPublished.manifest), manifest)) {
      throw new Error(`Konflik paket ${design.designId}/${tierSpec.tier} pada v${version}`);
    }
    await prisma.$transaction(matching.map((template) => prisma.template.update({
      where: { id: template.id },
      data: { artworkVersionId: alreadyPublished.id, thumbnailUrl: manifest.assets.thumbnail?.default?.url, layoutSchema: { ...(template.layoutSchema as object), artwork: manifest } },
    })));
    console.log(`${design.designId}/${tierSpec.tier}: v${version} sudah sama, ${matching.length} template dipastikan terhubung`);
    return;
  }

  const uploaded = await Promise.all(files.map(({ slot, filename }) => uploadAsset(design.designId, version, slot, filename)));
  await prisma.$transaction(async (tx) => {
    const created = await tx.templateArtworkVersion.create({
      data: {
        designId: design.designId, version, status: 'PUBLISHED', manifest, publishedAt: new Date(),
        assets: { create: uploaded.map(({ source: _source, ...asset }) => asset) },
      },
    });
    for (const template of matching) {
      await tx.template.update({
        where: { id: template.id },
        data: { artworkVersionId: created.id, thumbnailUrl: manifest.assets.thumbnail?.default?.url, layoutSchema: { ...(template.layoutSchema as object), artwork: manifest } },
      });
    }
  });
  console.log(`${design.designId}/${tierSpec.tier}: published v${version}, ${matching.length} template`);
}

try {
  for (const design of DESIGNS) {
    await validateHandoff(design.designId);
    for (const tier of TIERS) await publishTier(design, tier);
  }
} finally {
  await prisma.$disconnect();
}
