'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Field, Input, Select, cn } from '@/components/ui';
import { api, errorMessage, uploadWithProgress } from '@/lib/client-api';
import type { AdminTrack, LicenseType, TrackTier } from './page';

const LICENSES: { value: LicenseType; label: string; hint: string }[] = [
  { value: 'PUBLIC_DOMAIN', label: 'Domain publik', hint: 'Komposisi DAN rekamannya bebas hak cipta (mis. rekaman berlabel Public Domain / CC0 di Musopen atau Wikimedia Commons).' },
  { value: 'CC0', label: 'CC0', hint: 'Dilepas ke domain publik oleh pemiliknya. Boleh dipakai komersial tanpa kredit.' },
  { value: 'ROYALTY_FREE', label: 'Royalty-free (library berlisensi)', hint: 'Dibeli/diunduh dari library reputable dengan lisensi komersial. Simpan bukti lisensinya, dan cek apakah boleh dipakai ulang oleh banyak pelanggan.' },
  { value: 'CC_BY', label: 'CC BY (wajib kredit)', hint: 'Boleh dipakai komersial, tetapi kredit pencipta WAJIB tampil. Isi kolom "Kredit" agar muncul di undangan.' },
  { value: 'OTHER', label: 'Lainnya', hint: 'Jelaskan syarat pemakaiannya di catatan lisensi.' },
];

const TIERS: { value: TrackTier; label: string }[] = [
  { value: 'BASIC', label: 'Semua paket (Basic, Standard, Premium)' },
  { value: 'STANDARD', label: 'Standard & Premium' },
  { value: 'PREMIUM', label: 'Premium saja' },
];
const TIER_SHORT: Record<TrackTier, string> = { BASIC: 'Semua paket', STANDARD: 'Standard+', PREMIUM: 'Premium' };
const ACCEPT = 'audio/mpeg,audio/mp4,audio/aac,audio/ogg';
const MAX_MB = 25;

const mbText = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
const durText = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '-');

// Durasi dibaca dari metadata file di browser (tanpa unggah ulang).
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

const EMPTY = { title: '', artist: '', licenseType: 'PUBLIC_DOMAIN' as LicenseType, licenseNote: '', sourceUrl: '', attribution: '', minTier: 'BASIC' as TrackTier, sortOrder: '0' };

