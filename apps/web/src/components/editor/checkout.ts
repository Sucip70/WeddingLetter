import { api, uploadWithProgress } from '@/lib/client-api';
import type { OrderDetail, Upload } from '@/lib/types';
import type { LocalFile } from './model';

export interface CheckoutProgress {
  phase: 'creating' | 'uploading' | 'paying' | 'redirecting';
  // 0..1 per clientId
  files: Record<string, number>;
  fileNames: Record<string, string>;
}

export interface CheckoutResult {
  orderId: string;
  next: string;
}

type Send = (progress: CheckoutProgress) => void;

async function uploadOne(upload: Upload, lf: LocalFile, onProgress: (f: number) => void, orderId: string) {
  let target: { uploadUrl: string; method: string; headers: Record<string, string> } = upload;
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await uploadWithProgress(target, lf.file, onProgress);
      await api(`media/${upload.mediaId}/confirm`, { method: 'POST', body: {} });
      return;
    } catch (error) {
      lastError = error;
      // URL upload berlaku 15 menit: minta yang baru sebelum mengulang.
      try {
        target = await api<Upload>(`media/${upload.mediaId}/presign`, { method: 'POST', body: {} });
      } catch {
        break;
      }
      onProgress(0);
    }
  }
  void orderId;
  throw lastError instanceof Error ? lastError : new Error('Upload gagal');
}

// Checkout: buat pesanan -> unggah semua file (maks. 3 paralel, ukuran diverifikasi server) -> mulai pembayaran.
// `existing` dipakai saat mengulang setelah gagal di tengah jalan (pesanan tidak dibuat dua kali).
export async function runCheckout(params: {
  body: unknown;
  files: Record<string, LocalFile>;
  send: Send;
  existing?: { order: OrderDetail; uploads: Upload[] };
  // clientId yang sudah selesai diunggah (saat mengulang setelah gagal).
  done?: string[];
}): Promise<CheckoutResult> {
  const { body, files, send } = params;
  const progress: CheckoutProgress = { phase: 'creating', files: {}, fileNames: {} };
  const emit = (phase?: CheckoutProgress['phase']) => {
    if (phase) progress.phase = phase;
    send({ ...progress, files: { ...progress.files } });
  };

  emit('creating');
  const created = params.existing ?? (await api<{ order: OrderDetail; uploads: Upload[] }>('orders', { method: 'POST', body }));
  const orderId = created.order.id;

  const done = new Set(params.done ?? []);
  const queue = [...created.uploads].filter((u) => files[u.clientId] && !done.has(u.clientId));
  for (const u of created.uploads) {
    if (!files[u.clientId]) continue;
    progress.fileNames[u.clientId] = files[u.clientId]!.file.name;
    if (done.has(u.clientId)) progress.files[u.clientId] = 1;
  }
  emit('uploading');

  let failure: unknown;
  const worker = async () => {
    for (let u = queue.shift(); u && !failure; u = queue.shift()) {
      try {
        await uploadOne(u, files[u.clientId]!, (f) => {
          progress.files[u.clientId] = f;
          emit();
        }, orderId);
        progress.files[u.clientId] = 1;
        done.add(u.clientId);
        emit();
      } catch (error) {
        failure = error;
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if (failure) throw Object.assign(failure instanceof Error ? failure : new Error('Upload gagal'), { created, done: [...done] });

  emit('paying');
  const pay = await api<{ status: 'PAID' | 'PENDING'; redirectUrl?: string }>(`payments/${orderId}/start`, { method: 'POST', body: {} });
  emit('redirecting');
  return { orderId, next: pay.status === 'PAID' || !pay.redirectUrl ? `/checkout/${orderId}` : pay.redirectUrl };
}
