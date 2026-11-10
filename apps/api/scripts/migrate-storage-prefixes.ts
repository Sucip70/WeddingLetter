import 'dotenv/config';
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client.js';
import { defaultDemoPhotoKey, invitationMediaKey, safeSegment } from '../src/storage/storage-keys.js';

type JsonValue = Prisma.InputJsonValue;
type Move = { oldKey: string; newKey: string; owner: string };

const apply = process.argv.includes('--apply');
const deleteLegacy = process.argv.includes('--delete-legacy');
if (deleteLegacy && !apply) throw new Error('--delete-legacy hanya boleh dipakai bersama --apply');

const env = process.env;
for (const name of ['DATABASE_URL', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'] as const) {
  if (!env[name]) throw new Error(`${name} wajib diisi`);
}

const bucket = env.R2_BUCKET_NAME ?? 'weddingletter-media';
const publicBase = env.R2_PUBLIC_URL!.replace(/\/$/, '');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
});
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL! }) });

function ext(key: string) {
  return key.split('.').pop()?.toLowerCase() || 'bin';
}

function basename(key: string) {
  return key.split('/').pop() || `asset.${ext(key)}`;
}

function keyFromUrl(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith(`${publicBase}/`)) return null;
  return value.slice(publicBase.length + 1).split(/[?#]/, 1)[0] || null;
}

function publicUrl(key: string) {
  return `${publicBase}/${key}`;
}

function designId(layout: unknown) {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) return 'unassigned';
  const theme = (layout as Record<string, unknown>).theme;
  if (!theme || typeof theme !== 'object' || Array.isArray(theme)) return 'unassigned';
  const raw = (theme as Record<string, unknown>).motif || (theme as Record<string, unknown>).preset;
  return safeSegment(typeof raw === 'string' ? raw : undefined);
}

function samplePhotos(layout: unknown) {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) return {} as Record<string, unknown>;
  const value = (layout as Record<string, unknown>).samplePhotos;
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function musicPresets(layout: unknown) {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) return [] as Array<Record<string, unknown>>;
  const music = (layout as Record<string, unknown>).musik;
  if (!music || typeof music !== 'object' || Array.isArray(music)) return [];
  const presets = (music as Record<string, unknown>).presets;
  return Array.isArray(presets) ? presets.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)) : [];
}

function replaceJson(value: unknown, moves: Map<string, string>): unknown {
  if (typeof value === 'string') {
    if (moves.has(value)) return moves.get(value)!;
    for (const [oldKey, newKey] of moves) {
      if (value === oldKey) return newKey;
      const oldUrl = publicUrl(oldKey);
      if (value === oldUrl || value.startsWith(`${oldUrl}?`) || value.startsWith(`${oldUrl}#`)) return `${publicUrl(newKey)}${value.slice(oldUrl.length)}`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => replaceJson(item, moves));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceJson(item, moves)]));
  }
  return value;
}

async function head(key: string) {
  try {
    const result = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { size: result.ContentLength ?? 0, etag: result.ETag ?? null };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || (error as Error).name === 'NotFound' || (error as Error).name === 'NoSuchKey') return null;
    throw error;
  }
}

function register(list: Move[], oldKey: string | null, newKey: string, owner: string) {
  if (!oldKey || oldKey === newKey) return;
  const conflict = list.find((move) => move.oldKey === oldKey && move.newKey !== newKey);
  if (conflict) throw new Error(`Satu object memiliki dua tujuan: ${oldKey} -> ${conflict.newKey} / ${newKey}`);
  if (!list.some((move) => move.oldKey === oldKey && move.newKey === newKey)) list.push({ oldKey, newKey, owner });
}

