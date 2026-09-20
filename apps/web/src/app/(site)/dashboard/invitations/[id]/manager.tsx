'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FieldInput } from '@/components/editor/fields';
import { ACCEPT, compressImage, fileProblem } from '@/components/editor/model';
import type { FieldCtx } from '@/components/editor/fields';
import { InvitationView } from '@/components/invitation/invitation-view';
import { PhoneFrame } from '@/components/invitation/phone-frame';
import { InvitationStatusBadge, expiryText } from '@/components/status';
import { Alert, Badge, Button, Card, Field, Input, Modal, Select, Spinner, cn } from '@/components/ui';
import { api, errorMessage, uploadWithProgress } from '@/lib/client-api';
import { daysLeft, formatDate, formatDateTime, mb, rupiah, whatsappLink } from '@/lib/format';
import type { InvitationData, InvitationDetail, InvitationMedia, InvitationViewData, QuoteLine, RsvpSummary, Upload } from '@/lib/types';

type Tab = 'overview' | 'edit' | 'rsvp' | 'extend';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Ringkasan' },
  { id: 'edit', label: 'Isi undangan' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'extend', label: 'Perpanjang' },
];

const NOOP_CTX: Omit<FieldCtx, 'data' | 'errors' | 'onChange'> = {
  files: {},
  charges: {},
  weeks: 1,
  presets: [],
  maxPhotos: 0,
  maxVideos: 0,
  addFiles: async () => [],
  removeFile: () => undefined,
  setFileWeeks: () => undefined,
};

export function InvitationManager({ initial, initialTab, baseUrl }: { initial: InvitationDetail; initialTab: string; baseUrl: string }) {
  const [inv, setInv] = useState(initial);
  const [tab, setTab] = useState<Tab>((TABS.find((t) => t.id === initialTab)?.id ?? 'overview') as Tab);

  const reload = useCallback(async () => setInv(await api<InvitationDetail>(`invitations/${inv.id}`)), [inv.id]);
  const link = `${baseUrl}/u/${inv.slug}`;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">/{inv.slug}</h1>
          <p className="mt-1 text-ink-soft">Template {inv.templateName}</p>
        </div>
        <InvitationStatusBadge status={inv.status} />
      </div>

      <div role="tablist" aria-label="Bagian" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors', tab === t.id ? 'border-rose text-rose' : 'border-transparent text-ink-soft hover:text-ink')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'overview' && <Overview inv={inv} link={link} reload={reload} goto={setTab} />}
        {tab === 'edit' && <EditTab inv={inv} setInv={setInv} />}
        {tab === 'rsvp' && <RsvpTab inv={inv} />}
        {tab === 'extend' && <ExtendTab inv={inv} />}
      </div>
    </div>
  );
}

// ================= Ringkasan =================