export function MusicManager({ initial }: { initial: AdminTrack[] }) {
  const [tracks, setTracks] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => setTracks(await api<AdminTrack[]>('admin/music'));
  const license = LICENSES.find((l) => l.value === form.licenseType)!;
  const uploading = progress !== null;
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  function pick(f?: File) {
    setError('');
    setMessage('');
    if (!f) return;
    if (!ACCEPT.split(',').includes(f.type)) return setError('Format tidak didukung. Gunakan MP3, M4A/AAC, atau OGG.');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File terlalu besar (maks. ${MAX_MB} MB). Kompres ke MP3 128 kbps agar lebih kecil.`);
    setFile(f);
    // Nama file jadi judul awal supaya tidak mengetik ulang.
    setForm((cur) => (cur.title ? cur : { ...cur, title: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 120) }));
  }

  async function submit() {
    if (!file) return setError('Pilih file lagu dulu.');
    if (!form.title.trim() || !form.artist.trim()) return setError('Judul dan komposer/pemain wajib diisi.');
    if (form.licenseType === 'CC_BY' && !form.attribution.trim()) return setError('Lisensi CC BY mewajibkan kredit. Isi kolom "Kredit di undangan".');
    setError('');
    setMessage('');
    setProgress(0);
    try {
      const [duration, target] = await Promise.all([
        readDuration(file),
        api<{ uploadUrl: string; method: string; headers: Record<string, string>; key: string }>('admin/assets/presign', { body: { kind: 'audio', contentType: file.type, sizeBytes: file.size } }),
      ]);
      await uploadWithProgress(target, file, setProgress);
      await api('admin/music', {
        body: {
          key: target.key,
          title: form.title,
          artist: form.artist,
          licenseType: form.licenseType,
          licenseNote: form.licenseNote,
          sourceUrl: form.sourceUrl,
          attribution: form.attribution,
          minTier: form.minTier,
          durationSec: duration,
          sortOrder: Number(form.sortOrder) || 0,
        },
      });
      setMessage(`"${form.title}" tersimpan dan langsung tersedia untuk ${TIERS.find((t) => t.value === form.minTier)!.label.toLowerCase()}.`);
      setForm({ ...EMPTY, licenseType: form.licenseType, minTier: form.minTier });
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setProgress(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError('');
    try {
      await api(`admin/music/${id}`, { method: 'PATCH', body });
      await refresh();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }

  async function remove(t: AdminTrack) {
    if (!confirm(`Hapus "${t.title}" secara permanen? File lagunya ikut dihapus.`)) return;
    setError('');
    try {
      await api(`admin/music/${t.id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const active = tracks.filter((t) => t.status === 'ACTIVE');
  const archived = tracks.filter((t) => t.status === 'ARCHIVED');

  return (
    <div className="space-y-8">
      <Alert tone="warn">
        <strong>Perhatikan hak cipta.</strong> Komposisi klasik (Pachelbel, Mendelssohn, Wagner, Schubert, Bach/Gounod) sudah domain publik, tetapi <strong>rekaman tertentu</strong> tetap punya hak cipta milik pemain/labelnya.
        Pakai rekaman yang jelas berstatus <em>Public Domain</em> atau <em>CC0</em> (mis. Musopen, Wikimedia Commons, Internet Archive), atau rekaman dari library berlisensi komersial. Catat sumber dan lisensinya di bawah.
      </Alert>

      <Card className="p-5">
        <h2 className="font-semibold text-ink">Unggah lagu baru</h2>
        <p className="mt-1 text-sm text-ink-soft">MP3 / M4A / AAC / OGG, maks. {MAX_MB} MB. Setelah tersimpan, lagu otomatis muncul di editor pembeli sesuai paket yang dipilih.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="File lagu" required className="sm:col-span-2" hint={file ? `${file.name} · ${mbText(file.size)}` : 'Belum ada file dipilih.'}>
            <div className="flex gap-2">
              <input ref={fileInput} type="file" accept={ACCEPT} className="sr-only" aria-label="Pilih file lagu" onChange={(e) => pick(e.target.files?.[0])} />
              <Button type="button" variant="secondary" onClick={() => fileInput.current?.click()} disabled={uploading}>Pilih file…</Button>
              {previewUrl && <audio controls src={previewUrl} preload="metadata" className="h-10 flex-1" />}
            </div>
          </Field>
          <Field label="Judul" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="Canon in D" /></Field>
          <Field label="Komposer / pemain" required><Input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} maxLength={120} placeholder="Johann Pachelbel" /></Field>
          <Field label="Tersedia untuk" hint="Lagu klasik domain publik cocok untuk semua paket; lagu royalty-free dari library biasanya Standard & Premium.">
            <Select value={form.minTier} onChange={(e) => setForm({ ...form, minTier: e.target.value as TrackTier })}>{TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
          </Field>
          <Field label="Lisensi" hint={license.hint}>
            <Select value={form.licenseType} onChange={(e) => setForm({ ...form, licenseType: e.target.value as LicenseType })}>{LICENSES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</Select>
          </Field>
          <Field label="Catatan lisensi" hint="Mis. Komposisi: domain publik. Rekaman: Musopen, CC0."><Input value={form.licenseNote} onChange={(e) => setForm({ ...form, licenseNote: e.target.value })} maxLength={300} /></Field>
          <Field label="Link sumber" hint="Halaman tempat file diunduh (bukti lisensi)."><Input type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} maxLength={500} placeholder="https://…" /></Field>
          <Field label={form.licenseType === 'CC_BY' ? 'Kredit di undangan (wajib)' : 'Kredit di undangan (opsional)'} className="sm:col-span-2" hint="Bila diisi, teks ini tampil kecil di bagian bawah undangan yang memakai lagu ini.">
            <Input value={form.attribution} onChange={(e) => setForm({ ...form, attribution: e.target.value })} maxLength={300} placeholder="Musik: Judul oleh Pencipta (CC BY 4.0)" />
          </Field>
          <Field label="Urutan tampil" hint="Angka kecil tampil lebih dulu."><Input type="number" min={0} max={10000} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
        </div>

        {error && <Alert className="mt-4">{error}</Alert>}
        {message && <p className="mt-4 text-sm text-sage" role="status">{message}</p>}
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={submit} loading={uploading} disabled={!file}>{uploading ? `Mengunggah ${Math.round((progress ?? 0) * 100)}%` : 'Unggah & simpan'}</Button>
        </div>
      </Card>

      <section aria-labelledby="aktif">
        <h2 id="aktif" className="mb-3 font-semibold text-ink">Lagu aktif ({active.length})</h2>
        {active.length === 0 ? (
          <Card className="p-6 text-sm text-ink-soft">Belum ada lagu. Semua template sudah mengizinkan musik, tetapi pembeli baru melihat daftar kosong sampai Anda mengunggah lagu di atas.</Card>
        ) : (
          <ul className="space-y-3">{active.map((t) => <TrackRow key={t.id} t={t} editing={editing === t.id} onEdit={setEditing} onPatch={patch} onRemove={remove} />)}</ul>
        )}
      </section>

      {archived.length > 0 && (
        <section aria-labelledby="arsip">
          <h2 id="arsip" className="mb-1 font-semibold text-ink">Diarsipkan ({archived.length})</h2>
          <p className="mb-3 text-sm text-ink-soft">Tidak tampil untuk pembeli baru; undangan yang sudah dibeli tetap berbunyi.</p>
          <ul className="space-y-3">{archived.map((t) => <TrackRow key={t.id} t={t} editing={editing === t.id} onEdit={setEditing} onPatch={patch} onRemove={remove} />)}</ul>
        </section>
      )}
    </div>
  );
}

function TrackRow({ t, editing, onEdit, onPatch, onRemove }: { t: AdminTrack; editing: boolean; onEdit: (id: string | null) => void; onPatch: (id: string, body: Record<string, unknown>) => Promise<boolean>; onRemove: (t: AdminTrack) => void }) {
  const [draft, setDraft] = useState({ title: t.title, artist: t.artist, licenseNote: t.licenseNote ?? '', sourceUrl: t.sourceUrl ?? '', attribution: t.attribution ?? '', minTier: t.minTier, sortOrder: String(t.sortOrder) });
  const [busy, setBusy] = useState(false);
  const archived = t.status === 'ARCHIVED';

  async function save() {
    setBusy(true);
    const ok = await onPatch(t.id, { ...draft, sortOrder: Number(draft.sortOrder) || 0 });
    setBusy(false);
    if (ok) onEdit(null);
  }

  return (
    <li>
      <Card className={cn('p-4', archived && 'opacity-70')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-ink">{t.title} <span className="font-normal text-ink-soft">· {t.artist}</span></p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <Badge tone={t.minTier === 'BASIC' ? 'sage' : t.minTier === 'STANDARD' ? 'rose' : 'gold'}>{TIER_SHORT[t.minTier]}</Badge>
              <Badge>{LICENSES.find((l) => l.value === t.licenseType)?.label}</Badge>
              <span className="text-ink-soft">{durText(t.durationSec)} · {mbText(t.sizeBytes)}</span>
              {t.sourceUrl && <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-rose underline">sumber</a>}
            </div>
            {t.licenseNote && <p className="mt-1 text-xs text-ink-soft">{t.licenseNote}</p>}
            {t.attribution && <p className="mt-1 text-xs text-ink-soft">Kredit: {t.attribution}</p>}
          </div>
          <audio src={t.url} controls preload="none" className="h-9 w-56 max-w-full" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit(editing ? null : t.id)}>{editing ? 'Tutup' : 'Ubah info'}</Button>
          <Button size="sm" variant="ghost" onClick={() => onPatch(t.id, { status: archived ? 'ACTIVE' : 'ARCHIVED' })}>{archived ? 'Aktifkan lagi' : 'Arsipkan'}</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => onRemove(t)}>Hapus</Button>
        </div>
        {editing && (
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <Field label="Judul"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} /></Field>
            <Field label="Komposer / pemain"><Input value={draft.artist} onChange={(e) => setDraft({ ...draft, artist: e.target.value })} maxLength={120} /></Field>
            <Field label="Tersedia untuk">
              <Select value={draft.minTier} onChange={(e) => setDraft({ ...draft, minTier: e.target.value as TrackTier })}>{TIERS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</Select>
            </Field>
            <Field label="Urutan"><Input type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></Field>
            <Field label="Catatan lisensi" className="sm:col-span-2"><Input value={draft.licenseNote} onChange={(e) => setDraft({ ...draft, licenseNote: e.target.value })} maxLength={300} /></Field>
            <Field label="Link sumber"><Input type="url" value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} maxLength={500} /></Field>
            <Field label="Kredit di undangan"><Input value={draft.attribution} onChange={(e) => setDraft({ ...draft, attribution: e.target.value })} maxLength={300} /></Field>
            <div className="sm:col-span-2"><Button size="sm" onClick={save} loading={busy}>Simpan perubahan</Button></div>
          </div>
        )}
      </Card>
    </li>
  );
}
