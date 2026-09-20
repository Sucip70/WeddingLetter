import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PresignedUpload, StorageDriver } from './storage.types.js';

const PRESIGN_TTL_SECONDS = 15 * 60;

// Cloudflare R2 lewat API S3-compatible. Klien mengunggah langsung ke R2 dengan URL bertanda tangan
// (Content-Type & Content-Length ikut ditandatangani, jadi tidak bisa mengunggah file lebih besar dari
// yang sudah dibayar); server hanya menandatangani, mengecek ukuran, dan menghapus.
export class R2Driver implements StorageDriver {
  readonly name = 'r2' as const;
  private readonly client: S3Client;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    private readonly bucket: string,
    private readonly publicBaseUrl: string,
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async presignUpload({ key, contentType, sizeBytes }: { key: string; contentType: string; sizeBytes: number }): Promise<PresignedUpload> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType, ContentLength: sizeBytes });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_TTL_SECONDS,
      signableHeaders: new Set(['content-type', 'content-length']),
    });
    return { uploadUrl, method: 'PUT', headers: { 'Content-Type': contentType }, expiresInSeconds: PRESIGN_TTL_SECONDS };
  }

  async head(key: string) {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { sizeBytes: res.ContentLength ?? 0 };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404 || (error as Error).name === 'NotFound') return null;
      throw error;
    }
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string) {
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
}
