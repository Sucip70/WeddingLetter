'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react';
import { Alert, Badge, Button, Card } from '@/components/ui';
import { api, errorMessage, uploadWithProgress } from '@/lib/client-api';
import type { DemoSlotRow } from './page';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_MB = 5;

export function DemoPhotosManager({ initial }: { initial: DemoSlotRow[] }) {
  const [slots, setSlots] = useState(initial);
  const [busy, setBusy] = useState<{ slot: string; progress: number | null } | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);

  const pickFor = (slot: string) => {
    target.current = slot;
    input.current?.click();
  };

  async function run(slot: string, task: () => Promise<DemoSlotRow[]>, done: string) {
    setError('');
    setMessage('');
    setBusy({ slot, progress: null });
    try {
      setSlots(await task());
      setMessage(done);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function upload(file?: File) {
    const slot = target.current;
    if (input.current) input.current.value = '';
    if (!file || !slot) return;
    if (!ACCEPT.split(',').includes(file.type)) return setError('Format tidak didukung. Gunakan JPG, PNG, atau WebP.');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`File terlalu besar (maks. ${MAX_MB} MB). Perkecil dulu, mis. lebar 1600 px.`);
    await run(
      slot,
      async () => {
        const presigned = await api<{ uploadUrl: string; method: string; headers: Record<string, string>; key: string }>('admin/assets/presign', { body: { kind: 'image', contentType: file.type, sizeBytes: file.size } });
        setBusy({ slot, progress: 0 });
        await uploadWithProgress(presigned, file, (p) => setBusy({ slot, progress: p }));
        return api<DemoSlotRow[]>(`admin/demo-photos/${slot}`, { method: 'PUT', body: { key: presigned.key } });
      },
      'Foto tersimpan. Demo template langsung memakai foto baru (cache halaman bisa butuh sekitar semenit).',
    );
  }

  const label = (s: DemoSlotRow) => (s.url ? (s.isDefault ? 'Bawaan (ilustrasi)' : 'Foto Anda') : 'Kosong');

  return (
    <div className="space-y-6">
      <Alert tone="warn">
        <strong>Foto bawaan hanyalah ilustrasi placeholder</strong>, bukan foto sungguhan. Untuk kesan terbaik, ganti dengan foto pasangan/pre-wedding berkualitas (potret 4:5, mis. 800x1000 px; galeri boleh lebar). Pakai foto milik Anda atau berlisensi komersial. Foto di sini tampil publik di halaman demo.
      </Alert>

      <input ref={input} type="file" accept={ACCEPT} className="sr-only" aria-label="Pilih foto pengganti" onChange={(e) => void upload(e.target.files?.[0])} />
      {error && <Alert>{error}</Alert>}
      {message && <p className="text-sm text-sage" role="status">{message}</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {slots.map((s) => {
          const working = busy?.slot === s.slot;
          return (
            <Card key={s.slot} className="flex flex-col overflow-hidden">
              <div className="relative aspect-[4/5] bg-ivory">
                {s.url ? (
                  <img src={s.url} alt={s.label} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-ink-soft">Belum ada foto. Demo memakai kotak placeholder.</div>
                )}
                {working && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-ink">
                    {busy?.progress === null ? 'Memproses…' : `Mengunggah ${Math.round((busy?.progress ?? 0) * 100)}%`}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{s.label}</p>
                  <Badge tone={s.url ? (s.isDefault ? 'neutral' : 'sage') : 'gold'}>{label(s)}</Badge>
                </div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">{s.hint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => pickFor(s.slot)} disabled={!!busy}>{s.url ? 'Ganti foto' : 'Unggah foto'}</Button>
                  {s.hasDefault && !s.isDefault && (
                    <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run(s.slot, () => api<DemoSlotRow[]>(`admin/demo-photos/${s.slot}/reset`, { method: 'POST', body: {} }), 'Dikembalikan ke foto bawaan.')}>Bawaan</Button>
                  )}
                  {s.url && (
                    <Button size="sm" variant="ghost" className="text-danger" disabled={!!busy} onClick={() => run(s.slot, () => api<DemoSlotRow[]>(`admin/demo-photos/${s.slot}`, { method: 'DELETE' }), 'Slot dikosongkan.')}>Kosongkan</Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
