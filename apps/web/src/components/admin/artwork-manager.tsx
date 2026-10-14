'use client';

import { useRef, useState } from 'react';
import { Alert, Button, Card, Field, Input, Select, Toggle } from '@/components/ui';
import { api, errorMessage, uploadWithProgress } from '@/lib/client-api';
import type { ArtworkManifest, ArtworkSlot } from '@/lib/types';

const SLOTS: { id: ArtworkSlot; label: string }[] = [
  { id: 'coverBackground', label: 'Latar sampul' }, { id: 'coverForeground', label: 'Foreground sampul' },
  { id: 'pageBackground', label: 'Latar halaman' }, { id: 'sectionBackground', label: 'Latar section' },
  { id: 'topDecoration', label: 'Dekorasi atas' }, { id: 'bottomDecoration', label: 'Dekorasi bawah' },
  { id: 'cornerTopLeft', label: 'Sudut kiri atas' }, { id: 'cornerTopRight', label: 'Sudut kanan atas' },
  { id: 'cornerBottomLeft', label: 'Sudut kiri bawah' }, { id: 'cornerBottomRight', label: 'Sudut kanan bawah' },
  { id: 'divider', label: 'Pemisah' }, { id: 'photoFrame', label: 'Bingkai foto' }, { id: 'texture', label: 'Tekstur' },
  { id: 'thumbnail', label: 'Thumbnail' }, { id: 'gateBackground', label: 'Latar gerbang' }, { id: 'gateForeground', label: 'Foreground gerbang' },
  { id: 'gateTransition', label: 'Transisi gerbang' }, { id: 'gateInteractive', label: 'Objek interaktif gerbang' },
];
const ORNAMENTS = ['vine', 'geo', 'star8', 'lotus', 'sparkle', 'snow', 'twig', 'deco', 'lily', 'flora', 'romantic', 'botani', 'keraton', 'sakura', 'autumn', 'winter', 'lavender', 'hortensia', 'marigold'] as const;
const EFFECTS = ['none', 'aurora', 'rays', 'curtain', 'scanlines', 'spotlight', 'clouds', 'halo', 'sky', 'bloom'] as const;
const PARTICLES = ['petal', 'leaf', 'maple', 'snow', 'heart', 'star', 'sparkle', 'confetti', 'bubble', 'firefly', 'pixel', 'lantern', 'bat', 'coin', 'dust', 'feather', 'blossom', 'bloomflower'] as const;

interface Asset { id: string; slot: ArtworkSlot; variant: 'default' | 'mobile' | 'desktop'; storageKey: string; url: string; contentType: 'image/webp'; width: number; height: number; sizeBytes: number }
interface Version { id: string; designId: string; version: number; status: 'DRAFT' | 'PUBLISHED'; assets: Asset[] }

const DEFAULT_PRESENTATION: ArtworkManifest['presentation'] = {
  backgroundFit: 'cover', backgroundPosition: 'center-top', foregroundPosition: 'bottom-center', foregroundMotion: 'none',
  opacity: 1, scale: 1, backgroundLayer: 0, decorationLayer: 1, foregroundLayer: 3,
  showOnOrnamentCover: true, showOnPhotoCover: false,
};

