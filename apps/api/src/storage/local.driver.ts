import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { PresignedUpload, StorageDriver } from './storage.types.js';

const TTL_SECONDS = 15 * 60;

export const KEY_PATTERN = /^[a-z0-9]+\/[a-z0-9]+\.[a-z0-9]{2,5}$/i;

// Driver disk lokal, hanya untuk development tanpa kredensial R2. URL upload ditandatangani HMAC
// (kunci, tipe, ukuran, kedaluwarsa) supaya perilakunya sama dengan R2: tidak bisa unggah sembarangan.
export class LocalDriver implements StorageDriver {
  readonly name = 'local' as const;

  constructor(
    readonly rootDir: string,
    private readonly baseUrl: string,
    private readonly secret: string,
  ) {}

  sign(key: string, contentType: string, sizeBytes: number, exp: number) {
    return createHmac('sha256', this.secret).update(`${key}|${contentType}|${sizeBytes}|${exp}`).digest('hex');
  }

  verify(key: string, contentType: string, sizeBytes: number, exp: number, sig: string) {
    if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
    const expected = Buffer.from(this.sign(key, contentType, sizeBytes, exp), 'hex');
    const actual = Buffer.from(sig, 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  filePath(key: string) {
    if (!KEY_PATTERN.test(key)) throw new Error('Kunci storage tidak valid');
    const resolved = path.resolve(this.rootDir, key);
    if (!resolved.startsWith(path.resolve(this.rootDir) + path.sep)) throw new Error('Kunci storage tidak valid');
    return resolved;
  }

  async ensureDir(key: string) {
    await mkdir(path.dirname(this.filePath(key)), { recursive: true });
  }

  async presignUpload({ key, contentType, sizeBytes }: { key: string; contentType: string; sizeBytes: number }): Promise<PresignedUpload> {
    const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    const sig = this.sign(key, contentType, sizeBytes, exp);
    const query = new URLSearchParams({ ct: contentType, size: String(sizeBytes), exp: String(exp), sig });
    return {
      uploadUrl: `${this.baseUrl}/media/local/${key}?${query}`,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      expiresInSeconds: TTL_SECONDS,
    };
  }

  async head(key: string) {
    try {
      return { sizeBytes: (await stat(this.filePath(key))).size };
    } catch {
      return null;
    }
  }

  async delete(key: string) {
    await rm(this.filePath(key), { force: true });
  }

  publicUrl(key: string) {
    return `${this.baseUrl}/media/local/${key}`;
  }
}
