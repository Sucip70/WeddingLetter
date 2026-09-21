'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { InvitationView } from '@/components/invitation/invitation-view';
import { PhoneFrame } from '@/components/invitation/phone-frame';
import { Alert, Badge, Button, Card, Field, Input, Select, Toggle, cn } from '@/components/ui';
import { api, errorMessage, uploadWithProgress } from '@/lib/client-api';
import { sampleView } from '@/lib/sample';
import { FX_LABEL } from '@/lib/catalog';
import type { FieldType, FxLevel, Palette, Theme, ThemeGroup } from '@/lib/types';

export interface AuthField { key: string; type: FieldType; label: string; required: boolean; enabled: boolean }
export interface AuthSection { id: string; title: string; enabled: boolean; fields: AuthField[] }
export interface Authoring {
  theme: Theme;
  sections: AuthSection[];
  galeri: { maxPhotos: number; maxVideos: number };
  musik: { allowed: boolean; presets: { name: string; url: string }[] };
  palettes: Palette[];
}
export interface TemplateForm {
  id?: string;
  name: string;
  category: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  price: number;
  includedWeeks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  thumbnailUrl: string | null;
  layout: Authoring;
  orders?: number;
}
export interface DesignMeta {
  id: string;
  name: string;
  group: ThemeGroup;
  blurb: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  headingFont: Theme['headingFont'];
  bodyFont: Theme['bodyFont'];
  palettes: Palette[];
}
export interface BuilderMeta {
  designs: DesignMeta[];
  groups: { id: ThemeGroup; label: string }[];
  sections: { id: string; title: string; fields: { key: string; label: string; type: FieldType; required: boolean }[] }[];
}

const FONT_LABEL: Record<string, string> = {
  script: 'Tulisan tangan (script)',
  serif: 'Serif klasik',
  sans: 'Sans modern',
  display: 'Display hangat (Fraunces)',
  cinzel: 'Kapital klasik (Cinzel)',
  pixel: 'Pixel retro',
  round: 'Bulat ceria',
};
const BODY_LABEL: Record<string, string> = { sans: 'Sans modern', serif: 'Serif klasik', round: 'Bulat ceria' };
const FX_ORDER: FxLevel[] = ['none', 'standard', 'premium'];
const HEX = /^#[0-9a-fA-F]{6}$/;

const themeOf = (d: DesignMeta, fx: FxLevel): Theme => ({ preset: d.id, motif: d.id, fx, primary: d.primary, secondary: d.secondary, background: d.background, text: d.text, headingFont: d.headingFont, bodyFont: d.bodyFont });

function blank(meta: BuilderMeta): TemplateForm {
  const on = ['cover', 'mempelai', 'tanggal_lokasi', 'galeri'];
  const chosen = meta.sections.filter((s) => s.id !== 'musik');
  const sections: AuthSection[] = [
    ...on.map((id) => chosen.find((s) => s.id === id)!),
    ...chosen.filter((s) => !on.includes(s.id)),
  ].map((s) => ({ id: s.id, title: s.title, enabled: on.includes(s.id), fields: s.fields.map((f) => ({ ...f, enabled: true })) }));
  const rustic = meta.designs.find((d) => d.id === 'rustic') ?? meta.designs[0]!;
  return {
    name: '',
    category: rustic.group,
    tier: 'BASIC',
    price: 20000,
    includedWeeks: 4,
    status: 'DRAFT',
    thumbnailUrl: null,
    layout: { theme: themeOf(rustic, 'none'), sections, galeri: { maxPhotos: 4, maxVideos: 0 }, musik: { allowed: false, presets: [] }, palettes: rustic.palettes },
  };
}

// Skema penyusunan -> layout efektif (hanya section & field aktif) untuk pratinjau langsung.
function toPreviewLayout(l: Authoring) {
  return {
    theme: l.theme,
    sections: l.sections.filter((s) => s.enabled).map((s) => ({ id: s.id, title: s.title, fields: s.fields.filter((f) => f.enabled).map((f) => ({ key: f.key, label: f.label, type: f.type, required: f.required })) })),
    musik: l.musik,
  };
}

