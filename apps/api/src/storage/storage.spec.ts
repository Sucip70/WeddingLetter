import path from 'node:path';
import { LocalDriver } from './local.driver.js';
import { R2Driver } from './r2.driver.js';
import { StorageService } from './storage.service.js';

describe('LocalDriver (dev)', () => {
  const driver = new LocalDriver(path.resolve('tmp-test-uploads'), 'http://localhost:4000', 'secret');
  const key = 'abc123/def456.jpg';

  it('URL upload ditandatangani: hanya cocok untuk kunci, tipe, dan ukuran yang sama', async () => {
    const { uploadUrl, headers } = await driver.presignUpload({ key, contentType: 'image/jpeg', sizeBytes: 100 });
    const q = new URL(uploadUrl).searchParams;
    expect(headers['Content-Type']).toBe('image/jpeg');
    expect(driver.verify(key, 'image/jpeg', 100, Number(q.get('exp')), q.get('sig')!)).toBe(true);
    expect(driver.verify(key, 'image/jpeg', 101, Number(q.get('exp')), q.get('sig')!)).toBe(false); // ukuran diubah
    expect(driver.verify(key, 'image/png', 100, Number(q.get('exp')), q.get('sig')!)).toBe(false); // tipe diubah
    expect(driver.verify('other/x.jpg', 'image/jpeg', 100, Number(q.get('exp')), q.get('sig')!)).toBe(false); // kunci lain
  });

  it('URL kedaluwarsa ditolak', () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    expect(driver.verify(key, 'image/jpeg', 1, exp, driver.sign(key, 'image/jpeg', 1, exp))).toBe(false);
  });

  it('kunci path traversal ditolak', () => {
    expect(() => driver.filePath('../../etc/passwd')).toThrow();
    expect(() => driver.filePath('a/../../b.jpg')).toThrow();
    expect(() => driver.filePath(key)).not.toThrow();
  });
});

describe('R2Driver (presign offline)', () => {
  const driver = new R2Driver('acct123', 'AKIDEXAMPLE', 'secretkey', 'weddingletter-media', 'https://cdn.example.com/');

  it('menghasilkan URL PUT bertanda tangan ke endpoint R2 dengan Content-Type/Length ikut ditandatangani', async () => {
    const res = await driver.presignUpload({ key: 'inv1/med1.mp4', contentType: 'video/mp4', sizeBytes: 12345 });
    const url = new URL(res.uploadUrl);
    expect(url.host).toBe('weddingletter-media.acct123.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/inv1/med1.mp4');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('900');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toMatch(/content-length/);
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toMatch(/content-type/);
    expect(res.method).toBe('PUT');
    expect(res.headers).toEqual({ 'Content-Type': 'video/mp4' });
  });

  it('URL publik dari domain CDN (tanpa double slash)', () => {
    expect(driver.publicUrl('inv1/med1.mp4')).toBe('https://cdn.example.com/inv1/med1.mp4');
  });
});

describe('StorageService — R2_PUBLIC_URL wajib punya skema', () => {
  const ENV_KEYS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL', 'NODE_ENV'] as const;
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    process.env.R2_ACCOUNT_ID = 'acct';
    process.env.R2_ACCESS_KEY_ID = 'key';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('tanpa "https://" ditolak dengan pesan jelas (bukan diam-diam menghasilkan URL relatif rusak)', () => {
    process.env.R2_PUBLIC_URL = 'media-staging.weddingletter.id';
    expect(() => new StorageService().publicUrl('x.jpg')).toThrow(/https:\/\//);
  });

  it('dengan skema diterima', () => {
    process.env.R2_PUBLIC_URL = 'https://media-staging.weddingletter.id';
    expect(new StorageService().publicUrl('x.jpg')).toBe('https://media-staging.weddingletter.id/x.jpg');
  });
});
