import path from 'node:path';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { LocalDriver } from './local.driver.js';
import { R2Driver } from './r2.driver.js';
import type { PresignedUpload, StorageDriver } from './storage.types.js';

// Memilih driver dari env: R2 bila lengkap; kalau tidak dan bukan production -> disk lokal (dev).
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private driver?: StorageDriver;

  private get(): StorageDriver {
    if (this.driver) return this.driver;
    const env = process.env;
    if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_PUBLIC_URL) {
      this.driver = new R2Driver(
        env.R2_ACCOUNT_ID,
        env.R2_ACCESS_KEY_ID,
        env.R2_SECRET_ACCESS_KEY,
        env.R2_BUCKET_NAME ?? 'weddingletter-media',
        env.R2_PUBLIC_URL,
      );
    } else if (env.NODE_ENV !== 'production') {
      this.logger.warn('R2 belum dikonfigurasi: memakai storage disk lokal (khusus development)');
      this.driver = new LocalDriver(
        path.resolve(env.UPLOAD_DIR ?? 'uploads'),
        env.APP_BASE_URL ?? 'http://localhost:4000',
        env.JWT_SECRET ?? 'dev-secret',
      );
    } else {
      throw new ServiceUnavailableException('Storage media belum dikonfigurasi');
    }
    return this.driver;
  }

  get local(): LocalDriver | null {
    const d = this.get();
    return d instanceof LocalDriver ? d : null;
  }

  presignUpload(input: { key: string; contentType: string; sizeBytes: number }): Promise<PresignedUpload> {
    return this.get().presignUpload(input);
  }
  head(key: string) {
    return this.get().head(key);
  }
  delete(key: string) {
    return this.get().delete(key);
  }
  publicUrl(key: string) {
    return this.get().publicUrl(key);
  }
}
