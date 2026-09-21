'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InvitationView } from '@/components/invitation/invitation-view';
import { PhoneFrame } from '@/components/invitation/phone-frame';
import { LoginPanel } from '@/components/login-panel';
import { Alert, Badge, Button, Card, Field, Input, Modal, Spinner, Toggle, cn } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';
import { rupiah } from '@/lib/format';
import type { AddOn, InvitationData, InvitationViewData, OrderDetail, Quote, SessionUser, TemplateDetail, Upload } from '@/lib/types';
import { runCheckout } from './checkout';
import type { CheckoutProgress } from './checkout';
import { FieldInput } from './fields';
import type { FieldCtx } from './fields';
import {
  LIMITS,
  compressImage,
  effectiveSections,
  fileProblem,
  missingRequired,
  newClientId,
  referencedIds,
  setField,
  stripMedia,
} from './model';
import type { Draft, LocalFile, Selectable } from './model';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

const ADDON_HELP: Record<Selectable, string> = {
  RSVP_ONLINE: 'Tamu bisa konfirmasi hadir langsung dari undangan.',
  DIGITAL_ENVELOPE: 'Rekening / e-wallet untuk tanda kasih, dengan tombol salin.',
  TRANSLATION_EN: 'Tombol ganti bahasa Indonesia ↔ Inggris.',
  CUSTOM_DOMAIN: 'Link undangan pendek pilihan Anda.',
};

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function Editor({ template, addOns, initialUser, initialPalette }: { template: TemplateDetail; addOns: AddOn[]; initialUser: SessionUser | null; initialPalette?: string }) {
  const router = useRouter();
  const draftKey = `wl:draft:${template.id}`;
  const price = useMemo(() => Object.fromEntries(addOns.map((a) => [a.code, a.price])) as Record<string, number>, [addOns]);

  const [user, setUser] = useState(initialUser);
  const [data, setData] = useState<InvitationData>({});
  const [weeks, setWeeks] = useState(template.includedWeeks);
  const [selected, setSelected] = useState<Selectable[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const palettes = useMemo(() => template.layout.palettes ?? [], [template.layout.palettes]);
  const [paletteId, setPaletteId] = useState(() => (palettes.some((p) => p.id === initialPalette) ? initialPalette! : (palettes[0]?.id ?? '')));
  const [files, setFiles] = useState<Record<string, LocalFile>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkout, setCheckout] = useState<{ progress: CheckoutProgress; error?: string; retry?: { order: OrderDetail; uploads: Upload[]; done: string[] } } | null>(null);

  const filesRef = useRef(files);
  filesRef.current = files;
  useEffect(() => () => Object.values(filesRef.current).forEach((f) => URL.revokeObjectURL(f.url)), []);

  const sections = useMemo(() => effectiveSections(template, selected), [template, selected]);

  // ----- Draft (tanpa file) di localStorage -----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw) as Partial<Draft>;
        if (d.data) setData(d.data);
        if (typeof d.weeks === 'number') setWeeks(Math.min(LIMITS.maxWeeks, Math.max(template.includedWeeks, d.weeks)));
        if (Array.isArray(d.addOns)) setSelected(d.addOns.filter((a): a is Selectable => a in ADDON_HELP && !alreadyIncluded(template, a)));
        if (typeof d.couponCode === 'string') setCouponCode(d.couponCode);
        if (typeof d.customSlug === 'string') setCustomSlug(d.customSlug);
        if (!initialPalette && typeof d.palette === 'string' && palettes.some((p) => p.id === d.palette)) setPaletteId(d.palette);
      }
    } catch {
      /* draft rusak: abaikan */
    }
    setOpen({ [template.layout.sections[0]?.id ?? '']: true, mempelai: true, tanggal_lokasi: true });
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, template]);

  const draft: Draft = useMemo(() => ({ data: stripMedia(data, sections), weeks, addOns: selected, couponCode, customSlug, palette: paletteId }), [data, sections, weeks, selected, couponCode, customSlug, paletteId]);
  const debouncedDraft = useDebounced(draft, 500);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(debouncedDraft));
    } catch {
      /* penyimpanan penuh / diblokir: abaikan */
    }
  }, [debouncedDraft, hydrated, draftKey]);

  // ----- Kalkulator harga live (server = sumber kebenaran) -----
  const slugOk = SLUG_RE.test(customSlug);
  const usedIds = useMemo(() => referencedIds(data, sections).filter((id) => files[id]), [data, sections, files]);
  const requestBody = useMemo(
    () => ({
      templateId: template.id,
      weeks,
      data,
      media: usedIds.map((id) => {
        const lf = files[id]!;
        return { clientId: id, type: lf.type, fileName: lf.file.name, contentType: lf.file.type, sizeBytes: lf.file.size, weeks: lf.weeks && lf.weeks <= weeks ? lf.weeks : undefined };
      }),
      addOns: selected,
      couponCode: couponCode.trim() || undefined,
      customSlug: selected.includes('CUSTOM_DOMAIN') && slugOk ? customSlug : undefined,
      palette: palettes.length > 0 && paletteId ? paletteId : undefined,
    }),
    [template.id, weeks, data, usedIds, files, selected, couponCode, customSlug, slugOk, palettes, paletteId],
  );
  const debouncedBody = useDebounced(requestBody, 350);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoting, setQuoting] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setQuoting(true);
    api<Quote>('pricing/quote', { body: debouncedBody, signal: controller.signal })
      .then((q) => {
        setQuote(q);
        setQuoteError('');
        setQuoting(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setQuoteError(errorMessage(e));
        setQuoting(false);
      });
    return () => controller.abort();
  }, [debouncedBody, hydrated]);

  const charges = useMemo(() => Object.fromEntries((quote?.media ?? []).map((m) => [m.clientId, m])), [quote]);

  // ----- Perubahan field & file -----
  const onChange = useCallback((section: string, key: string, value: string | string[] | undefined) => {
    setData((d) => setField(d, section, key, value));
    setErrors((e) => {
      if (!e[`${section}.${key}`]) return e;
      const { [`${section}.${key}`]: _removed, ...rest } = e;
      void _removed;
      return rest;
    });
  }, []);

  const addFiles = useCallback<FieldCtx['addFiles']>(
    async (type, incoming) => {
      const created: LocalFile[] = [];
      const problems: string[] = [];
      for (const f of incoming) {
        if (Object.keys(filesRef.current).length + created.length >= LIMITS.maxFiles) {
          problems.push('Terlalu banyak file');
          break;
        }
        const problem = fileProblem(f, type);
        if (problem) {
          problems.push(problem);
          continue;
        }
        const file = type === 'PHOTO' ? await compressImage(f) : f;
        created.push({ clientId: newClientId(), file, url: URL.createObjectURL(file), type });
      }
      if (created.length) setFiles((prev) => ({ ...prev, ...Object.fromEntries(created.map((c) => [c.clientId, c])) }));
      setNotice(problems.join(' · '));
      return created;
    },
    [],
  );

  const removeFile = useCallback((clientId: string) => {
    setFiles((prev) => {
      const target = prev[clientId];
      if (target) URL.revokeObjectURL(target.url);
      const { [clientId]: _gone, ...rest } = prev;
      void _gone;
      return rest;
    });
  }, []);

  const setFileWeeks = useCallback((clientId: string, w: number) => {
    setFiles((prev) => (prev[clientId] ? { ...prev, [clientId]: { ...prev[clientId], weeks: w } } : prev));
  }, []);

  const ctx: FieldCtx = {
    data,
    files,
    charges,
    weeks,
    presets: template.layout.musik.presets,
    songPrice: price.CUSTOM_SONG,
    photoPackPrice: price.PHOTO_PACK_5,
    maxPhotos: template.layout.galeri.maxPhotos,
    maxVideos: template.layout.galeri.maxVideos,
    errors,
    onChange,
    addFiles,
    removeFile,
    setFileWeeks,
  };

  // ----- Preview -----
  const paletteTheme = useMemo(() => {
    const p = palettes.find((x) => x.id === paletteId);
    return p ? { ...template.layout.theme, primary: p.primary, secondary: p.secondary, background: p.background, text: p.text } : template.layout.theme;
  }, [template, palettes, paletteId]);
  const view: InvitationViewData = useMemo(
    () => ({
      slug: 'pratinjau',
      templateName: template.name,
      layout: { theme: paletteTheme, sections, musik: { presets: template.layout.musik.presets } },
      features: { english: selected.includes('TRANSLATION_EN') },
      data,
      media: Object.fromEntries(Object.values(files).map((f) => [f.clientId, { url: f.url, type: f.type }])),
      rsvpEnabled: sections.some((s) => s.id === 'rsvp'),
      guestbook: [],
    }),
    [template, sections, selected, data, files, paletteTheme],
  );

  // ----- Checkout -----
  const total = quote?.total;
  async function begin() {
    const missing = missingRequired(data, sections);
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((m) => [`${m.section}.${m.key}`, 'Wajib diisi'])));
      setOpen((o) => ({ ...o, ...Object.fromEntries(missing.map((m) => [m.section, true])) }));
      setNotice(`Lengkapi dulu: ${missing.map((m) => m.label).slice(0, 3).join(', ')}${missing.length > 3 ? ` (+${missing.length - 3} lainnya)` : ''}`);
      setTimeout(() => document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
      return;
    }
    if (selected.includes('CUSTOM_DOMAIN') && !slugOk) {
      setNotice('Isi link custom 3–30 karakter (huruf kecil, angka, tanda hubung).');
      return;
    }
    if (quoteError || !quote) {
      setNotice(quoteError || 'Harga belum selesai dihitung, coba sesaat lagi.');
      return;
    }
    setNotice('');
    if (!user) {
      setLoginOpen(true);
      return;
    }
    await runCheckoutFlow();
  }

  async function runCheckoutFlow(retry?: { order: OrderDetail; uploads: Upload[]; done: string[] }) {
    setCheckout({ progress: { phase: 'creating', files: {}, fileNames: {} } });
    try {
      const result = await runCheckout({
        body: requestBody,
        files,
        existing: retry ? { order: retry.order, uploads: retry.uploads } : undefined,
        done: retry?.done,
        send: (progress) => setCheckout({ progress }),
      });
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* abaikan */
      }
      window.location.assign(result.next);
    } catch (error) {
      const info = error as Error & { created?: { order: OrderDetail; uploads: Upload[] }; done?: string[] };
      setCheckout((c) => ({
        progress: c?.progress ?? { phase: 'creating', files: {}, fileNames: {} },
        error: errorMessage(error),
        retry: info.created ? { ...info.created, done: info.done ?? [] } : undefined,
      }));
    }
  }

  async function cancelPending() {
    const orderId = checkout?.retry?.order.id;
    if (orderId) await api(`orders/${orderId}/cancel`, { method: 'POST', body: {} }).catch(() => undefined);
    setCheckout(null);
  }

  function includedOnTemplate(code: Selectable) {
    return alreadyIncluded(template, code);
  }
  const selectable = (['RSVP_ONLINE', 'DIGITAL_ENVELOPE', 'TRANSLATION_EN', 'CUSTOM_DOMAIN'] as Selectable[]).filter((c) => !includedOnTemplate(c) && price[c] !== undefined);
  const extendPrice = price.EXTEND_ACTIVE_WEEK ?? 0;

  const summary = (
    <SummaryCard quote={quote} loading={quoting} error={quoteError} weeks={weeks} includedWeeks={template.includedWeeks} />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:pb-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/templates/${template.id}`} className="text-sm text-ink-soft hover:text-ink">← {template.name}</Link>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Isi undangan Anda</h1>
          <p className="mt-2 text-sm text-ink-soft">Pratinjau dan total harga ikut berubah saat Anda mengetik. Belum perlu akun sampai checkout.</p>
        </div>
        <Badge tone="rose">Draf tersimpan otomatis di browser ini</Badge>
      </div>

      {notice && <Alert tone="warn" className="mb-6">{notice}</Alert>}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {sections.map((section) => {
            const isOpen = !!open[section.id];
            const missing = section.fields.filter((f) => f.required && !hasValue(data, section.id, f.key)).length;
            return (
              <Card key={section.id} className="overflow-hidden">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => ({ ...o, [section.id]: !isOpen }))}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-xs', section.fields.length === 0 || missing === 0 ? 'bg-sage-soft text-sage' : 'bg-rose-soft text-rose')}>
                      {section.fields.length === 0 || missing === 0 ? '✓' : missing}
                    </span>
                    <span className="font-semibold text-ink">{section.title}</span>
                    {section.fields.length === 0 && <span className="text-xs text-ink-soft">otomatis</span>}
                  </span>
                  {section.fields.length > 0 && <span className={cn('text-ink-soft transition-transform', isOpen && 'rotate-180')}>⌄</span>}
                </button>
                {isOpen && section.fields.length > 0 && (
                  <div className="grid gap-4 border-t border-line px-5 py-5 sm:grid-cols-2">
                    {section.fields.map((f) => (
                      <div key={f.key} data-error={!!errors[`${section.id}.${f.key}`]} className={f.type === 'textarea' || f.type === 'gallery' || f.type === 'videos' || f.type === 'song' || f.type === 'image' ? 'sm:col-span-2' : ''}>
                        <FieldInput section={section.id} field={f} ctx={ctx} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

          {palettes.length > 1 && (
            <Card className="p-5">
              <h2 className="font-semibold text-ink">Warna undangan</h2>
              <p className="mt-1 text-sm text-ink-soft">Gratis, dan bisa diganti lagi setelah undangan dibeli.</p>
              <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="Warna undangan">
                {palettes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={p.id === paletteId}
                    onClick={() => setPaletteId(p.id)}
                    className={cn('flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm transition-colors', p.id === paletteId ? 'border-rose bg-rose-soft/50 text-ink' : 'border-line text-ink-soft hover:border-ink/30 hover:text-ink')}
                  >
                    <span className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)` }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-semibold text-ink">Masa aktif & tambahan</h2>
            <div className="mt-4 space-y-5">
              <Field label="Masa aktif undangan" group hint={`Termasuk ${template.includedWeeks} minggu di harga template. Tiap minggu tambahan ${rupiah(extendPrice)}.`}>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setWeeks((w) => Math.max(template.includedWeeks, w - 1))} disabled={weeks <= template.includedWeeks} aria-label="Kurangi minggu">−</Button>
                  <span className="min-w-24 text-center text-lg font-semibold tabular-nums text-ink">{weeks} minggu</span>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setWeeks((w) => Math.min(LIMITS.maxWeeks, w + 1))} disabled={weeks >= LIMITS.maxWeeks} aria-label="Tambah minggu">+</Button>
                  {weeks > template.includedWeeks && <Badge tone="gold">+{rupiah((weeks - template.includedWeeks) * extendPrice)}</Badge>}
                </div>
              </Field>

              {selectable.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-ink">Tambahan opsional</p>
                  {selectable.map((code) => {
                    const on = selected.includes(code);
                    const addon = addOns.find((a) => a.code === code)!;
                    return (
                      <div key={code} className="rounded-xl border border-line px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-ink">{addon.name}</p>
                            <p className="text-xs text-ink-soft">{ADDON_HELP[code]}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold tabular-nums text-ink">{rupiah(addon.price)}</span>
                            <Toggle checked={on} label={addon.name} onChange={(v) => setSelected((s) => (v ? [...s, code] : s.filter((x) => x !== code)))} />
                          </div>
                        </div>
                        {code === 'CUSTOM_DOMAIN' && on && (
                          <div className="mt-3">
                            <Field label="Link undangan" error={customSlug && !slugOk ? '3–30 karakter: huruf kecil, angka, tanda hubung' : undefined} hint="Contoh: andi-sinta">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 text-sm text-ink-soft">…/u/</span>
                                <Input value={customSlug} onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} maxLength={30} placeholder="andi-sinta" />
                              </div>
                            </Field>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Field label="Kode kupon" hint={quote?.coupon ? undefined : 'Punya kode dari teman atau keluarga? Masukkan di sini.'} error={quote?.coupon && !quote.coupon.valid ? quote.coupon.reason : undefined}>
                <div className="flex items-center gap-2">
                  <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="KODEKUPON" maxLength={40} className="uppercase" />
                  {quote?.coupon?.valid && <Badge tone="sage">−{rupiah(quote.coupon.discount)}</Badge>}
                </div>
              </Field>
            </div>
          </Card>

          <div className="lg:hidden">{summary}</div>
          <div className="hidden lg:block">
            {summary}
            <CheckoutButton onClick={begin} total={total} loading={!quote || quoting} className="mt-4" />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <PhoneFrame size="md" watermark>
              <InvitationView view={view} mode="preview" embedded placeholders />
            </PhoneFrame>
            <div className="mt-5 rounded-2xl border border-line bg-paper p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-ink-soft">Total sementara</p>
              <p className={cn('font-display text-3xl text-ink transition-opacity', quoting && 'opacity-50')}>{total === undefined ? '—' : rupiah(total)}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Bilah bawah (ponsel) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-ink-soft">Total</p>
            <p className={cn('font-display text-xl text-ink', quoting && 'opacity-50')}>{total === undefined ? '—' : rupiah(total)}</p>
          </div>
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Pratinjau</Button>
          <Button onClick={begin} loading={!quote || quoting}>Checkout</Button>
        </div>
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Pratinjau undangan">
        <div className="flex justify-center">
          <PhoneFrame size="md" watermark>
            <InvitationView view={view} mode="preview" embedded placeholders />
          </PhoneFrame>
        </div>
      </Modal>

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title="Masuk untuk melanjutkan">
        <p className="mb-5 text-sm text-ink-soft">Akun diperlukan agar Anda bisa kembali mengedit, memperpanjang, dan melihat RSVP. Isi undangan & file yang sudah Anda pilih tidak hilang.</p>
        <LoginPanel
          onSuccess={(u) => {
            setUser(u);
            setLoginOpen(false);
            router.refresh();
            void runCheckoutFlow();
          }}
        />
      </Modal>

      {checkout && <CheckoutOverlay state={checkout} onRetry={() => runCheckoutFlow(checkout.retry)} onCancel={cancelPending} />}
    </div>
  );
}

function alreadyIncluded(template: TemplateDetail, code: string) {
  const ids = template.layout.sections.map((s) => s.id);
  return (code === 'RSVP_ONLINE' && ids.includes('rsvp')) || (code === 'DIGITAL_ENVELOPE' && ids.includes('amplop_digital'));
}

function hasValue(data: InvitationData, section: string, key: string) {
  const v = data[section]?.[key];
  return !(v === undefined || v === '' || (Array.isArray(v) && v.length === 0));
}

function SummaryCard({ quote, loading, error, weeks, includedWeeks }: { quote: Quote | null; loading: boolean; error: string; weeks: number; includedWeeks: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Ringkasan harga</h2>
        {loading && <Spinner className="h-4 w-4 text-ink-soft" />}
      </div>
      {error && <Alert className="mt-3">{error}</Alert>}
      {quote ? (
        <div className={cn('mt-4 transition-opacity', loading && 'opacity-60')}>
          <dl className="space-y-2.5 text-sm">
            {quote.lines.map((l) => (
              <div key={l.code} className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-soft">
                  {l.label}
                  {l.quantity > 1 && <span className="ml-1 text-xs">({l.quantity} × {rupiah(l.unitPrice)})</span>}
                </dt>
                <dd className="font-medium tabular-nums text-ink">{rupiah(l.amount)}</dd>
              </div>
            ))}
            {quote.discount > 0 && (
              <div className="flex items-baseline justify-between gap-4 text-sage">
                <dt>Kupon {quote.coupon?.valid ? quote.coupon.code : ''}</dt>
                <dd className="font-medium tabular-nums">−{rupiah(quote.discount)}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-display text-3xl text-ink">{rupiah(quote.total)}</span>
          </div>
          <p className="mt-2 text-xs text-ink-soft">Masa aktif {weeks} minggu{weeks > includedWeeks ? ` (${includedWeeks} minggu termasuk di template)` : ''} sejak dipublikasikan.</p>
        </div>
      ) : (
        !error && <p className="mt-4 text-sm text-ink-soft">Menghitung…</p>
      )}
    </Card>
  );
}

function CheckoutButton({ onClick, total, loading, className }: { onClick: () => void; total?: number; loading: boolean; className?: string }) {
  return (
    <div className={className}>
      <Button size="lg" className="w-full" onClick={onClick} loading={loading}>
        Lanjut ke pembayaran{total !== undefined ? ` · ${rupiah(total)}` : ''}
      </Button>
      <p className="mt-2 text-center text-xs text-ink-soft">Pembayaran via QRIS, virtual account, atau e-wallet. Refund penuh selama belum dipublikasikan (≤48 jam).</p>
    </div>
  );
}

function CheckoutOverlay({ state, onRetry, onCancel }: { state: { progress: CheckoutProgress; error?: string; retry?: { order: OrderDetail } }; onRetry: () => void; onCancel: () => void }) {
  const { progress, error } = state;
  const ids = Object.keys(progress.fileNames);
  const label = { creating: 'Membuat pesanan…', uploading: 'Mengunggah file…', paying: 'Menyiapkan pembayaran…', redirecting: 'Mengarahkan ke pembayaran…' }[progress.phase];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label="Memproses checkout">
      <div className="w-full max-w-md rounded-3xl bg-paper p-7 shadow-2xl">
        <h2 className="font-display text-2xl text-ink">{error ? 'Checkout terhenti' : 'Sedang diproses'}</h2>
        {!error && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft"><Spinner className="h-4 w-4" /> {label}</p>
        )}
        {ids.length > 0 && (
          <ul className="mt-5 max-h-56 space-y-3 overflow-y-auto pr-1">
            {ids.map((id) => {
              const p = progress.files[id] ?? 0;
              return (
                <li key={id}>
                  <div className="flex justify-between gap-3 text-xs text-ink-soft">
                    <span className="truncate">{progress.fileNames[id]}</span>
                    <span className="tabular-nums">{p >= 1 ? '✓' : `${Math.round(p * 100)}%`}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-rose transition-[width]" style={{ width: `${Math.round(p * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {error && (
          <>
            <Alert className="mt-5">{error}</Alert>
            <p className="mt-3 text-xs text-ink-soft">
              {state.retry ? 'Pesanan Anda sudah tercatat. Coba lagi, atau batalkan lalu mulai ulang. Jangan tutup atau muat ulang halaman ini agar file tidak hilang.' : 'Periksa isian Anda lalu coba lagi.'}
            </p>
            <div className="mt-5 flex gap-3">
              <Button className="flex-1" onClick={state.retry ? onRetry : onCancel}>{state.retry ? 'Coba lagi' : 'Tutup'}</Button>
              {state.retry && <Button variant="secondary" onClick={onCancel}>Batalkan pesanan</Button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
