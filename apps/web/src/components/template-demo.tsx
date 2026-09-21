'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { sampleView } from '@/lib/sample';
import type { DemoPhotos } from '@/lib/sample';
import type { TemplateDetail } from '@/lib/types';
import { InvitationView } from './invitation/invitation-view';
import { PhoneFrame } from './invitation/phone-frame';
import { PauseIcon, PlayIcon } from './invitation/ornaments';
import { LinkButton } from './ui';

// Demo interaktif di halaman detail template: ganti warna, dengarkan lagu bawaan, lalu "Pakai template ini".
// Kolom kanan dirakit dari `header` (judul, harga) + tombol pakai + `children` (fitur, add-on) dari server.
export function TemplateDemo({ template, header, children, photos }: { template: TemplateDetail; header: ReactNode; children: ReactNode; photos: DemoPhotos }) {
  const { palettes, musik } = template.layout;
  const [paletteId, setPaletteId] = useState(palettes[0]?.id ?? '');
  const [track, setTrack] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const palette = palettes.find((p) => p.id === paletteId);
  const view = useMemo(() => {
    const theme = palette ? { ...template.layout.theme, primary: palette.primary, secondary: palette.secondary, background: palette.background, text: palette.text } : template.layout.theme;
    return sampleView({ ...template.layout, theme }, {}, photos);
  }, [template.layout, palette, photos]);

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
        <PhoneFrame size="lg">
          <InvitationView view={view} mode="preview" embedded placeholders gate="show" />
        </PhoneFrame>
        <p className="mt-4 text-center text-xs text-ink-soft">Demo interaktif · gulir di dalam layar ponsel</p>

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
    </div>
  );
}
