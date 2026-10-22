'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { COVER_LAYOUTS, defaultCoverLayout, isCoverKind } from '@/lib/cover-layouts';
import { sampleView } from '@/lib/sample';
import type { DemoPhotos } from '@/lib/sample';
import type { TemplateDetail } from '@/lib/types';
import { CoverIcon } from './editor/cover-picker';
import { InvitationView } from './invitation/invitation-view';
import { PhoneFrame } from './invitation/phone-frame';
import { PauseIcon, PlayIcon } from './invitation/ornaments';
import { LinkButton } from './ui';

// Layar ponsel yang terlihat di browser (tanpa bilah alamat & navigasi): ±360x650 di Android, ±390x665 di iPhone.
// Di laptop pratinjau penuh dirender pada ukuran logis ini lalu diskalakan, jadi yang terpotong di ponsel juga terpotong di sini.
const PHONE_W = 390;
const PHONE_H = 700;

function useDesktopScale() {
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const fit = () => setScale(window.innerWidth >= 768 ? Math.min((window.innerHeight * 0.92) / PHONE_H, (window.innerWidth * 0.9) / PHONE_W) : null);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

function FullscreenPreview({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const scale = useDesktopScale();
  const phone = scale !== null;
  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden bg-[#171210] ${phone ? 'flex flex-col items-center justify-center' : ''}`} role="dialog" aria-modal="true" aria-label="Pratinjau template layar penuh">
      <div
        className={phone ? 'relative overflow-hidden rounded-[1.6rem] bg-white shadow-[0_0_80px_rgba(0,0,0,0.55)] ring-8 ring-[#2a221d]' : 'relative mx-auto h-full w-full max-w-[480px] overflow-hidden bg-white shadow-[0_0_80px_rgba(0,0,0,0.55)]'}
        style={phone ? { width: PHONE_W * scale, height: PHONE_H * scale } : undefined}
      >
        <div className="h-full w-full" style={phone ? { width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}>
          {children}
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="absolute right-3 z-[120] flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/40 bg-black/55 text-2xl leading-none text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 focus-visible:ring-4 focus-visible:ring-white/70"
          style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
          aria-label="Tutup pratinjau"
        >
          &times;
        </button>
      </div>
      {phone && <p className="mt-3 text-xs text-white/60">Ukuran layar ponsel {PHONE_W}×{PHONE_H} (area tampil browser ponsel)</p>}
    </div>
  );
}

// Demo interaktif di halaman detail template: ganti warna, dengarkan lagu bawaan, lalu "Pakai template ini".
// Kolom kanan dirakit dari `header` (judul, harga) + tombol pakai + `children` (fitur, add-on) dari server.
export function TemplateDemo({ template, header, children, photos }: { template: TemplateDetail; header: ReactNode; children: ReactNode; photos: DemoPhotos }) {
  const { palettes, musik } = template.layout;
  const coverKinds = (template.layout.coverLayouts ?? []).filter(isCoverKind);
  const [coverKind, setCoverKind] = useState<string>(() => defaultCoverLayout(coverKinds, template.layout.coverDefault));
  // Setelah pengunjung memilih tata letak, gerbang pembuka dilewati supaya sampulnya langsung terlihat.
  const [picked, setPicked] = useState(false);
  const [paletteId, setPaletteId] = useState(palettes[0]?.id ?? '');
  const [track, setTrack] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!previewOpen) return;
    const opener = previewButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      requestAnimationFrame(() => opener?.focus());
    };
  }, [previewOpen]);

  const palette = palettes.find((p) => p.id === paletteId);
  const view = useMemo(() => {
    const theme = palette ? { ...template.layout.theme, primary: palette.primary, secondary: palette.secondary, background: palette.background, text: palette.text } : template.layout.theme;
    return sampleView({ ...template.layout, theme }, {}, photos, coverKind);
  }, [template.layout, palette, photos, coverKind]);

  // Memilih lagu memutarnya; memilih lagu yang sama lagi menghentikannya.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (track === null) {
      a.pause();
      return;
    }
    a.src = musik.presets[track]!.url;
    void a.play().catch(() => undefined);
  }, [track, musik.presets]);

  const createHref = `/create/${template.id}${paletteId && paletteId !== palettes[0]?.id ? `?palette=${encodeURIComponent(paletteId)}` : ''}`;
  const tracks = musik.allowed ? musik.presets : [];

  return (
    <div className="mt-6 grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative mx-auto w-fit">
          <div className="pointer-events-none" aria-hidden="true" inert>
            <PhoneFrame size="sm">
              <InvitationView key={`${coverKind}:teaser`} view={view} mode="preview" embedded placeholders gate="skip" />
            </PhoneFrame>
          </div>
          <button
            ref={previewButtonRef}
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="absolute inset-0 flex items-end justify-center rounded-[2.4rem] bg-gradient-to-t from-black/70 via-transparent to-transparent p-5 text-white outline-none ring-rose transition hover:from-black/80 focus-visible:ring-4"
            aria-haspopup="dialog"
          >
            <span className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-lg">Buka pratinjau penuh</span>
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-ink-soft">Pratinjau interaktif dibuka dalam layar penuh</p>

        {coverKinds.length > 0 && (
          <div className="mt-5 text-center">
            <p className="text-xs font-medium text-ink-soft">Tata letak halaman pertama ({coverKinds.length} pilihan)</p>
            <div className="mx-auto mt-2 flex max-w-sm flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Tata letak halaman pertama">
              {coverKinds.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={k === coverKind}
                  title={COVER_LAYOUTS[k].hint}
                  onClick={() => {
                    setCoverKind(k);
                    setPicked(true);
                  }}
                  className={`flex w-[4.4rem] flex-col items-center gap-1 rounded-xl border px-1 pb-1.5 pt-2 text-[10px] leading-tight transition-colors ${k === coverKind ? 'border-rose bg-rose-soft/50 text-ink' : 'border-line text-ink-soft hover:border-ink/30 hover:text-ink'}`}
                >
                  <CoverIcon kind={k} className={`h-11 w-8 ${k === coverKind ? 'text-rose' : ''}`} />
                  {COVER_LAYOUTS[k].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {palettes.length > 1 && (
          <div className="mt-5 text-center">
            <p className="text-xs font-medium text-ink-soft">Pilihan warna</p>
            <div className="mx-auto mt-2 flex max-w-xs flex-wrap justify-center gap-2" role="radiogroup" aria-label="Pilihan warna">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === paletteId}
                  aria-label={p.name}
                  title={p.name}
                  onClick={() => setPaletteId(p.id)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${p.id === paletteId ? 'border-ink' : 'border-white shadow-sm ring-1 ring-black/10'}`}
                  style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)` }}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-soft">{palette?.name}</p>
          </div>
        )}
      </div>

      <div>
        {header}
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={createHref} size="lg">Pakai template ini</LinkButton>
          <LinkButton href="/pricing" variant="secondary" size="lg">Lihat semua harga</LinkButton>
        </div>

        {tracks.length > 0 && (
          <div className="mt-10 rounded-2xl border border-line bg-paper p-6">
            <audio ref={audioRef} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
            <h2 className="font-semibold text-ink">Pilihan musik ({tracks.length})</h2>
            <p className="mt-1 text-sm text-ink-soft">Ketuk untuk mendengarkan. Lagu dipilih di editor; Anda juga bisa mengunggah lagu sendiri (add-on).</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {tracks.map((p, i) => {
                const active = track === i;
                return (
                  <li key={p.url}>
                    <button
                      type="button"
                      onClick={() => setTrack((cur) => (cur === i ? null : i))}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-rose bg-rose-soft/50 text-ink' : 'border-line text-ink-soft hover:border-ink/30 hover:text-ink'}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose text-white">{active && playing ? <PauseIcon /> : <PlayIcon />}</span>
                      {p.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {children}
      </div>

      {previewOpen && (
        <FullscreenPreview onClose={() => setPreviewOpen(false)}>
          <InvitationView key={`${coverKind}:${picked}:fullscreen`} view={view} mode="preview" embedded placeholders gate={picked ? 'skip' : 'show'} />
        </FullscreenPreview>
      )}
    </div>
  );
}
