// Panggilan API dari BROWSER, lewat proxy same-origin /api/backend (menambahkan token dari cookie httpOnly).

export class ClientApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

function extractMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.join('; ');
  }
  return fallback;
}

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(`/api/backend/${path.replace(/^\//, '')}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: 'no-store',
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) throw new ClientApiError(res.status, extractMessage(body, `Permintaan gagal (${res.status})`), body);
  return body as T;
}

export async function authApi<T = unknown>(action: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ClientApiError(res.status, extractMessage(json, 'Permintaan gagal'), json);
  return json as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Terjadi kesalahan');

// Upload file langsung ke storage (URL bertanda tangan) dengan progres.
export function uploadWithProgress(
  target: { uploadUrl: string; method: string; headers: Record<string, string> },
  file: Blob,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.uploadUrl);
    for (const [k, v] of Object.entries(target.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload gagal (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Koneksi terputus saat mengunggah'));
    xhr.send(file);
  });
}