export function TemplateBuilder({ meta, initial }: { meta: BuilderMeta; initial: TemplateForm | null }) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateForm>(() => initial ?? blank(meta));
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [uploading, setUploading] = useState('');
  const thumbInput = useRef<HTMLInputElement>(null);
  const songInput = useRef<HTMLInputElement>(null);

  const layout = form.layout;
  const setLayout = (patch: Partial<Authoring>) => setForm((f) => ({ ...f, layout: { ...f.layout, ...patch } }));
  const setTheme = (patch: Partial<Theme>) => setLayout({ theme: { ...layout.theme, ...patch } });
  const patchSection = (id: string, patch: Partial<AuthSection>) => setLayout({ sections: layout.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const patchField = (sid: string, key: string, patch: Partial<AuthField>) =>
    setLayout({ sections: layout.sections.map((s) => (s.id === sid ? { ...s, fields: s.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)) } : s)) });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= layout.sections.length) return;
    const next = [...layout.sections];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setLayout({ sections: next });
  };

  const view = useMemo(() => sampleView(toPreviewLayout(layout), { rsvpEnabled: layout.sections.some((s) => s.id === 'rsvp' && s.enabled) }), [layout]);

  const design = meta.designs.find((d) => d.id === layout.theme.motif) ?? meta.designs.find((d) => d.id === layout.theme.preset);
  // Ganti desain: warna, font, motif, dan usulan palet ikut berganti.
  function applyDesign(id: string) {
    const d = meta.designs.find((x) => x.id === id);
    if (!d) return;
    setForm((f) => ({ ...f, category: d.group, layout: { ...f.layout, theme: themeOf(d, f.layout.theme.fx), palettes: d.palettes } }));
  }

  const setPalette = (i: number, patch: Partial<Palette>) => setLayout({ palettes: layout.palettes.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  async function uploadAsset(file: File, kind: 'image' | 'audio') {
    const target = await api<{ uploadUrl: string; method: string; headers: Record<string, string>; publicUrl: string }>('admin/assets/presign', { body: { kind, contentType: file.type, sizeBytes: file.size } });
    await uploadWithProgress(target, file, () => undefined);
    return target.publicUrl;
  }

  async function onThumb(file?: File) {
    if (!file) return;
    setUploading('thumb');
    setError('');
    try {
      const url = await uploadAsset(file, 'image');
      setForm((f) => ({ ...f, thumbnailUrl: url }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading('');
    }
  }

  async function onSong(file?: File) {
    if (!file) return;
    setUploading('song');
    setError('');
    try {
      const url = await uploadAsset(file, 'audio');
      setLayout({ musik: { ...layout.musik, presets: [...layout.musik.presets, { name: file.name.replace(/\.[^.]+$/, '').slice(0, 80), url }] } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUploading('');
    }
  }

  async function save(status?: TemplateForm['status']) {
    setBusy('save');
    setError('');
    setSaved('');
    const body = {
      name: form.name,
      category: form.category,
      tier: form.tier,
      price: Number(form.price),
      includedWeeks: Number(form.includedWeeks),
      status: status ?? form.status,
      thumbnailUrl: form.thumbnailUrl || null,
      layoutSchema: {
        theme: layout.theme,
        sections: layout.sections.map((s) => ({ id: s.id, title: s.title, enabled: s.enabled, fields: s.fields.map((f) => ({ key: f.key, label: f.label, required: f.required, enabled: f.enabled })) })),
        galeri: { maxPhotos: Number(layout.galeri.maxPhotos), maxVideos: Number(layout.galeri.maxVideos) },
        musik: layout.musik,
        palettes: layout.palettes,
      },
    };
    try {
      if (form.id) {
        const updated = await api<TemplateForm>(`admin/templates/${form.id}`, { method: 'PATCH', body });
        setForm(updated);
        setSaved('Template tersimpan.');
        router.refresh();
      } else {
        const created = await api<TemplateForm>('admin/templates', { body });
        router.replace(`/admin/templates/${created.id}`);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    if (!form.id || !confirm('Hapus template ini secara permanen?')) return;
    setBusy('delete');
    try {
      await api(`admin/templates/${form.id}`, { method: 'DELETE' });
      router.replace('/admin/templates');
    } catch (e) {
      setError(errorMessage(e));
      setBusy('');
    }
  }

  const ordered = (form.orders ?? 0) > 0;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">{form.id ? form.name || 'Template' : 'Template baru'}</h1>
        <Badge tone={form.status === 'PUBLISHED' ? 'sage' : form.status === 'DRAFT' ? 'gold' : 'neutral'}>{form.status === 'PUBLISHED' ? 'Dipublikasikan' : form.status === 'DRAFT' ? 'Draf' : 'Diarsipkan'}</Badge>
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-semibold text-ink">Informasi dasar</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nama template" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></Field>
              <Field label="Kelompok tema" hint="Dipakai untuk filter katalog. Otomatis mengikuti desain yang dipilih.">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {[...new Set([...meta.groups.map((g) => g.id as string), form.category])].map((c) => <option key={c} value={c}>{meta.groups.find((g) => g.id === c)?.label ?? c}</option>)}
                </Select>
              </Field>
              <Field label="Paket (tier)"><Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as TemplateForm['tier'] })}><option value="BASIC">Basic</option><option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option></Select></Field>
              <Field label="Harga (Rp)"><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
              <Field label="Masa aktif termasuk (minggu)" hint="Lama tayang yang sudah termasuk di harga template."><Input type="number" min={1} max={52} value={form.includedWeeks} onChange={(e) => setForm({ ...form, includedWeeks: Number(e.target.value) })} /></Field>
              <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TemplateForm['status'] })}><option value="DRAFT">Draf (tidak tampil)</option><option value="PUBLISHED">Dipublikasikan</option><option value="ARCHIVED">Diarsipkan</option></Select></Field>
              <Field label="Gambar thumbnail (opsional)" className="sm:col-span-2" hint="Kosongkan untuk memakai miniatur otomatis dari tema.">
                <div className="flex gap-2">
                  <Input value={form.thumbnailUrl ?? ''} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://…" />
                  <input ref={thumbInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Unggah thumbnail" onChange={(e) => { void onThumb(e.target.files?.[0]); e.target.value = ''; }} />
                  <Button type="button" variant="secondary" onClick={() => thumbInput.current?.click()} loading={uploading === 'thumb'}>Unggah</Button>
                </div>
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-ink">Tema tampilan</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Desain" hint={design?.blurb ?? 'Desain kustom: motif mengikuti desain terdekat.'}>
                <Select value={design?.id ?? ''} onChange={(e) => applyDesign(e.target.value)}>
                  {!design && <option value="">(kustom)</option>}
                  {meta.groups.map((g) => (
                    <optgroup key={g.id} label={g.label}>
                      {meta.designs.filter((d) => d.group === g.id).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field label="Level animasi" hint="Tanpa = tampilan statis (Basic). Standar = animasi masuk & partikel di sampul. Penuh = partikel di seluruh halaman, kilau, dan gerak tambahan.">
                <Select value={layout.theme.fx} onChange={(e) => setTheme({ fx: e.target.value as FxLevel })}>{FX_ORDER.map((v) => <option key={v} value={v}>{FX_LABEL[v]}</option>)}</Select>
              </Field>
              {(['primary', 'secondary', 'background', 'text'] as const).map((k) => (
                <Field key={k} label={{ primary: 'Warna utama', secondary: 'Warna pendamping', background: 'Latar', text: 'Teks' }[k]}>
                  <div className="flex items-center gap-2">
                    <input type="color" value={layout.theme[k]} onChange={(e) => setTheme({ [k]: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-paper p-1" aria-label={k} />
                    <Input value={layout.theme[k]} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setTheme({ [k]: e.target.value })} className="font-mono" maxLength={7} />
                  </div>
                </Field>
              ))}
              <Field label="Font judul"><Select value={layout.theme.headingFont} onChange={(e) => setTheme({ headingFont: e.target.value as Theme['headingFont'] })}>{Object.entries(FONT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
              <Field label="Font isi"><Select value={layout.theme.bodyFont} onChange={(e) => setTheme({ bodyFont: e.target.value as Theme['bodyFont'] })}>{Object.entries(BODY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">Pilihan warna untuk pembeli</h2>
                <p className="mt-1 text-sm text-ink-soft">Pembeli memilih salah satu palet ini tanpa biaya. Kosongkan bila template hanya punya satu warna. Warna dasar di atas otomatis ikut sebagai palet &quot;Bawaan&quot;.</p>
              </div>
              {design && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setLayout({ palettes: design.palettes })}>
                  Pakai usulan desain ({design.palettes.length})
                </Button>
              )}
            </div>
            {layout.palettes.length > 0 && (
              <ul className="mt-4 space-y-2">
                {layout.palettes.map((p, i) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2">
                    <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)` }} />
                    <Input value={p.name} onChange={(e) => setPalette(i, { name: e.target.value })} className="!h-8 min-w-32 flex-1 text-xs" aria-label="Nama palet" maxLength={40} />
                    {(['primary', 'secondary', 'background', 'text'] as const).map((k) => (
                      <input key={k} type="color" value={HEX.test(p[k]) ? p[k] : '#000000'} onChange={(e) => setPalette(i, { [k]: e.target.value })} className="h-8 w-9 cursor-pointer rounded-md border border-line bg-paper p-0.5" aria-label={`${p.name}: ${k}`} title={k} />
                    ))}
                    <button type="button" onClick={() => setTheme({ primary: p.primary, secondary: p.secondary, background: p.background, text: p.text })} className="text-xs font-medium text-rose hover:underline">Pratinjau</button>
                    <button type="button" onClick={() => setLayout({ palettes: layout.palettes.filter((_, j) => j !== i) })} className="text-xs font-medium text-danger hover:underline">Hapus</button>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="secondary" size="sm" className="mt-3" disabled={layout.palettes.length >= 15} onClick={() => setLayout({ palettes: [...layout.palettes, { id: `warna-${layout.palettes.length + 1}-${Date.now().toString(36).slice(-3)}`, name: `Warna ${layout.palettes.length + 1}`, primary: layout.theme.primary, secondary: layout.theme.secondary, background: layout.theme.background, text: layout.theme.text }] })}>+ Tambah palet</Button>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-ink">Section undangan</h2>
            <p className="mt-1 text-sm text-ink-soft">Aktifkan, urutkan, dan atur field tiap section. Field &amp; section yang dinonaktifkan tidak muncul di form pembeli maupun di undangan.</p>
            <ul className="mt-4 space-y-2">
              {layout.sections.map((s, i) => {
                const open = openSection === s.id;
                return (
                  <li key={s.id} className={cn('rounded-xl border', s.enabled ? 'border-line bg-paper' : 'border-dashed border-line bg-ivory/60')}>
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Toggle checked={s.enabled} onChange={(v) => patchSection(s.id, { enabled: v })} label={`Aktifkan ${s.title}`} />
                      <Input value={s.title} onChange={(e) => patchSection(s.id, { title: e.target.value })} className={cn('!h-9 flex-1', !s.enabled && 'opacity-60')} aria-label={`Judul ${s.id}`} maxLength={60} />
                      <div className="flex items-center">
                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan" className="px-2 py-1 text-ink-soft hover:text-ink disabled:opacity-25">▲</button>
                        <button type="button" onClick={() => move(i, 1)} disabled={i === layout.sections.length - 1} aria-label="Turunkan" className="px-2 py-1 text-ink-soft hover:text-ink disabled:opacity-25">▼</button>
                        {s.fields.length > 0 && <button type="button" onClick={() => setOpenSection(open ? null : s.id)} aria-expanded={open} className="rounded-lg px-2 py-1 text-xs font-medium text-rose hover:bg-rose-soft">{open ? 'Tutup' : `Field (${s.fields.filter((f) => f.enabled).length}/${s.fields.length})`}</button>}
                      </div>
                    </div>
                    {open && (
                      <ul className="divide-y divide-line border-t border-line">
                        {s.fields.map((f) => (
                          <li key={f.key} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                            <Toggle checked={f.enabled} onChange={(v) => patchField(s.id, f.key, { enabled: v })} label={`Tampilkan ${f.label}`} />
                            <Input value={f.label} onChange={(e) => patchField(s.id, f.key, { label: e.target.value })} className={cn('!h-8 min-w-40 flex-1 text-xs', !f.enabled && 'opacity-50')} aria-label={`Label ${f.key}`} maxLength={80} />
                            <span className="w-16 text-xs text-ink-soft">{f.type}</span>
                            <label className="flex items-center gap-1.5 text-xs text-ink-soft"><input type="checkbox" checked={f.required} disabled={!f.enabled} onChange={(e) => patchField(s.id, f.key, { required: e.target.checked })} className="accent-[#b4533c]" /> wajib</label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-ink">Kuota media</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Foto galeri gratis" hint="Foto di atas kuota dihitung per paket 5 foto."><Input type="number" min={0} max={60} value={layout.galeri.maxPhotos} onChange={(e) => setLayout({ galeri: { ...layout.galeri, maxPhotos: Number(e.target.value) } })} /></Field>
              <Field label="Video gratis (≤ 20 MB)" hint="Video di atas kuota dihitung sewa ukuran × minggu."><Input type="number" min={0} max={10} value={layout.galeri.maxVideos} onChange={(e) => setLayout({ galeri: { ...layout.galeri, maxVideos: Number(e.target.value) } })} /></Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-ink">Musik latar</h2>
                <p className="mt-1 text-sm text-ink-soft">Izinkan pembeli memilih lagu. Lagu bawaan datang dari pustaka musik (Admin → Musik) dan otomatis disaring sesuai paket template ini. Daftar di bawah hanya untuk lagu khusus template ini (opsional).</p>
              </div>
              <Toggle checked={layout.musik.allowed} onChange={(v) => setLayout({ musik: { ...layout.musik, allowed: v } })} label="Aktifkan musik" />
            </div>
            {layout.musik.allowed && (
              <div className="mt-4 space-y-2">
                {layout.musik.presets.map((p, i) => (
                  <div key={p.url} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                    <Input value={p.name} onChange={(e) => setLayout({ musik: { ...layout.musik, presets: layout.musik.presets.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) } })} className="!h-8 flex-1 text-xs" aria-label="Nama lagu" maxLength={80} />
                    <audio src={p.url} controls preload="none" className="h-8 w-44" />
                    <button type="button" onClick={() => setLayout({ musik: { ...layout.musik, presets: layout.musik.presets.filter((_, j) => j !== i) } })} className="text-xs font-medium text-danger hover:underline">Hapus</button>
                  </div>
                ))}
                <input ref={songInput} type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg" className="sr-only" aria-label="Unggah lagu bawaan" onChange={(e) => { void onSong(e.target.files?.[0]); e.target.value = ''; }} />
                <Button type="button" variant="secondary" size="sm" onClick={() => songInput.current?.click()} loading={uploading === 'song'}>+ Unggah lagu khusus template (maks. 25 MB)</Button>
              </div>
            )}
          </Card>

          {error && <Alert>{error}</Alert>}
          <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur">
            <Button onClick={() => save()} loading={busy === 'save'} disabled={!form.name.trim()}>{form.id ? 'Simpan template' : 'Buat template'}</Button>
            {form.id && form.status !== 'PUBLISHED' && <Button variant="sage" onClick={() => save('PUBLISHED')} disabled={!!busy}>Simpan & publikasikan</Button>}
            {form.id && !ordered && <Button variant="ghost" onClick={remove} loading={busy === 'delete'} className="ml-auto text-danger">Hapus</Button>}
            {form.id && ordered && <span className="ml-auto text-xs text-ink-soft">Sudah dipesan {form.orders}× — arsipkan, jangan dihapus.</span>}
            {saved && <span className="text-sm text-sage" role="status">{saved}</span>}
          </div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <p className="mb-3 text-center text-xs uppercase tracking-wider text-ink-soft">Pratinjau langsung</p>
            <PhoneFrame size="md">
              <InvitationView view={view} mode="preview" embedded placeholders />
            </PhoneFrame>
          </div>
        </aside>
      </div>
    </div>
  );
}
