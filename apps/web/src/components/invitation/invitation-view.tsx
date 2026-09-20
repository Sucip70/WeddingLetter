'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { formatLocalDate, formatLocalTime, localToInstant, parseLocal } from '@/lib/format';
import type { InvitationViewData } from '@/lib/types';
import { STRINGS } from './i18n';
import type { Lang, Strings } from './i18n';
import { Corner, Divider, PauseIcon, PlayIcon, Sprig } from './ornaments';

export interface InvitationViewProps {
  view: InvitationViewData;
  // preview: RSVP tidak benar-benar terkirim & musik tidak autoplay.
  mode?: 'live' | 'preview';
  // Dirender di dalam bingkai ponsel (kontainer ini yang scroll, bukan window).
  embedded?: boolean;
  // Tampilkan kotak foto contoh bila belum ada foto (untuk demo template & editor).
  placeholders?: boolean;
}

const HEADING_FONT = { script: 'var(--font-script)', serif: 'var(--font-cormorant)', sans: 'var(--font-jakarta)' } as const;
const BODY_FONT = { serif: 'var(--font-cormorant)', sans: 'var(--font-jakarta)' } as const;

type Data = InvitationViewData['data'];
const str = (data: Data, section: string, key: string) => {
  const v = data[section]?.[key];
  return typeof v === 'string' ? v : '';
};
const list = (data: Data, section: string, key: string) => {
  const v = data[section]?.[key];
  return Array.isArray(v) ? v : [];
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

function gcalLink(title: string, start: string, location: string) {
  const d = parseLocal(start);
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (x: Date) => `${x.getUTCFullYear()}${pad(x.getUTCMonth() + 1)}${pad(x.getUTCDate())}T${pad(x.getUTCHours())}${pad(x.getUTCMinutes())}00`;
  const end = new Date(d.getTime() + 2 * 3600_000);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${fmt(d)}/${fmt(end)}`, ctz: 'Asia/Jakarta', location });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function InvitationView({ view, mode = 'live', embedded = false, placeholders = false }: InvitationViewProps) {
  const { theme } = view.layout;
  const { data } = view;
  const [lang, setLang] = useState<Lang>('id');
  const t = STRINGS[lang] as Strings;
  const [playing, setPlaying] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Nama tamu dari ?to= (hanya di halaman live). Snapshot server = null supaya hidrasi konsisten.
  const guest = useSyncExternalStore(
    () => () => undefined,
    () => (mode === 'live' ? (new URLSearchParams(window.location.search).get('to')?.slice(0, 60) ?? null) : null),
    () => null,
  );
  const url = (id: string | undefined) => (id ? view.media[id]?.url : undefined);

  const musicUrl = useMemo(() => {
    const song = str(data, 'musik', 'lagu');
    if (!song) return undefined;
    const m = /^preset:(\d+)$/.exec(song);
    return m ? view.layout.musik.presets[Number(m[1])]?.url : view.media[song]?.url;
  }, [data, view.layout.musik.presets, view.media]);

  const toggleMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  }, []);

  const open = useCallback(() => {
    if (mode === 'live' && audioRef.current?.paused) void audioRef.current.play().catch(() => undefined);
    const top = (coverRef.current?.offsetHeight ?? 0) - 1;
    if (embedded) rootRef.current?.scrollTo({ top, behavior: 'smooth' });
    else window.scrollTo({ top, behavior: 'smooth' });
  }, [mode, embedded]);

  const groom = str(data, 'mempelai', 'pria_nama');
  const bride = str(data, 'mempelai', 'wanita_nama');
  const names = groom && bride ? `${groom} & ${bride}` : placeholders ? 'Andi & Sinta' : groom || bride || 'Undangan';
  const akad = str(data, 'tanggal_lokasi', 'akad_tanggal');
  const resepsi = str(data, 'tanggal_lokasi', 'resepsi_tanggal');
  const mainDate = akad || resepsi;
  const shortDate = (() => {
    const d = parseLocal(mainDate);
    if (!d) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getUTCDate())} . ${p(d.getUTCMonth() + 1)} . ${d.getUTCFullYear()}`;
  })();

  const rootStyle = {
    '--p': theme.primary,
    '--s': theme.secondary,
    '--bg': theme.background,
    '--tx': theme.text,
    background: theme.background,
    color: theme.text,
    fontFamily: BODY_FONT[theme.bodyFont],
  } as CSSProperties;
  const headingStyle: CSSProperties = { fontFamily: HEADING_FONT[theme.headingFont], color: 'var(--p)' };
  const soft = 'color-mix(in srgb, var(--p) 9%, var(--bg))';
  const bodyText = theme.bodyFont === 'serif' ? 'text-[17px] leading-relaxed' : 'text-sm leading-relaxed';

  const coverPhoto = url(str(data, 'cover', 'foto'));

  const galleryPhotos = list(data, 'galeri', 'foto').map(url).filter((x): x is string => !!x);
  const galleryVideos = list(data, 'galeri', 'video').map(url).filter((x): x is string => !!x);

  const visible = view.layout.sections.filter((s) => {
    switch (s.id) {
      case 'cover':
      case 'musik':
        return false;
      case 'mempelai':
        return !!(groom || bride) || placeholders;
      case 'cerita':
        return !!(str(data, 'cerita', 'cerita') || str(data, 'cerita', 'kutipan')) || placeholders;
      case 'tanggal_lokasi':
        return !!(akad || resepsi) || placeholders;
      case 'countdown':
        return !!mainDate;
      case 'galeri':
        return galleryPhotos.length > 0 || galleryVideos.length > 0 || placeholders;
      case 'rsvp':
        return view.rsvpEnabled;
      case 'amplop_digital':
        return !!(str(data, 'amplop_digital', 'rekening_1') || str(data, 'amplop_digital', 'rekening_2') || str(data, 'amplop_digital', 'alamat_kado')) || placeholders;
      case 'buku_tamu':
        return true;
      default:
        return false;
    }
  });

  return (
    <div ref={rootRef} style={rootStyle} className={embedded ? 'thin-scroll h-full overflow-y-auto overflow-x-hidden' : 'mx-auto w-full max-w-[480px] overflow-x-hidden shadow-[0_0_60px_rgba(0,0,0,0.08)]'}>
      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}

      {/* ===== Sampul ===== */}
      <section
        ref={coverRef}
        className="relative flex flex-col items-center justify-center overflow-hidden px-8 text-center"
        style={embedded ? { height: '100%' } : { minHeight: '100svh' }}
      >
        {coverPhoto ? (
          <>
            <img src={coverPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.15) 40%, rgba(0,0,0,.6))' }} />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(165deg, color-mix(in srgb, var(--p) 20%, var(--bg)), var(--bg) 52%, color-mix(in srgb, var(--p) 10%, color-mix(in srgb, var(--s) 12%, var(--bg))))' }}
          />
        )}
        {!coverPhoto && (
          <>
            <Corner className="absolute left-2 top-2 w-24" rotate={0} />
            <Corner className="absolute right-2 top-2 w-24" rotate={90} />
            <Corner className="absolute bottom-2 right-2 w-24" rotate={180} />
            <Corner className="absolute bottom-2 left-2 w-24" rotate={270} />
          </>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ color: coverPhoto ? '#fff' : 'var(--p)' }} />

        {view.features.english && (
          <button
            onClick={() => setLang((l) => (l === 'id' ? 'en' : 'id'))}
            className="absolute right-4 top-4 z-10 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
            style={{ borderColor: coverPhoto ? 'rgba(255,255,255,.6)' : 'var(--p)', color: coverPhoto ? '#fff' : 'var(--p)' }}
            aria-label="Ganti bahasa / Switch language"
          >
            {lang === 'id' ? 'ID · EN' : 'EN · ID'}
          </button>
        )}

        <div className="relative z-[1] flex flex-col items-center" style={{ color: coverPhoto ? '#fff' : 'var(--tx)' }}>
          <p className="text-xs uppercase tracking-[0.35em] opacity-80">{t.weddingOf}</p>
          <h1 className="mt-5 text-6xl leading-[1.05]" style={{ ...headingStyle, color: coverPhoto ? '#fff' : 'var(--p)', fontSize: theme.headingFont === 'script' ? '4rem' : '3rem', fontWeight: theme.headingFont === 'script' ? 400 : 600 }}>
            {names}
          </h1>
          {shortDate && <p className="mt-5 text-sm tracking-[0.3em]">{shortDate}</p>}
          <Divider className="mt-6 w-32 opacity-80" />
          {(mode === 'live' || placeholders) && (
            <div className="mt-8 text-sm">
              <p className="opacity-80">{t.dear}</p>
              <p className="mt-1 text-lg font-semibold">{guest ?? t.guestFallback}</p>
            </div>
          )}
          <button
            onClick={open}
            className="mt-10 rounded-full px-7 py-3 text-sm font-medium tracking-wide shadow-lg transition-transform hover:scale-[1.03]"
            style={{ background: coverPhoto ? '#fff' : 'var(--p)', color: coverPhoto ? '#222' : '#fff' }}
          >
            {t.open}
          </button>
        </div>
      </section>

      {/* ===== Isi ===== */}
      {visible.map((section) => {
        switch (section.id) {
          case 'mempelai':
            return (
              <Block key="mempelai" title={t.couple} headingStyle={headingStyle}>
                <div className="space-y-12">
                  {(['pria', 'wanita'] as const).map((who, i) => {
                    const nick = str(data, 'mempelai', `${who}_nama`) || (placeholders ? (who === 'pria' ? 'Andi' : 'Sinta') : '');
                    if (!nick) return null;
                    const full = str(data, 'mempelai', `${who}_lengkap`);
                    const parents = str(data, 'mempelai', `${who}_ortu`);
                    const photo = url(str(data, 'mempelai', `${who}_foto`));
                    return (
                      <div key={who} className="flex flex-col items-center text-center">
                        <div className="relative">
                          <Arch src={photo} placeholders={placeholders} label={nick} />
                          <Sprig className={`absolute -bottom-3 w-20 ${i ? '-right-6' : '-left-6'}`} flip={!!i} />
                        </div>
                        <p className="mt-6 text-xs uppercase tracking-[0.3em] opacity-60">{who === 'pria' ? t.groom : t.bride}</p>
                        <h3 className="mt-2 text-4xl" style={{ ...headingStyle, fontWeight: theme.headingFont === 'script' ? 400 : 600 }}>
                          {full || nick}
                        </h3>
                        {parents && <p className={`mt-2 max-w-[18rem] opacity-80 ${bodyText}`}>{parents}</p>}
                      </div>
                    );
                  })}
                </div>
              </Block>
            );

          case 'cerita': {
            const quote = str(data, 'cerita', 'kutipan') || (placeholders ? 'Di antara sekian banyak pilihan, hatiku memilihmu.' : '');
            const story = str(data, 'cerita', 'cerita');
            return (
              <Block key="cerita" title={t.story} headingStyle={headingStyle} tint={soft}>
                {quote && <blockquote className="text-center text-xl italic leading-relaxed" style={{ fontFamily: 'var(--font-cormorant)' }}>“{quote}”</blockquote>}
                {story && <p className={`mt-6 whitespace-pre-line text-center ${bodyText}`}>{story}</p>}
              </Block>
            );
          }

          case 'tanggal_lokasi':
            return (
              <Block key="tanggal_lokasi" title={t.event} headingStyle={headingStyle} tint={soft}>
                <div className="space-y-6">
                  {(['akad', 'resepsi'] as const).map((ev) => {
                    const when = str(data, 'tanggal_lokasi', `${ev}_tanggal`) || (placeholders && ev === 'akad' ? '2027-01-16T10:00' : '');
                    if (!when) return null;
                    const place = str(data, 'tanggal_lokasi', `${ev}_lokasi`) || (placeholders ? 'Gedung Serbaguna Cahaya' : '');
                    const address = str(data, 'tanggal_lokasi', `${ev}_alamat`);
                    const maps = str(data, 'tanggal_lokasi', `${ev}_maps`);
                    const cal = gcalLink(`${ev === 'akad' ? t.akad : t.reception} ${names}`, when, [place, address].filter(Boolean).join(', '));
                    return (
                      <div key={ev} className="rounded-3xl border p-7 text-center" style={{ borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)', background: 'var(--bg)' }}>
                        <h3 className="text-3xl" style={{ ...headingStyle, fontWeight: theme.headingFont === 'script' ? 400 : 600 }}>{ev === 'akad' ? t.akad : t.reception}</h3>
                        <p className="mt-4 text-lg font-semibold">{formatLocalDate(when, lang)}</p>
                        <p className="opacity-80">{formatLocalTime(when)}</p>
                        <Divider className="mx-auto my-4 w-24 opacity-70" />
                        {place && <p className="font-semibold">{place}</p>}
                        {address && <p className={`mt-1 opacity-80 ${bodyText}`}>{address}</p>}
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                          {maps && (
                            <a href={maps} target="_blank" rel="noopener noreferrer" className="rounded-full px-4 py-2 text-xs font-medium text-white" style={{ background: 'var(--p)' }}>
                              {t.openMaps}
                            </a>
                          )}
                          {cal && (
                            <a href={cal} target="_blank" rel="noopener noreferrer" className="rounded-full border px-4 py-2 text-xs font-medium" style={{ borderColor: 'var(--p)', color: 'var(--p)' }}>
                              {t.saveDate}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Block>
            );

          case 'countdown':
            return <Countdown key="countdown" target={mainDate} t={t} headingStyle={headingStyle} />;

          case 'galeri':
            return (
              <Block key="galeri" title={t.gallery} headingStyle={headingStyle}>
                {galleryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {galleryPhotos.map((src, i) => (
                      <button key={src} onClick={() => setLightbox(i)} className={`overflow-hidden rounded-xl ${i % 3 === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'}`} aria-label={`Foto ${i + 1}`}>
                        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                      </button>
                    ))}
                  </div>
                ) : (
                  placeholders && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[0, 1, 2, 3].map((i) => (
                        <PhotoPlaceholder key={i} className={i === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'} />
                      ))}
                    </div>
                  )
                )}
                {galleryVideos.map((src) => (
                  <video key={src} src={src} controls playsInline preload="metadata" className="mt-3 w-full rounded-xl bg-black" />
                ))}
              </Block>
            );

          case 'rsvp':
            return (
              <Block key="rsvp" title={t.rsvp} headingStyle={headingStyle} tint={soft}>
                <p className={`mb-6 text-center opacity-85 ${bodyText}`}>{str(data, 'rsvp', 'pengantar') || t.rsvpIntro}</p>
                <RsvpForm slug={view.slug} preview={mode === 'preview'} t={t} accent="var(--p)" />
              </Block>
            );

          case 'amplop_digital': {
            const accounts = [1, 2]
              .map((n) => ({ bank: str(data, 'amplop_digital', `bank_${n}`), number: str(data, 'amplop_digital', `rekening_${n}`), holder: str(data, 'amplop_digital', `atas_nama_${n}`) }))
              .filter((a) => a.number);
            const list2 = accounts.length ? accounts : placeholders ? [{ bank: 'BCA', number: '1234567890', holder: 'Andi Pratama' }] : [];
            const address = str(data, 'amplop_digital', 'alamat_kado');
            return (
              <Block key="amplop" title={t.envelope} headingStyle={headingStyle}>
                <p className={`mb-6 text-center opacity-85 ${bodyText}`}>{t.envelopeIntro}</p>
                <div className="space-y-3">
                  {list2.map((a) => (
                    <CopyCard key={a.number} bank={a.bank} number={a.number} holder={a.holder} t={t} />
                  ))}
                  {address && (
                    <div className="rounded-2xl border p-5 text-center" style={{ borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)' }}>
                      <p className="text-xs uppercase tracking-widest opacity-60">{t.giftAddress}</p>
                      <p className={`mt-2 ${bodyText}`}>{address}</p>
                    </div>
                  )}
                </div>
              </Block>
            );
          }

          case 'buku_tamu':
            return <Guestbook key="buku" slug={view.slug} initial={view.guestbook} t={t} headingStyle={headingStyle} soft={soft} placeholders={placeholders} />;
        }
        return null;
      })}

      <footer className="px-6 pb-24 pt-12 text-center text-xs opacity-60">
        <Sprig className="mx-auto mb-3 w-20" />
        <p style={{ color: 'var(--tx)' }}>{names}</p>
        <p className="mt-1">{t.madeWith}</p>
      </footer>

      {musicUrl && (
        <div className="pointer-events-none sticky bottom-4 z-20 flex h-0 justify-end pr-4">
          <button
            onClick={toggleMusic}
            className="pointer-events-auto -mt-12 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
            style={{ background: 'var(--p)' }}
            aria-label={playing ? 'Jeda musik' : 'Putar musik'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      )}

      {lightbox !== null && <Lightbox photos={galleryPhotos} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />}
    </div>
  );
}

function Block({ title, children, headingStyle, tint }: { title: string; children: ReactNode; headingStyle: CSSProperties; tint?: string }) {
  return (
    <section className="px-6 py-16" style={{ background: tint }}>
      <div className="mb-10 text-center">
        <h2 className="text-4xl" style={{ ...headingStyle, fontWeight: 500 }}>{title}</h2>
        <Divider className="mx-auto mt-3 w-28" />
      </div>
      {children}
    </section>
  );
}

function PhotoPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-xl ${className}`} style={{ background: 'linear-gradient(140deg, color-mix(in srgb, var(--p) 22%, var(--bg)), color-mix(in srgb, var(--s) 40%, var(--bg)))' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--p)', opacity: 0.55 }} aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M4 18l5-5 4 4 3-3 4 4" />
      </svg>
    </div>
  );
}

function Arch({ src, placeholders, label }: { src?: string; placeholders?: boolean; label: string }) {
  const shape = 'h-56 w-44 rounded-t-[999px] rounded-b-2xl object-cover';
  return (
    <div className="rounded-t-[999px] rounded-b-3xl p-1.5" style={{ border: '1px solid color-mix(in srgb, var(--p) 45%, transparent)' }}>
      {src ? (
        <img src={src} alt={label} className={shape} />
      ) : placeholders ? (
        <div className={`${shape} flex items-center justify-center`} style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--p) 25%, var(--bg)), color-mix(in srgb, var(--s) 45%, var(--bg)))' }}>
          <span className="text-5xl" style={{ fontFamily: 'var(--font-script)', color: 'var(--p)' }}>{label.charAt(0)}</span>
        </div>
      ) : (
        <div className={`${shape} flex items-center justify-center`} style={{ background: 'color-mix(in srgb, var(--p) 10%, var(--bg))' }}>
          <span className="text-5xl" style={{ fontFamily: 'var(--font-script)', color: 'var(--p)' }}>{label.charAt(0)}</span>
        </div>
      )}
    </div>
  );
}

function Countdown({ target, t, headingStyle }: { target: string; t: Strings; headingStyle: CSSProperties }) {
  const now = useNow();
  const end = localToInstant(target);
  const diff = now === null || Number.isNaN(end) ? null : Math.max(0, end - now);
  const parts = diff === null ? null : [Math.floor(diff / 86_400_000), Math.floor((diff / 3_600_000) % 24), Math.floor((diff / 60_000) % 60), Math.floor((diff / 1000) % 60)];
  const labels = [t.days, t.hours, t.minutes, t.seconds];
  return (
    <section className="px-6 py-14 text-center" style={{ background: 'var(--p)', color: '#fff' }}>
      <h2 className="text-3xl" style={{ ...headingStyle, color: '#fff', fontWeight: 500 }}>{t.countdown}</h2>
      <div className="mt-7 grid grid-cols-4 gap-2.5" role="timer" aria-live="off">
        {labels.map((label, i) => (
          <div key={label} className="rounded-2xl bg-white/15 py-4 backdrop-blur-sm">
            <div className="text-3xl font-semibold tabular-nums" style={{ fontFamily: 'var(--font-cormorant)' }}>{parts ? String(parts[i]).padStart(2, '0') : '--'}</div>
            <div className="mt-1 text-[11px] uppercase tracking-widest opacity-80">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CopyCard({ bank, number, holder, t }: { bank: string; number: string; holder: string; t: Strings }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-2xl border p-5 text-center" style={{ borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)' }}>
      {bank && <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--p)' }}>{bank}</p>}
      <p className="mt-2 text-2xl font-semibold tracking-wider tabular-nums" style={{ fontFamily: 'var(--font-cormorant)' }}>{number}</p>
      {holder && <p className="mt-1 text-sm opacity-75">a.n. {holder}</p>}
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(number).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          });
        }}
        className="mt-3 rounded-full border px-4 py-1.5 text-xs font-medium"
        style={{ borderColor: 'var(--p)', color: 'var(--p)' }}
      >
        {done ? t.copied : t.copy}
      </button>
    </div>
  );
}

function RsvpForm({ slug, preview, t, accent }: { slug: string; preview: boolean; t: Strings; accent: string }) {
  const [name, setName] = useState('');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (attending === null) return setError(`${t.attending} / ${t.notAttending}?`);
    setError('');
    if (preview) return setError(t.previewNote);
    setState('sending');
    try {
      const res = await fetch(`/api/backend/public/invitations/${slug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, attending, guestCount: count, message: message || undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Gagal mengirim');
      setState('done');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Gagal mengirim');
    }
  }

  if (state === 'done') return <p className="rounded-2xl p-6 text-center font-medium" style={{ background: 'var(--bg)', color: accent }}>{t.thanks}</p>;

  const field = 'w-full rounded-xl border bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2';
  const fieldStyle = { borderColor: 'color-mix(in srgb, var(--p) 30%, transparent)', color: '#2b2420' } as CSSProperties;
  return (
    <form onSubmit={submit} className="space-y-3">
      <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} className={field} style={fieldStyle} aria-label={t.name} />
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Kehadiran">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setAttending(v)}
            className="rounded-xl border px-3 py-3 text-sm font-medium transition-colors"
            style={attending === v ? { background: accent, color: '#fff', borderColor: accent } : { borderColor: 'color-mix(in srgb, var(--p) 30%, transparent)', background: 'rgba(255,255,255,.8)', color: '#2b2420' }}
            aria-pressed={attending === v}
          >
            {v ? t.attending : t.notAttending}
          </button>
        ))}
      </div>
      {attending && (
        <label className="flex items-center justify-between rounded-xl border bg-white/80 px-4 py-2.5 text-sm" style={{ borderColor: 'color-mix(in srgb, var(--p) 30%, transparent)', color: '#2b2420' }}>
          {t.guests}
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg bg-transparent px-2 py-1 font-semibold">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} placeholder={t.message} className={field} style={fieldStyle} aria-label={t.message} />
      {error && <p className="text-center text-sm" style={{ color: '#b42318' }} role="alert">{error}</p>}
      <button type="submit" disabled={state === 'sending'} className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: accent }}>
        {state === 'sending' ? t.sending : t.send}
      </button>
    </form>
  );
}

