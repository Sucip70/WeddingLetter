import 'dotenv/config';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { StorageService } from '../src/storage/storage.service.js';
import { catalogEntrySchema, catalogKey } from '../src/admin/catalog.js';
import { z } from 'zod';
import sharp from 'sharp';
import { R2Driver } from '../src/storage/r2.driver.js';
import { config } from 'dotenv';
import { parseCatalogTemplate, resolveCatalog } from '../src/admin/catalog.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const publicDir = path.join(root, 'apps/web/public');
config({ path: path.join(root, '.env.publisher'), quiet: true });
const args = process.argv.slice(2);
const command = args[0];
const option = (name: string, fallback = '') => args[args.indexOf(name) + 1] && args.includes(name) ? args[args.indexOf(name) + 1]! : fallback;
const output = path.resolve(option('--file', path.join(root, 'output/catalog.json')));
const apply = args.includes('--apply');
const assetSchema = z.object({ key: catalogKey, file: z.string().optional(), sourceKey: catalogKey.optional(), sizeBytes: z.number().int().positive(), contentType: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).refine((a) => !!a.file !== !!a.sourceKey, 'Each asset needs exactly one source');
const packageSchema = z.object({ schemaVersion: z.literal(1), assets: z.array(assetSchema), entries: z.array(catalogEntrySchema), localFiles: z.array(z.object({ file: z.string(), sha256: z.string() })).default([]) });
type Asset = z.infer<typeof assetSchema>;
const hash = (body: Buffer) => createHash('sha256').update(body).digest('hex');
const mime: Record<string, string> = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' };

async function exportCatalog() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const storage = new StorageService();
  const assets = new Map<string, Asset>();
  const localUrls = new Map<string, string>();
  async function localAsset(url: string) {
    if (localUrls.has(url)) return localUrls.get(url)!;
    const filename = path.resolve(publicDir, `.${url}`);
    if (!filename.startsWith(`${publicDir}${path.sep}`)) throw new Error('Local asset escapes public folder');
    const body = await readFile(filename);
    const digest = hash(body);
    // Artwork sources retain the manifest's established key grammar.
    const key = url.startsWith('/themes/') ? `templates/catalog-local/v1/${digest}${path.extname(filename)}` : `catalog/v1/${digest}${path.extname(filename)}`;
    const contentType = mime[path.extname(filename)];
    if (!contentType) throw new Error(`Unsupported file: ${url}`);
    assets.set(key, { key, file: path.relative(root, filename).replaceAll('\\', '/'), sizeBytes: body.length, contentType, sha256: digest });
    localUrls.set(url, key);
    return key;
  }
  async function sourceAsset(key: string) {
    catalogKey.parse(key);
    if (!assets.has(key)) {
      const body = await storage.read(key);
      if (!body) throw new Error(`Missing source storage object: ${key}`);
      assets.set(key, { key, sourceKey: key, sizeBytes: body.length, contentType: mime[path.extname(key)] ?? 'application/octet-stream', sha256: hash(body) });
    }
    return key;
  }
  async function portable(value: unknown): Promise<unknown> {
    if (typeof value === 'string') {
      if (/^\/(themes|samples|audio)\//.test(value)) return `storage://${await localAsset(value)}`;
      const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
      if (base && value.startsWith(`${base}/`)) return `storage://${await sourceAsset(decodeURIComponent(value.slice(base.length + 1)))}`;
      const localBase = `${(process.env.APP_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '')}/uploads/`;
      if (value.startsWith(localBase)) return `storage://${await sourceAsset(value.slice(localBase.length))}`;
      return value;
    }
    if (Array.isArray(value)) return Promise.all(value.map(portable));
    if (value && typeof value === 'object') {
      const original = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(original)) result[key] = await portable(item);
      if (typeof original.storageKey === 'string' && typeof original.url === 'string' && !original.url.startsWith('/')) {
        result.url = `storage://${await sourceAsset(original.storageKey)}`;
      }
      // Every artwork source is paired with its portable object key and actual metadata.
      if (typeof result.url === 'string' && result.url.startsWith('storage://') && 'width' in result) {
        const key = result.url.slice(10);
        result.storageKey = key;
        result.sizeBytes = assets.get(key)!.sizeBytes;
      }
      return result;
    }
    return value;
  }
  async function imageSource(url: string) {
    const file = path.resolve(publicDir, `.${url}`);
    const metadata = await sharp(file).metadata();
    return { url, contentType: 'image/webp', width: metadata.width!, height: metadata.height!, sizeBytes: (await readFile(file)).length };
  }
  try {
    const entries: z.infer<typeof catalogEntrySchema>[] = [];
    const templates = await prisma.template.findMany({ orderBy: { id: 'asc' } });
    for (const row of templates) {
      const { id, name, category, tier, price, includedWeeks, status, thumbnailUrl } = row;
      const layout = structuredClone(row.layoutSchema) as Record<string, any>;
      const artwork = layout.artwork;
      if (artwork?.designId === 'jawa-sekar-keraton') {
        for (const [slot, file] of Object.entries({ coverPaper: 'paper', coverCanopy: 'canopy', coverFooter: 'footer', coverFrame: 'frame', coverDivider: 'divider' })) {
          artwork.assets[slot] = { default: await imageSource(`/themes/sekar-keraton/pendopo-${file}.webp`) };
        }
        layout.samplePhotos = Object.fromEntries(Object.entries({ cover: 'cover', groom: 'groom-v2', bride: 'bride-v2', gallery1: 'gallery-walking', gallery2: 'gallery-romantic' }).map(([slot, file]) => [slot, `/samples/sekar-keraton/${file}.webp`]));
      }
      if (artwork?.designId === 'pusako-minang') {
        const replacements = { gateBackground: ['gate-tile', 'gate-cloth'], cardFrame: ['info-card', 'letter-card'], gateTransition: ['gate-post-left', 'post-left'], gateForeground: ['gate-post-right', 'post-right'], gateInteractive: ['gate-gonjong', 'gonjong-seal'], divider: ['divider', 'gold-divider'], bottomDecoration: ['footer', 'gold-foundation'] };
        for (const [slot, [original, approved]] of Object.entries(replacements)) {
          const source = artwork.assets[slot]?.default;
          if (!source || source.url === `/themes/pusako-minang/${original}.webp`) artwork.assets[slot] = { default: await imageSource(`/themes/pusako-minang/surat-bersegel-01/${approved}.webp`) };
        }
      }
      const data = await portable({ name, category, tier, price, includedWeeks, status, thumbnailUrl, layoutSchema: layout }) as Record<string, unknown>;
      entries.push({ kind: 'template', id, data });
    }
    for (const { slot, storageKey } of await prisma.demoPhoto.findMany()) {
      await sourceAsset(storageKey);
      entries.push({ kind: 'demoPhoto', id: slot, data: { storageKey } });
    }
    for (const row of await prisma.musicTrack.findMany()) {
      const { id, createdAt: _created, updatedAt: _updated, ...data } = row;
      await sourceAsset(data.storageKey);
      entries.push({ kind: 'musicTrack', id, data });
    }
    for (const row of await prisma.addOn.findMany()) {
      const { id, createdAt: _created, updatedAt: _updated, ...data } = row;
      entries.push({ kind: 'addOn', id, data });
    }
    // Inventory all theme/sample/audio files, including renderer fallback files.
    async function inventory(dir: string) {
      let children;
      try { children = await readdir(path.join(publicDir, dir), { withFileTypes: true }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
      for (const child of children) {
        const relative = `${dir}/${child.name}`;
        if (child.isDirectory()) await inventory(relative);
        else if (mime[path.extname(child.name)]) await localAsset(`/${relative}`);
      }
    }
    for (const dir of ['themes', 'samples', 'audio']) await inventory(dir);
    const localFiles = [...localUrls].map(([url, key]) => ({ file: path.relative(root, path.resolve(publicDir, `.${url}`)).replaceAll('\\', '/'), sha256: assets.get(key)!.sha256 }));
    const packet = packageSchema.parse({ schemaVersion: 1, assets: [...assets.values()], entries, localFiles });
    for (const entry of entries) if (Buffer.byteLength(JSON.stringify(entry)) > 90_000) throw new Error(`Catalog entry exceeds API limit: ${entry.id}`);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(packet, null, 2));
    console.log(`Exported ${templates.length} templates, ${entries.length} entries, ${assets.size} objects to ${output}`);
  } finally { await prisma.$disconnect(); }
}

function targetStorage() {
  const required = ['TARGET_R2_ACCOUNT_ID', 'TARGET_R2_ACCESS_KEY_ID', 'TARGET_R2_SECRET_ACCESS_KEY', 'TARGET_R2_PUBLIC_URL'] as const;
  for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);
  if (process.env.TARGET_R2_BUCKET_NAME !== 'weddingletter-staging') throw new Error('Target bucket must explicitly be weddingletter-staging');
  if (!/^https:\/\//.test(process.env.TARGET_R2_PUBLIC_URL!)) throw new Error('TARGET_R2_PUBLIC_URL must use HTTPS');
  if (process.env.R2_BUCKET_NAME === process.env.TARGET_R2_BUCKET_NAME && process.env.R2_ACCOUNT_ID === process.env.TARGET_R2_ACCOUNT_ID) throw new Error('Source and target buckets must differ');
  return new R2Driver(process.env.TARGET_R2_ACCOUNT_ID!, process.env.TARGET_R2_ACCESS_KEY_ID!, process.env.TARGET_R2_SECRET_ACCESS_KEY!, process.env.TARGET_R2_BUCKET_NAME, process.env.TARGET_R2_PUBLIC_URL!);
}

async function sync(packet: z.infer<typeof packageSchema>, verifyOnly = false) {
  if (!apply) {
    for (const asset of packet.assets) console.log(`Would verify/copy ${asset.key}`);
    console.log(`Planned ${packet.assets.length} objects to weddingletter-staging`);
    return;
  }
  const target = targetStorage();
  const source = new StorageService();
  for (const asset of packet.assets) {
    const existing = await target.get(asset.key);
    if (existing) {
      if (existing.length !== asset.sizeBytes || hash(existing) !== asset.sha256) throw new Error(`Immutable destination conflict: ${asset.key}`);
      continue;
    }
    if (verifyOnly) throw new Error(`Destination asset missing: ${asset.key}`);
    let body: Buffer | null;
    if (asset.file) {
      const filename = path.resolve(root, asset.file);
      if (!filename.startsWith(`${publicDir}${path.sep}`)) throw new Error('Asset file must be inside public');
      body = await readFile(filename);
    } else body = await source.read(asset.sourceKey!);
    if (!body || body.length !== asset.sizeBytes || hash(body) !== asset.sha256) throw new Error(`Source changed, export again: ${asset.key}`);
    await target.put(asset.key, body, asset.contentType, 'public, max-age=31536000, immutable');
    const verified = await target.get(asset.key);
    if (!verified || hash(verified) !== asset.sha256) throw new Error(`Destination verification failed: ${asset.key}`);
    console.log(`Verified ${asset.key}`);
  }
  console.log(`${apply ? 'Synced and verified' : 'Planned'} ${packet.assets.length} objects to weddingletter-staging`);
}

async function publish(packet: z.infer<typeof packageSchema>, verifyOnly = false) {
  const base = option('--api', 'https://staging.weddingletter.id').replace(/\/$/, '');
  const url = new URL(base);
  if (url.hostname !== 'staging.weddingletter.id' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Publisher target must be staging or localhost');
  if (url.hostname === 'staging.weddingletter.id' && url.protocol !== 'https:') throw new Error('Staging requires HTTPS');
  if (apply && !process.env.PUBLISHER_TOKEN) throw new Error('Set PUBLISHER_TOKEN to an admin bearer token');
  // Shared media first, so templates never reference absent music IDs.
  const entries = [...packet.entries].sort((a, b) => Number(a.kind === 'template') - Number(b.kind === 'template'));
  for (const entry of entries) {
    if (!apply) { console.log(`Would upsert ${entry.kind} ${entry.id}`); continue; }
    const response = await fetch(`${base}/admin/catalog/${verifyOnly ? 'verify' : 'entries'}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PUBLISHER_TOKEN}` }, body: JSON.stringify(entry), signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Publish failed (${response.status}) for ${entry.id}: ${(await response.text()).slice(0, 500)}`);
    console.log(`${verifyOnly ? 'Verified' : 'Published'} ${entry.kind} ${entry.id}`);
  }
  console.log(`${apply ? 'Published' : 'Planned'} ${entries.length} catalog entries`);
}

async function main() {
  if (command === 'export') return exportCatalog();
  const packet = packageSchema.parse(JSON.parse(await readFile(output, 'utf8')));
  const inventoryKeys = new Set(packet.assets.map((a) => a.key));
  for (const entry of packet.entries) {
    const keys = new Set<string>();
    const resolved = resolveCatalog(entry.data, { publicUrl: (key) => `https://destination.example/${key}` }, keys);
    if (entry.kind === 'template') {
      try { parseCatalogTemplate(resolved); }
      catch (error) { throw new Error(`Template ${entry.id} (${entry.data.name}): ${error instanceof Error ? error.message : String(error)}`); }
    }
    if (entry.kind === 'demoPhoto' || entry.kind === 'musicTrack') keys.add(String(entry.data.storageKey));
    for (const key of keys) if (!inventoryKeys.has(key)) throw new Error(`Asset missing from inventory: ${key}`);
  }
  if (command === 'check') { console.log(`Validated ${packet.entries.length} entries and ${packet.assets.length} asset references`); return; }
  if (command === 'sync') return sync(packet);
  if (command === 'publish') return publish(packet);
  if (command === 'verify') {
    if (!apply) throw new Error('Use --apply to perform read-only remote verification');
    await sync(packet, true);
    return publish(packet, true);
  }
  if (command === 'retire-local') {
    if (!packet.localFiles.length) throw new Error('Export again to include the complete local file inventory');
    const files = [...new Set(packet.localFiles.map((asset) => asset.file))];
    if (!apply) { console.log(`Would untrack ${files.length} local media files after remote verification`); return; }
    await sync(packet, true);
    await publish(packet, true);
    for (const file of files) {
      const filename = path.resolve(root, file);
      if (!filename.startsWith(`${publicDir}${path.sep}`)) throw new Error('Asset outside public directory');
      const asset = packet.localFiles.find((item) => item.file === file)!;
      if (hash(await readFile(filename)) !== asset.sha256) throw new Error(`Local file changed: ${file}`);
    }
    const run = promisify(execFile);
    for (let offset = 0; offset < files.length; offset += 40) await run('git', ['rm', '--cached', '--ignore-unmatch', '--', ...files.slice(offset, offset + 40)], { cwd: root });
    console.log('Media files untracked. Local copies retained. Review and commit the staged removals.');
    return;
  }
  throw new Error('Usage: catalog.ts export|sync|publish [--file path] [--apply] [--api URL]');
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