export function ArtworkManager({ templateId, current, onPreview, onPublished }: {
  templateId: string;
  current?: ArtworkManifest;
  onPreview: (artwork?: ArtworkManifest) => void;
  onPublished: (artwork: ArtworkManifest) => void;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [draft, setDraft] = useState<Version | null>(null);
  const [slot, setSlot] = useState<ArtworkSlot>('coverBackground');
  const [variant, setVariant] = useState<'default' | 'mobile' | 'desktop'>('default');
  const [presentation, setPresentation] = useState(current?.presentation ?? DEFAULT_PRESENTATION);
  const [fallback, setFallback] = useState<ArtworkManifest['fallback']>(current?.fallback ?? {});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  async function refresh() {
    setBusy('load'); setError('');
    try {
      const result = await api<{ versions: Version[] }>(`admin/templates/${templateId}/artwork`);
      setVersions(result.versions);
      setDraft(result.versions.find((version) => version.status === 'DRAFT') ?? null);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(''); }
  }

  async function createDraft() {
    setBusy('create'); setError('');
    try {
      const created = await api<Version>(`admin/templates/${templateId}/artwork/drafts`, { body: {} });
      const next = { ...created, assets: [] };
      setDraft(next); setVersions((all) => [next, ...all]);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(''); }
  }

  async function upload(file?: File) {
    if (!file || !draft) return;
    setBusy('upload'); setError('');
    try {
      const target = await api<{ uploadUrl: string; method: 'PUT'; headers: Record<string, string>; key: string }>(`admin/templates/${templateId}/artwork/${draft.id}/presign`, { body: { slot, variant, contentType: file.type, sizeBytes: file.size } });
      await uploadWithProgress(target, file, () => undefined);
      const asset = await api<Asset>(`admin/templates/${templateId}/artwork/${draft.id}/confirm`, { body: { slot, variant, storageKey: target.key } });
      setDraft((value) => value ? { ...value, assets: [...value.assets.filter((item) => item.slot !== slot || item.variant !== variant), asset] } : value);
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(''); }
  }

  function manifest(): ArtworkManifest | undefined {
    if (!draft || draft.assets.length === 0) return undefined;
    const assets: ArtworkManifest['assets'] = {};
    for (const asset of draft.assets) {
      assets[asset.slot] ??= {};
      assets[asset.slot]![asset.variant] = asset;
    }
    return { schemaVersion: 1, designId: draft.designId, artworkVersion: draft.version, assets, presentation, fallback };
  }

  async function publish() {
    if (!draft) return;
    setBusy('publish'); setError('');
    try {
      const result = await api<{ layout: { artwork: ArtworkManifest } }>(`admin/templates/${templateId}/artwork/${draft.id}/publish`, { body: { presentation, fallback } });
      onPublished(result.layout.artwork); onPreview(undefined); setDraft(null); await refresh();
    } catch (e) { setError(errorMessage(e)); }
    finally { setBusy(''); }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold text-ink">Artwork versi immutable</h2><p className="mt-1 text-sm text-ink-soft">WebP/PNG/AVIF divalidasi dari isi file, dibersihkan, lalu diterbitkan sebagai WebP di R2 atau storage lokal.</p></div>
        <Button type="button" variant="secondary" size="sm" onClick={refresh} loading={busy === 'load'}>Muat versi</Button>
      </div>
      <p className="text-xs text-ink-soft">Aktif: {current ? `${current.designId} v${current.artworkVersion}` : 'belum ada'} · Riwayat: {versions.filter((v) => v.status === 'PUBLISHED').map((v) => `v${v.version}`).join(', ') || '—'}</p>
      {!draft ? <Button type="button" variant="secondary" onClick={createDraft} loading={busy === 'create'}>Buat versi baru</Button> : (
        <div className="space-y-4 rounded-xl border border-line p-4">
          <p className="text-sm font-medium">Draft v{draft.version} · {draft.assets.length} layer</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Layer"><Select value={slot} onChange={(e) => setSlot(e.target.value as ArtworkSlot)}>{SLOTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></Field>
            <Field label="Varian layar"><Select value={variant} onChange={(e) => setVariant(e.target.value as typeof variant)}><option value="default">Default</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option></Select></Field>
          </div>
          <input ref={fileInput} type="file" accept="image/webp,image/png,image/avif" className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()} loading={busy === 'upload'}>Unggah layer</Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fit latar"><Select value={presentation.backgroundFit} onChange={(e) => setPresentation({ ...presentation, backgroundFit: e.target.value as typeof presentation.backgroundFit })}><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option></Select></Field>
            <Field label="Posisi latar"><Select value={presentation.backgroundPosition} onChange={(e) => setPresentation({ ...presentation, backgroundPosition: e.target.value as typeof presentation.backgroundPosition })}><option value="center-top">Tengah atas</option><option value="center">Tengah</option><option value="center-bottom">Tengah bawah</option><option value="left-top">Kiri atas</option><option value="right-top">Kanan atas</option><option value="left-bottom">Kiri bawah</option><option value="right-bottom">Kanan bawah</option></Select></Field>
            <Field label="Posisi foreground"><Select value={presentation.foregroundPosition} onChange={(e) => setPresentation({ ...presentation, foregroundPosition: e.target.value as typeof presentation.foregroundPosition })}><option value="bottom-center">Tengah bawah</option><option value="top-center">Tengah atas</option><option value="center">Tengah</option><option value="left-center">Kiri tengah</option><option value="right-center">Kanan tengah</option></Select></Field>
            <Field label="Gerak foreground"><Select value={presentation.foregroundMotion} onChange={(e) => setPresentation({ ...presentation, foregroundMotion: e.target.value as typeof presentation.foregroundMotion })}><option value="none">Diam</option><option value="breathe">Bernapas</option><option value="float">Melayang</option></Select></Field>
            <Field label="Opacity (0–1)"><Input type="number" min="0" max="1" step="0.05" value={presentation.opacity} onChange={(e) => setPresentation({ ...presentation, opacity: Number(e.target.value) })} /></Field>
            <Field label="Scale (0.5–2)"><Input type="number" min="0.5" max="2" step="0.05" value={presentation.scale} onChange={(e) => setPresentation({ ...presentation, scale: Number(e.target.value) })} /></Field>
            <Field label="Layer latar (0–2)"><Input type="number" min="0" max="2" value={presentation.backgroundLayer} onChange={(e) => setPresentation({ ...presentation, backgroundLayer: Number(e.target.value) })} /></Field>
            <Field label="Layer dekorasi (1–3)"><Input type="number" min="1" max="3" value={presentation.decorationLayer} onChange={(e) => setPresentation({ ...presentation, decorationLayer: Number(e.target.value) })} /></Field>
            <Field label="Layer foreground (3–5)"><Input type="number" min="3" max="5" value={presentation.foregroundLayer} onChange={(e) => setPresentation({ ...presentation, foregroundLayer: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Fallback ornamen"><Select value={fallback.ornament ?? ''} onChange={(e) => setFallback({ ...fallback, ornament: (e.target.value || undefined) as ArtworkManifest['fallback']['ornament'] })}><option value="">Ikuti tema</option>{ORNAMENTS.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
            <Field label="Fallback efek sampul"><Select value={fallback.coverEffect ?? ''} onChange={(e) => setFallback({ ...fallback, coverEffect: (e.target.value || undefined) as ArtworkManifest['fallback']['coverEffect'] })}><option value="">Ikuti tema</option>{EFFECTS.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
            <Field label="Fallback partikel"><Select value={fallback.particle ?? ''} onChange={(e) => setFallback({ ...fallback, particle: (e.target.value || undefined) as ArtworkManifest['fallback']['particle'] })}><option value="">Ikuti tema</option>{PARTICLES.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
          </div>
          <div className="flex flex-wrap gap-5"><Toggle checked={presentation.showOnOrnamentCover} onChange={(value) => setPresentation({ ...presentation, showOnOrnamentCover: value })} label="Sampul ornamen" /><Toggle checked={presentation.showOnPhotoCover} onChange={(value) => setPresentation({ ...presentation, showOnPhotoCover: value })} label="Sampul foto" /></div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => onPreview(manifest())}>Pratinjau draft</Button><Button type="button" variant="sage" size="sm" onClick={publish} loading={busy === 'publish'} disabled={!draft.assets.length}>Publikasikan v{draft.version}</Button></div>
        </div>
      )}
      {error && <Alert>{error}</Alert>}
    </Card>
  );
}