function Guestbook({ slug, initial, t, headingStyle, soft, placeholders }: { slug: string; initial: InvitationViewData['guestbook']; t: Strings; headingStyle: CSSProperties; soft: string; placeholders: boolean }) {
  void slug;
  const items = initial.length ? initial : placeholders ? [
    { name: 'Budi & Keluarga', message: 'Selamat menempuh hidup baru! Semoga sakinah, mawaddah, warahmah.', attending: true, createdAt: '' },
    { name: 'Rina', message: 'Barakallah! Bahagia selalu untuk kalian berdua.', attending: true, createdAt: '' },
  ] : [];
  return (
    <Block title={t.guestbook} headingStyle={headingStyle} tint={soft}>
      {items.length === 0 ? (
        <p className="text-center text-sm opacity-70">{t.noWishes}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((w, i) => (
            <li key={i} className="rounded-2xl p-4" style={{ background: 'var(--bg)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--p)' }}>{w.name}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed opacity-85">{w.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

function Lightbox({ photos, index, onClose, onIndex }: { photos: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Galeri foto">
      <img src={photos[index]} alt="" className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
      {photos.length > 1 && (
        <>
          <button className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Sebelumnya">‹</button>
          <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Berikutnya">›</button>
        </>
      )}
      <button className="absolute right-3 top-3 rounded-full bg-white/20 px-3 py-1 text-white" onClick={onClose} aria-label="Tutup">✕</button>
    </div>
  );
}