async function main() {
  const [media, tracks, demos, templates, versions, invitations] = await Promise.all([
    prisma.mediaFile.findMany(),
    prisma.musicTrack.findMany(),
    prisma.demoPhoto.findMany(),
    prisma.template.findMany(),
    prisma.templateArtworkVersion.findMany(),
    prisma.invitation.findMany({ select: { id: true, layout: true } }),
  ]);

  const moves: Move[] = [];
  for (const item of media) {
    const target = invitationMediaKey({ invitationId: item.invitationId, mediaId: item.id, type: item.type, extension: ext(item.storageKey) });
    register(moves, item.storageKey, target, `media:${item.id}`);
  }
  for (const track of tracks) register(moves, track.storageKey, `music/library/${track.id}.${ext(track.storageKey)}`, `music:${track.id}`);
  for (const demo of demos) {
    const target = demo.storageKey.endsWith('.svg')
      ? defaultDemoPhotoKey(demo.slot)
      : `system/demo/uploads/${safeSegment(demo.slot)}/${basename(demo.storageKey)}`;
    register(moves, demo.storageKey, target, `demo:${demo.slot}`);
  }

  for (const template of templates) {
    const id = designId(template.layoutSchema);
    const thumbnailKey = keyFromUrl(template.thumbnailUrl);
    // Thumbnail yang sudah menjadi bagian versi artwork tetap berada di templates/<design>/vN.
    if (thumbnailKey?.startsWith('assets/') && !moves.some((move) => move.oldKey === thumbnailKey)) {
      register(moves, thumbnailKey, `template-thumbnails/${template.id}/${basename(thumbnailKey)}`, `template-thumbnail:${template.id}`);
    }
    for (const [slot, value] of Object.entries(samplePhotos(template.layoutSchema))) {
      const oldKey = keyFromUrl(value);
      if (oldKey && !moves.some((move) => move.oldKey === oldKey)) register(moves, oldKey, `template-samples/${id}/${safeSegment(slot, 'misc')}/${basename(oldKey)}`, `template-sample:${template.id}:${slot}`);
    }
    for (const [index, preset] of musicPresets(template.layoutSchema).entries()) {
      const oldKey = keyFromUrl(preset.url);
      if (oldKey && !moves.some((move) => move.oldKey === oldKey)) register(moves, oldKey, `templates/${id}/audio/${basename(oldKey)}`, `template-audio:${template.id}:${index}`);
    }
  }

  const map = new Map(moves.map((move) => [move.oldKey, move.newKey]));
  const plan = { apply, deleteLegacy, bucket, publicBase, moves };
  console.log(JSON.stringify({ summary: { objects: moves.length }, plan }, null, 2));
  if (!apply) return;

  for (const move of moves) {
    const source = await head(move.oldKey);
    if (!source) throw new Error(`Object sumber tidak ditemukan: ${move.oldKey}`);
    const existing = await head(move.newKey);
    if (!existing) {
      await s3.send(new CopyObjectCommand({ Bucket: bucket, Key: move.newKey, CopySource: `${bucket}/${move.oldKey}` }));
    }
    const destination = await head(move.newKey);
    if (!destination || destination.size !== source.size) throw new Error(`Verifikasi gagal: ${move.oldKey} -> ${move.newKey}`);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of media) {
      const newKey = map.get(item.storageKey);
      if (newKey) await tx.mediaFile.update({ where: { id: item.id }, data: { storageKey: newKey, url: publicUrl(newKey) } });
    }
    for (const track of tracks) {
      const newKey = map.get(track.storageKey);
      if (newKey) await tx.musicTrack.update({ where: { id: track.id }, data: { storageKey: newKey } });
    }
    for (const demo of demos) {
      const newKey = map.get(demo.storageKey);
      if (newKey) await tx.demoPhoto.update({ where: { slot: demo.slot }, data: { storageKey: newKey } });
    }
    for (const template of templates) {
      await tx.template.update({
        where: { id: template.id },
        data: {
          thumbnailUrl: replaceJson(template.thumbnailUrl, map) as string | null,
          layoutSchema: replaceJson(template.layoutSchema, map) as JsonValue,
        },
      });
    }
    for (const version of versions) {
      await tx.templateArtworkVersion.update({ where: { id: version.id }, data: { manifest: replaceJson(version.manifest, map) as JsonValue } });
    }
    for (const invitation of invitations) {
      await tx.invitation.update({ where: { id: invitation.id }, data: { layout: replaceJson(invitation.layout, map) as JsonValue } });
    }
  });

  if (deleteLegacy) {
    for (const move of moves) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: move.oldKey }));
  }

  const verification = await Promise.all(moves.map(async (move) => ({ ...move, source: await head(move.oldKey), destination: await head(move.newKey) })));
  const invalid = verification.filter((item) => !item.destination || (!deleteLegacy && !item.source) || (deleteLegacy && item.source));
  if (invalid.length) throw new Error(`Verifikasi akhir gagal untuk ${invalid.length} object`);
  console.log(JSON.stringify({ migrated: moves.length, legacyDeleted: deleteLegacy, verified: verification.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