function Overview({ inv, link, reload, goto }: { inv: InvitationDetail; link: string; reload: () => Promise<void>; goto: (t: Tab) => void }) {
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [guest, setGuest] = useState('');
  const [copied, setCopied] = useState('');

  const names = useMemo(() => {
    const m = inv.data.mempelai;
    return typeof m?.pria_nama === 'string' && typeof m?.wanita_nama === 'string' ? `${m.pria_nama} & ${m.wanita_nama}` : 'kami';
  }, [inv.data]);

  const guestLink = guest.trim() ? `${link}?to=${encodeURIComponent(guest.trim())}` : link;
  const message = `${guest.trim() ? `Kepada Yth. ${guest.trim()},\n\n` : ''}Dengan penuh syukur, kami mengundang Anda ke pernikahan ${names}. Buka undangan digital kami di:\n${guestLink}`;

  async function publish() {
    setPublishing(true);
    setError('');
    try {
      await api(`invitations/${inv.id}/publish`, { method: 'POST', body: {} });
      setConfirmOpen(false);
      await reload();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPublishing(false);
    }
  }

  const copy = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1800);
    });
  };

  const live = inv.status === 'ACTIVE';
  const d = daysLeft(inv.expiresAt);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        {inv.status === 'DRAFT' && inv.order.status === 'PAID' && (
          <Card className="border-rose/30 bg-rose-soft/40 p-6">
            <h2 className="font-display text-2xl text-ink">Undangan siap dipublikasikan</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Periksa isi undangan di tab <button className="font-medium text-rose underline" onClick={() => goto('edit')}>Isi undangan</button>. Masa aktif <strong>{inv.order.activeWeeks} minggu</strong> mulai dihitung setelah Anda menekan tombol publikasi, dan link baru bisa dibuka tamu.
            </p>
            {inv.refundEligible && <p className="mt-2 text-xs text-ink-soft">Setelah dipublikasikan, refund penuh tidak lagi tersedia.</p>}
            {error && <Alert className="mt-4">{error}</Alert>}
            <Button size="lg" className="mt-5" onClick={() => setConfirmOpen(true)}>Publikasikan sekarang</Button>
          </Card>
        )}

        {inv.status === 'PAUSED' && <Alert tone="warn">Undangan sedang dijeda oleh admin: link tidak bisa dibuka tamu dan hitung mundur berhenti (sisa {inv.remainingDays ?? 0} hari). Hubungi CS untuk melanjutkan.</Alert>}
        {inv.status === 'EXPIRED_GRACE' && (
          <Alert>
            Masa aktif berakhir. Link tidak bisa dibuka, tapi data & file Anda masih disimpan 30 hari. <button className="font-medium underline" onClick={() => goto('extend')}>Perpanjang untuk mengaktifkan kembali →</button>
          </Alert>
        )}
        {live && d !== null && d <= 7 && (
          <Alert tone="warn">Undangan berakhir dalam {d} hari. <button className="font-medium underline" onClick={() => goto('extend')}>Perpanjang →</button></Alert>
        )}

        <Card className="p-6">
          <h2 className="font-semibold text-ink">Link undangan</h2>
          <p className="mt-1 text-sm text-ink-soft">{expiryText(inv.status, inv.expiresAt, inv.remainingDays)}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-ivory px-3 py-2.5 text-sm text-ink">{link}</code>
            <Button variant="secondary" size="sm" onClick={() => copy(link, 'link')}>{copied === 'link' ? 'Tersalin ✓' : 'Salin'}</Button>
            {live && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-full border border-line bg-paper px-3 text-sm font-medium hover:border-ink/40">Buka ↗</a>}
          </div>
          {!live && <p className="mt-3 text-xs text-ink-soft">Link baru bisa dibuka tamu saat status <strong>Aktif</strong>.</p>}

          <div className="mt-6 border-t border-line pt-5">
            <Field label="Link personal per tamu" hint="Tamu akan disapa dengan namanya di sampul undangan.">
              <Input value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Nama tamu, mis. Bapak Budi & Keluarga" maxLength={60} />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => copy(guestLink, 'guest')}>{copied === 'guest' ? 'Tersalin ✓' : 'Salin link'}</Button>
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-full bg-[#25a55f] px-3.5 text-sm font-medium text-white hover:opacity-90">
                Kirim via WhatsApp
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="font-semibold text-ink">Statistik</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-xl bg-ivory p-4"><dd className="font-display text-3xl text-ink">{inv.viewCount}</dd><dt className="text-xs text-ink-soft">Kali dibuka</dt></div>
            <div className="rounded-xl bg-ivory p-4"><dd className="font-display text-3xl text-ink">{d !== null && live ? Math.max(0, d) : inv.remainingDays ?? '—'}</dd><dt className="text-xs text-ink-soft">{live ? 'Hari tersisa' : 'Sisa hari'}</dt></div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink">File media</h2>
          {inv.media.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Tidak ada file.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {inv.media.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ivory">
                    {m.type === 'PHOTO' ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-ink-soft">{m.type === 'VIDEO' ? '▶' : '♪'}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink">{m.type === 'PHOTO' ? 'Foto' : m.type === 'VIDEO' ? 'Video' : 'Lagu'} · {mb(m.sizeBytes)}</p>
                    <p className="text-xs text-ink-soft">{m.included ? 'Termasuk template' : `Sewa ${m.rentedWeeks} minggu`}{m.expiresAt ? ` · sampai ${formatDate(m.expiresAt)}` : ''}</p>
                  </div>
                  <Badge tone={m.status === 'ACTIVE' ? 'sage' : m.status === 'EXPIRED_GRACE' ? 'danger' : 'neutral'}>{m.status === 'ACTIVE' ? 'Aktif' : m.status === 'UPLOADED' ? 'Siap' : m.status === 'PAUSED' ? 'Dijeda' : m.status === 'EXPIRED_GRACE' ? 'Berakhir' : m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-ink">Pesanan</h2>
          <p className="mt-2 text-sm text-ink-soft">{rupiah(inv.order.totalAmount)} · {inv.order.paidAt ? `dibayar ${formatDateTime(inv.order.paidAt)}` : 'belum dibayar'}</p>
          {inv.refundEligible && (
            <p className="mt-3 text-sm text-ink-soft">
              Masih memenuhi syarat refund penuh (belum dipublikasikan, &lt; 48 jam).{' '}
              <a href={whatsappLink(`Halo WeddingLetter, saya ingin mengajukan refund untuk pesanan ${inv.order.id}.`)} target="_blank" rel="noopener noreferrer" className="font-medium text-rose underline">Ajukan via WhatsApp</a>
            </p>
          )}
        </Card>
      </div>

      <Modal open={confirmOpen} onClose={() => !publishing && setConfirmOpen(false)} title="Publikasikan undangan?">
        <p className="text-sm leading-relaxed text-ink-soft">
          Setelah dipublikasikan, link langsung bisa dibuka tamu dan masa aktif <strong>{inv.order.activeWeeks} minggu</strong> mulai berjalan. Refund penuh tidak lagi tersedia. Isi undangan tetap bisa diedit.
        </p>
        {error && <Alert className="mt-4">{error}</Alert>}
        <div className="mt-6 flex gap-3">
          <Button className="flex-1" onClick={publish} loading={publishing}>Ya, publikasikan</Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={publishing}>Batal</Button>
        </div>
      </Modal>
    </div>
  );
}

// ================= Edit isi =================

const TEXT_TYPES = ['text', 'textarea', 'datetime', 'url'];

function EditTab({ inv, setInv }: { inv: InvitationDetail; setInv: (i: InvitationDetail) => void }) {
  const [data, setData] = useState<InvitationData>(inv.data);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const editable = inv.order.status === 'PAID' && ['DRAFT', 'ACTIVE', 'PAUSED'].includes(inv.status);
  const dirty = JSON.stringify(data) !== JSON.stringify(inv.data);
  const mediaById = useMemo(() => Object.fromEntries(inv.media.map((m) => [m.id, m])), [inv.media]);

  const onChange = useCallback((section: string, key: string, value: string | string[] | undefined) => {
    setData((d) => {
      const next = { ...(d[section] ?? {}) };
      if (value === undefined || value === '') delete next[key];
      else next[key] = value;
      return { ...d, [section]: next };
    });
    setMessage(null);
  }, []);

  const ctx: FieldCtx = { ...NOOP_CTX, data, errors: {}, onChange };

  // Setelah file diganti server sudah memperbarui rujukan di isi tersimpan; sinkronkan salinan lokal
  // (tanpa menghilangkan ketikan yang belum disimpan) dan muat ulang daftar file.
  const onReplaced = useCallback(
    async (oldId: string, newId: string) => {
      setData((d) => replaceRefs(d, oldId, newId));
      const fresh = await api<InvitationDetail>(`invitations/${inv.id}`);
      setInv({ ...fresh, data: replaceRefs(inv.data, oldId, newId) });
      setMessage({ tone: 'success', text: 'File berhasil diganti.' });
    },
    [inv, setInv],
  );

  const view: InvitationViewData = useMemo(
    () => ({
      slug: inv.slug,
      templateName: inv.templateName,
      layout: { theme: inv.layout.theme, sections: inv.layout.sections, musik: { presets: inv.layout.musik.presets } },
      features: inv.features,
      data,
      media: Object.fromEntries(inv.media.filter((m) => ['UPLOADED', 'ACTIVE', 'PAUSED', 'EXPIRED_GRACE'].includes(m.status)).map((m) => [m.id, { url: m.url, type: m.type }])),
      rsvpEnabled: inv.layout.sections.some((s) => s.id === 'rsvp'),
      guestbook: [],
    }),
    [inv, data],
  );

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api<InvitationDetail>(`invitations/${inv.id}`, { method: 'PATCH', body: { data } });
      setInv(updated);
      setData(updated.data);
      setMessage({ tone: 'success', text: 'Perubahan tersimpan.' });
    } catch (e) {
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        {!editable && <Alert tone="warn">Undangan ini tidak bisa diedit saat berstatus {inv.status === 'EXPIRED_GRACE' ? 'berakhir. Perpanjang dulu' : 'ini'}.</Alert>}
        {inv.layout.sections.filter((s) => s.fields.length > 0).map((section) => (
          <Card key={section.id} className="p-5">
            <h2 className="font-semibold text-ink">{section.title}</h2>
            <div className={cn('mt-4 grid gap-4 sm:grid-cols-2', !editable && 'pointer-events-none opacity-60')}>
              {section.fields.map((f) => {
                if (TEXT_TYPES.includes(f.type)) {
                  return (
                    <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <FieldInput section={section.id} field={f} ctx={ctx} />
                    </div>
                  );
                }
                const v = data[section.id]?.[f.key];
                const ids = Array.isArray(v) ? v : typeof v === 'string' && !v.startsWith('preset:') ? [v] : [];
                return (
                  <div key={f.key} className="sm:col-span-2">
                    <p className="text-sm font-medium text-ink">{f.label}</p>
                    {typeof v === 'string' && v.startsWith('preset:') ? (
                      <p className="mt-1 text-sm text-ink-soft">Lagu bawaan: {inv.layout.musik.presets[Number(v.slice(7))]?.name}</p>
                    ) : ids.length === 0 ? (
                      <p className="mt-1 text-sm text-ink-soft">Belum ada.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {ids.map((id) => {
                          const m = mediaById[id];
                          return m ? (
                            <div key={id} className="w-20">
                              <div className="h-20 w-20 overflow-hidden rounded-lg border border-line bg-ivory">
                                {m.type === 'PHOTO' ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-ink-soft">{m.type === 'VIDEO' ? '▶' : '♪'}</div>}
                              </div>
                              {editable && <ReplaceMedia media={m} onReplaced={(newId) => onReplaced(id, newId)} />}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
        <p className="text-xs text-ink-soft">Anda bisa <strong>mengganti</strong> file yang sudah ada tanpa biaya (ukuran harus sama atau lebih kecil dari yang dibayar). Menambah file baru atau mengubah jumlahnya perlu pesanan baru. <a href={whatsappLink(`Halo WeddingLetter, saya butuh bantuan mengubah file pada undangan /${inv.slug}.`)} target="_blank" rel="noopener noreferrer" className="font-medium text-rose underline">Butuh bantuan? Hubungi CS</a>.</p>

        <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur">
          <Button onClick={save} loading={saving} disabled={!editable || !dirty}>Simpan perubahan</Button>
          {dirty && <Button variant="ghost" onClick={() => setData(inv.data)} disabled={saving}>Batalkan</Button>}
          {message && <span className={cn('text-sm', message.tone === 'success' ? 'text-sage' : 'text-danger')} role="status">{message.text}</span>}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <PhoneFrame size="md">
            <InvitationView view={view} mode="preview" embedded />
          </PhoneFrame>
        </div>
      </aside>
    </div>
  );
}

// Mengganti satu file: minta slot upload -> unggah -> konfirmasi (server memverifikasi ukuran & menukar rujukan).
function ReplaceMedia({ media, onReplaced }: { media: InvitationMedia; onReplaced: (newId: string) => Promise<void> }) {
  const [state, setState] = useState<{ busy: boolean; progress: number; error: string }>({ busy: false, progress: 0, error: '' });
  const type = media.type;

  async function pick(file?: File) {
    if (!file) return;
    const problem = fileProblem(file, type);
    if (problem) return setState({ busy: false, progress: 0, error: problem });
    setState({ busy: true, progress: 0, error: '' });
    try {
      const prepared = type === 'PHOTO' ? await compressImage(file) : file;
      const slot = await api<Upload & { replaces: string }>(`media/${media.id}/replace`, { method: 'POST', body: { contentType: prepared.type, sizeBytes: prepared.size } });
      await uploadWithProgress(slot, prepared, (p) => setState((s) => ({ ...s, progress: p })));
      await api(`media/${slot.mediaId}/confirm`, { method: 'POST', body: {} });
      await onReplaced(slot.mediaId);
      setState({ busy: false, progress: 0, error: '' });
    } catch (e) {
      setState({ busy: false, progress: 0, error: errorMessage(e) });
    }
  }

  return (
    <div className="mt-1.5">
      <label className={cn('block cursor-pointer rounded-full border border-line bg-paper px-2 py-1 text-center text-xs font-medium text-rose hover:border-rose', state.busy && 'pointer-events-none opacity-60')}>
        {state.busy ? `${Math.round(state.progress * 100)}%` : 'Ganti'}
        <input type="file" accept={ACCEPT[type].join(',')} className="sr-only" disabled={state.busy} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} aria-label={`Ganti ${type === 'PHOTO' ? 'foto' : type === 'VIDEO' ? 'video' : 'lagu'}`} />
      </label>
      {state.error && <p className="mt-1 text-[11px] leading-snug text-danger" role="alert">{state.error}</p>}
    </div>
  );
}

function replaceRefs(data: InvitationData, oldId: string, newId: string): InvitationData {
  const out: InvitationData = {};
  for (const [section, fields] of Object.entries(data)) {
    out[section] = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v === oldId ? newId : Array.isArray(v) ? v.map((x) => (x === oldId ? newId : x)) : v]));
  }
  return out;
}

// ================= RSVP =================

function RsvpTab({ inv }: { inv: InvitationDetail }) {
  const [rsvp, setRsvp] = useState<RsvpSummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<RsvpSummary>(`invitations/${inv.id}/rsvp`).then(setRsvp).catch((e) => setError(errorMessage(e)));
  }, [inv.id]);

  const enabled = inv.layout.sections.some((s) => s.id === 'rsvp');
  if (error) return <Alert>{error}</Alert>;
  if (!rsvp) return <div className="flex justify-center py-12"><Spinner /></div>;

  function csv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [['Nama', 'Kehadiran', 'Jumlah tamu', 'Ucapan', 'Waktu'], ...rsvp!.guests.map((g) => [g.name, g.attending ? 'Hadir' : 'Tidak hadir', String(g.guestCount), g.message ?? '', formatDateTime(g.createdAt)])];
    const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rsvp-${inv.slug}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      {!enabled && <Alert tone="info">RSVP tidak aktif di undangan ini. Tambahkan lewat add-on “RSVP online” saat memesan.</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Respons masuk', rsvp.total],
          ['Orang akan hadir', rsvp.attendingPeople],
          ['Tidak hadir', rsvp.declinedCount],
        ].map(([label, value]) => (
          <Card key={label as string} className="p-5 text-center"><p className="font-display text-4xl text-ink">{value}</p><p className="mt-1 text-sm text-ink-soft">{label}</p></Card>
        ))}
      </div>
      {rsvp.guests.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="font-semibold text-ink">Daftar tamu</h2>
            <Button variant="secondary" size="sm" onClick={csv}>Unduh CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <tbody className="divide-y divide-line">
                {rsvp.guests.map((g) => (
                  <tr key={g.id}>
                    <td className="px-5 py-3 align-top font-medium text-ink">{g.name}</td>
                    <td className="px-5 py-3 align-top"><Badge tone={g.attending ? 'sage' : 'neutral'}>{g.attending ? `Hadir · ${g.guestCount} orang` : 'Tidak hadir'}</Badge></td>
                    <td className="px-5 py-3 align-top text-ink-soft">{g.message}</td>
                    <td className="px-5 py-3 align-top text-xs text-ink-soft">{formatDateTime(g.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <p className="py-8 text-center text-sm text-ink-soft">Belum ada respons. Bagikan link undangan ke tamu Anda.</p>
      )}
    </div>
  );
}

// ================= Perpanjang =================

function ExtendTab({ inv }: { inv: InvitationDetail }) {
  const [weeks, setWeeks] = useState(4);
  const [coupon, setCoupon] = useState('');
  const [quote, setQuote] = useState<{ lines: QuoteLine[]; discount: number; total: number; coupon: { valid: boolean; reason?: string; code: string } | null } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const unpublished = !inv.publishedAt;

  useEffect(() => {
    if (unpublished) return;
    const controller = new AbortController();
    const id = setTimeout(() => {
      api<NonNullable<typeof quote>>(`invitations/${inv.id}/extension-quote`, { body: { weeks, couponCode: coupon.trim() || undefined }, signal: controller.signal })
        .then((q) => { setQuote(q); setError(''); })
        .catch((e) => !controller.signal.aborted && setError(errorMessage(e)));
    }, 300);
    return () => { clearTimeout(id); controller.abort(); };
  }, [inv.id, weeks, coupon, unpublished]);

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const order = await api<{ id: string }>(`invitations/${inv.id}/extension-order`, { body: { weeks, couponCode: coupon.trim() || undefined } });
      const res = await api<{ status: string; redirectUrl?: string }>(`payments/${order.id}/start`, { method: 'POST', body: {} });
      window.location.assign(res.status === 'PAID' || !res.redirectUrl ? `/checkout/${order.id}` : res.redirectUrl);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (unpublished) return <Alert tone="info">Undangan belum dipublikasikan, jadi belum perlu diperpanjang. Masa aktif mulai dihitung saat dipublikasikan.</Alert>;

  const revives = inv.status === 'EXPIRED_GRACE';
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-2xl text-ink">{revives ? 'Aktifkan kembali undangan' : 'Perpanjang masa aktif'}</h2>
        <p className="mt-2 text-sm text-ink-soft">{expiryText(inv.status, inv.expiresAt, inv.remainingDays)}. {revives ? 'Setelah dibayar, link langsung bisa dibuka lagi.' : 'Tambahan masa aktif dihitung dari tanggal berakhir saat ini.'}</p>
      </div>
      <Card className="space-y-5 p-6">
        <Field label="Tambah masa aktif" group>
          <div className="flex items-center gap-3">
            <Select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="!w-auto">
              {[1, 2, 4, 8, 12, 26, 52].map((w) => <option key={w} value={w}>{w} minggu</option>)}
            </Select>
          </div>
        </Field>
        <Field label="Kode kupon" error={quote?.coupon && !quote.coupon.valid ? quote.coupon.reason : undefined}>
          <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="KODEKUPON" className="uppercase" />
        </Field>
        {quote && (
          <div>
            <dl className="space-y-2.5 text-sm">
              {quote.lines.map((l) => (
                <div key={l.code} className="flex justify-between gap-4">
                  <dt className="text-ink-soft">{l.label}{l.quantity > 1 && <span className="ml-1 text-xs">({l.quantity} × {rupiah(l.unitPrice)})</span>}</dt>
                  <dd className="font-medium tabular-nums text-ink">{rupiah(l.amount)}</dd>
                </div>
              ))}
              {quote.discount > 0 && <div className="flex justify-between text-sage"><dt>Kupon</dt><dd className="tabular-nums">−{rupiah(quote.discount)}</dd></div>}
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-3xl text-ink">{rupiah(quote.total)}</span>
            </div>
          </div>
        )}
        {error && <Alert>{error}</Alert>}
        <Button size="lg" className="w-full" onClick={pay} loading={busy} disabled={!quote}>{revives ? 'Bayar & aktifkan kembali' : 'Bayar perpanjangan'}</Button>
      </Card>
    </div>
  );
}
