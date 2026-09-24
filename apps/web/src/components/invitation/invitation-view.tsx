'use client';

/* eslint-disable @next/next/no-img-element */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { formatLocalDate, formatLocalTime, localToInstant, parseLocal } from '@/lib/format';
import { findPreset } from '@/lib/presets';
import type { InvitationViewData } from '@/lib/types';
import { STRINGS } from './i18n';
import type { Lang, Strings } from './i18n';
import { GATE_MS, Gate, REVEALS_COVER } from './gates';
import type { GatePhase } from './gates';
import { isCoverKind, resolveCover } from '@/lib/cover-layouts';
import { CoverLayout, isLightCover } from './cover';
import { CoverFx, Particles, PatternLayer, PhotoFrame, Reveal, useReveal } from './effects';
import { BODY, HEADING, RADIUS, motifFor } from './motifs';
import type { CountdownKind, Motif } from './motifs';
import { ORNAMENTS, PauseIcon, PlayIcon } from './ornaments';
import type { OrnamentSet } from './ornaments';

export interface InvitationViewProps {
  view: InvitationViewData;
  // preview: RSVP tidak benar-benar terkirim & musik tidak autoplay.
  mode?: 'live' | 'preview';
  // Dirender di dalam bingkai ponsel (kontainer ini yang scroll, bukan window).
  embedded?: boolean;
  // Tampilkan kotak foto contoh bila belum ada foto (untuk demo template & editor).
  placeholders?: boolean;
  // Gerbang pembuka (Premium): 'show' = tampil dan harus diketuk; 'skip' = langsung terbuka + tombol "Putar ulang".
  // Bawaan: tampil di halaman live, dilewati di pratinjau (editor, dashboard, builder).
  gate?: 'show' | 'skip';
}

// Konteks tema untuk sub-komponen (ornamen, gaya sudut, level animasi) tanpa oper-prop berlapis.
interface ThemeCtx {
  orn: OrnamentSet;
  motif: Motif;
  fx: 'none' | 'standard' | 'premium';
  radius: (typeof RADIUS)[keyof typeof RADIUS];
  sectionFont: CSSProperties;
}
const ThemeContext = createContext<ThemeCtx | null>(null);
const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('ThemeContext belum tersedia');
  return ctx;
};

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

const EMBED_HEIGHT = 810; // tinggi logis PhoneFrame

export function InvitationView({ view, mode = 'live', embedded = false, placeholders = false, gate }: InvitationViewProps) {
  const { theme } = view.layout;
  const { data } = view;
  // Snapshot lama (sebelum ada motif/fx) tetap dirender: motif mengikuti preset, tanpa animasi.
  const motif = motifFor(theme.motif ?? theme.preset);
  const fx = theme.fx ?? 'none';
  const orn = ORNAMENTS[motif.ornament];
  const radius = RADIUS[motif.radius];
  const hf = HEADING[theme.headingFont] ?? HEADING.serif;
  const bf = BODY[theme.bodyFont] ?? BODY.serif;
  const layerHeight = embedded ? EMBED_HEIGHT : '100svh';

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

  const song = str(data, 'musik', 'lagu');
  const preset = findPreset(view.layout.musik.presets, song);
  const musicUrl = useMemo(() => {
    if (!song) return undefined;
    return song.startsWith('preset:') ? preset?.url : view.media[song]?.url;
  }, [song, preset, view.media]);

  const toggleMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => undefined);
    else a.pause();
  }, []);

  // ----- Gerbang pembuka -----
  const gateKind = theme.gate && theme.gate !== 'none' ? theme.gate : null;
  const gateMode = gate ?? (mode === 'live' ? 'show' : 'skip');
  const [gatePhase, setGatePhase] = useState<GatePhase | 'open'>(gateKind && gateMode === 'show' ? 'closed' : 'open');
  const gateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(gateTimer.current), []);
  // Gerbang dinonaktifkan dari luar (mis. admin mengganti jenis di builder): pastikan tidak menggantung.
  const gateActive = gateKind !== null && gatePhase !== 'open';
  // Isi sampul dipasang ulang (animasi masuk diputar) saat gerbang selesai. Gerbang yang menyingkap sampul
  // sedikit demi sedikit selama membuka (REVEALS_COVER) memasangnya ulang saat diketuk, supaya animasi masuk
  // berjalan ketika sampul mulai terlihat dan tidak berkedip lagi saat gerbang dilepas.
  const coverKey = gateActive && !(gatePhase === 'opening' && gateKind && REVEALS_COVER[gateKind]) ? 'gate' : 'open';

  const openGate = useCallback(() => {
    if (!gateKind || gatePhase !== 'closed') return;
    // Ketukan = sentuhan pengguna, jadi musik boleh langsung diputar (di pratinjau tidak).
    if (mode === 'live' && audioRef.current?.paused) void audioRef.current.play().catch(() => undefined);
    setGatePhase('opening');
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    gateTimer.current = setTimeout(() => setGatePhase('open'), reduced ? 350 : GATE_MS[gateKind]);
  }, [gateKind, gatePhase, mode]);

  const replayGate = useCallback(() => {
    clearTimeout(gateTimer.current);
    rootRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    setGatePhase('closed');
  }, []);

  // Selama gerbang tertutup, halaman tidak boleh tergulir di belakangnya.
  useEffect(() => {
    if (!gateActive || embedded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gateActive, embedded]);

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
    '--r': radius.card,
    '--rb': radius.button,
    '--rf': radius.field,
    background: theme.background,
    color: theme.text,
    fontFamily: bf.family,
  } as CSSProperties;
  const headingStyle: CSSProperties = {
    fontFamily: hf.family,
    color: 'var(--p)',
    letterSpacing: hf.tracking,
    textTransform: hf.upper ? 'uppercase' : undefined,
  };
  const sectionFont: CSSProperties = { ...headingStyle, fontSize: hf.section, fontWeight: hf.weight === 400 ? 400 : 500 };
  const soft = 'color-mix(in srgb, var(--p) 9%, var(--bg))';
  const bodyText = bf.className;

  // Tata letak sampul pilihan pembeli (Standard/Premium). Kosong/tak valid = sampul bawaan (ornamen, atau foto penuh
  // bila foto sampul ada). Layout yang butuh foto tapi fotonya belum ada kembali ke ornamen.
  const uploadedCover = url(str(data, 'cover', 'foto'));
  const chosenCover = str(data, 'cover', 'tata_letak');
  const coverKind =
    isCoverKind(chosenCover) && (view.layout.coverLayouts ?? []).includes(chosenCover)
      ? resolveCover(chosenCover, { cover: uploadedCover, groom: url(str(data, 'mempelai', 'pria_foto')), bride: url(str(data, 'mempelai', 'wanita_foto')) })
      : null;
  const coverPhoto = coverKind === 'ornamen' ? undefined : uploadedCover;
  const photoCover = coverKind && coverKind !== 'ornamen' ? coverKind : null;

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

  useReveal(rootRef, fx !== 'none', embedded, visible.map((s) => s.id).join(',') + galleryPhotos.length);

  const themeCtx: ThemeCtx = { orn, motif, fx, radius, sectionFont };
  const animated = fx !== 'none';
  // Animasi masuk sampul bertahap (var(--d)); tanpa efek: langsung tampil.
  const enter = (ms: number) => (animated ? { className: 'wl-enter', style: { '--d': `${ms}ms` } as CSSProperties } : { className: '', style: undefined });
  const kicker = (lang === 'id' && motif.copy?.kicker) || t.weddingOf;
  const openLabel = (lang === 'id' && motif.copy?.open) || t.open;
  const particleCount = fx === 'premium' ? motif.particles.count : Math.round(motif.particles.count * 0.6);
  const coverInk = coverPhoto ? '#fff' : 'var(--p)';
  const cornerCls = `absolute w-24 ${fx === 'premium' ? 'wl-breathe' : ''}`;
  const coverBackground = 'linear-gradient(165deg, color-mix(in srgb, var(--p) 20%, var(--bg)), var(--bg) 52%, color-mix(in srgb, var(--p) 10%, color-mix(in srgb, var(--s) 12%, var(--bg))))';
  const cornersNode = (
    <div className="pointer-events-none absolute inset-0" style={{ color: 'var(--p)' }} aria-hidden>
      <orn.Corner className={`${cornerCls} left-2 top-2`} rotate={0} />
      <orn.Corner className={`${cornerCls} right-2 top-2`} rotate={90} />
      <orn.Corner className={`${cornerCls} bottom-2 right-2`} rotate={180} />
      <orn.Corner className={`${cornerCls} bottom-2 left-2`} rotate={270} />
    </div>
  );
  // Tulisan/tombol di sampul berwarna putih bila latarnya foto atau adegan gelap.
  const onDark = photoCover ? isLightCover(photoCover) : !!coverPhoto;

  return (
    <ThemeContext.Provider value={themeCtx}>
      <div
        ref={rootRef}
        style={gateActive && embedded ? { ...rootStyle, overflowY: 'hidden' } : rootStyle}
        data-reveal={motif.reveal}
        // Terpasang sejak render server: keadaan awal "tersembunyi" sudah aktif sebelum hidrasi, jadi tidak ada kedipan.
        data-armed={animated ? '' : undefined}
        className={`wl-root ${embedded ? 'phone-scroll relative h-full overflow-y-auto overflow-x-hidden' : 'mx-auto w-full max-w-[480px] overflow-x-clip shadow-[0_0_60px_rgba(0,0,0,0.08)]'}`}
      >
        {animated && (
          <noscript>
            <style>{'.wl-root[data-armed] .wl-reveal{opacity:1!important;transform:none!important;filter:none!important}'}</style>
          </noscript>
        )}
        {gateActive && gateKind && (
          <Gate
            kind={gateKind}
            phase={gatePhase === 'opening' ? 'opening' : 'closed'}
            embedded={embedded}
            names={names}
            kicker={kicker}
            guest={mode === 'live' ? guest : null}
            pattern={motif.pattern}
            headingFamily={hf.family}
            onOpen={openGate}
          />
        )}
        {gateKind && mode !== 'live' && !gateActive && (
          <div className="pointer-events-none sticky top-0 z-[65] h-0">
            <button type="button" onClick={replayGate} className="pointer-events-auto m-2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-black/70">
              ↻ Putar ulang gerbang
            </button>
          </div>
        )}
        {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}

        {/* Premium: partikel melayang di seluruh halaman (lapisan lengket seukuran layar) */}
        {fx === 'premium' && (
          <div className="pointer-events-none sticky top-0 z-[5] h-0" aria-hidden>
            <div className="relative" style={{ height: layerHeight }}>
              <Particles kind={motif.particles.kind} count={particleCount} mode={motif.particles.mode} height={layerHeight} />
            </div>
          </div>
        )}

        {/* ===== Sampul ===== */}
        <section
          ref={coverRef}
          className="relative flex flex-col items-center justify-center overflow-hidden px-8 text-center"
          style={embedded ? { height: '100%' } : { minHeight: '100svh' }}
        >
          {coverPhoto || photoCover ? null : (
            <div
              className="absolute inset-0"
              style={{ background: coverBackground }}
            />
          )}
          {photoCover ? (
            <CoverLayout
              key={coverKey}
              kind={photoCover}
              photo={uploadedCover}
              groom={url(str(data, 'mempelai', 'pria_foto'))}
              bride={url(str(data, 'mempelai', 'wanita_foto'))}
              kicker={kicker}
              names={names}
              groomName={groom || (placeholders ? 'Andi' : '')}
              brideName={bride || (placeholders ? 'Sinta' : '')}
              dateText={shortDate}
              guest={mode === 'live' || placeholders ? { dear: t.dear, name: guest ?? t.guestFallback } : null}
              openLabel={openLabel}
              onOpen={open}
              heading={{ family: hf.family, size: hf.size, weight: hf.weight, tracking: hf.tracking, upper: hf.upper }}
              animated={animated}
              premium={fx === 'premium'}
              base={<div className="absolute inset-0" style={{ background: coverBackground }} />}
              decor={
                <>
                  {animated && <PatternLayer kind={motif.pattern} opacity={0.1} />}
                  {animated && <CoverFx kind={motif.cover} animate />}
                  {fx === 'standard' && <Particles kind={motif.particles.kind} count={particleCount} mode={motif.particles.mode} height={layerHeight} />}
                </>
              }
              corners={cornersNode}
              orn={orn}
              frame={motif.frame}
              photoRadius={radius.photo}
              buttonRadius="var(--rb)"
              letterFont="var(--font-script)"
              layerHeight={layerHeight}
            />
          ) : (
            <>
              {coverPhoto && (
                <>
                  <img src={coverPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.15) 40%, rgba(0,0,0,.6))' }} />
                </>
              )}
              {animated && !coverPhoto && <PatternLayer kind={motif.pattern} opacity={0.1} />}
              {animated && <CoverFx kind={motif.cover} animate />}
              {fx === 'standard' && <Particles kind={motif.particles.kind} count={particleCount} mode={motif.particles.mode} height={layerHeight} />}
              {!coverPhoto && cornersNode}
            </>
          )}

          {view.features.english && (
            <button
              onClick={() => setLang((l) => (l === 'id' ? 'en' : 'id'))}
              className="absolute right-4 top-4 z-10 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur"
              style={{ borderColor: onDark ? 'rgba(255,255,255,.6)' : 'var(--p)', color: onDark ? '#fff' : 'var(--p)' }}
              aria-label="Ganti bahasa / Switch language"
            >
              {lang === 'id' ? 'ID · EN' : 'EN · ID'}
            </button>
          )}

          {!photoCover && (
          <div key={coverKey} className="relative z-[4] flex flex-col items-center" style={{ color: coverPhoto ? '#fff' : 'var(--tx)' }}>
            <p className={`text-xs uppercase tracking-[0.35em] opacity-80 ${enter(100).className}`} style={enter(100).style}>{kicker}</p>
            <h1
              className={`mt-5 leading-[1.1] ${enter(250).className} ${fx === 'premium' && !coverPhoto ? 'wl-shimmer' : ''}`}
              style={{ ...headingStyle, ...enter(250).style, color: coverInk, fontSize: hf.size, fontWeight: hf.weight }}
            >
              {names}
            </h1>
            {shortDate && <p className={`mt-5 text-sm tracking-[0.3em] ${enter(450).className}`} style={enter(450).style}>{shortDate}</p>}
            <div className={enter(600).className} style={{ ...enter(600).style, color: coverInk }}>
              <orn.Divider className="mt-6 w-32 opacity-80" />
            </div>
            {(mode === 'live' || placeholders) && (
              <div className={`mt-8 text-sm ${enter(750).className}`} style={enter(750).style}>
                <p className="opacity-80">{t.dear}</p>
                <p className="mt-1 text-lg font-semibold">{guest ?? t.guestFallback}</p>
              </div>
            )}
            <button
              onClick={open}
              className={`mt-10 px-7 py-3 text-sm font-medium tracking-wide shadow-lg transition-transform hover:scale-[1.03] ${fx === 'premium' ? 'wl-pulse' : ''} ${enter(900).className}`}
              style={{ ...enter(900).style, borderRadius: 'var(--rb)', background: coverPhoto ? '#fff' : 'var(--p)', color: coverPhoto ? '#222' : '#fff' }}
            >
              {openLabel}
            </button>
          </div>
          )}
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
                        <Reveal key={who} delay={i * 120} className="flex flex-col items-center text-center">
                          <div className={`relative ${fx === 'premium' ? 'wl-float' : ''}`} style={fx === 'premium' ? { animationDelay: `${i * -2}s` } : undefined}>
                            <PhotoFrame frame={motif.frame} src={photo} label={nick} placeholders={placeholders} letterFont="var(--font-script)" tilt={i ? 2.5 : -2.5} photoRadius={radius.photo} />
                            <div className={`absolute -bottom-3 w-20 ${i ? '-right-6' : '-left-6'}`} style={{ color: 'var(--p)' }}>
                              <orn.Sprig className="w-20" flip={!!i} />
                            </div>
                          </div>
                          <p className="mt-6 text-xs uppercase tracking-[0.3em] opacity-60">{who === 'pria' ? t.groom : t.bride}</p>
                          <h3 className="mt-2" style={{ ...headingStyle, fontSize: hf.section, fontWeight: hf.weight === 400 ? 400 : 600 }}>
                            {full || nick}
                          </h3>
                          {parents && <p className={`mt-2 max-w-[18rem] opacity-80 ${bodyText}`}>{parents}</p>}
                        </Reveal>
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
                    {(['akad', 'resepsi'] as const).map((ev, i) => {
                      const when = str(data, 'tanggal_lokasi', `${ev}_tanggal`) || (placeholders && ev === 'akad' ? '2027-01-16T10:00' : '');
                      if (!when) return null;
                      const place = str(data, 'tanggal_lokasi', `${ev}_lokasi`) || (placeholders ? 'Gedung Serbaguna Cahaya' : '');
                      const address = str(data, 'tanggal_lokasi', `${ev}_alamat`);
                      const maps = str(data, 'tanggal_lokasi', `${ev}_maps`);
                      const cal = gcalLink(`${ev === 'akad' ? t.akad : t.reception} ${names}`, when, [place, address].filter(Boolean).join(', '));
                      return (
                        <Reveal key={ev} delay={i * 120}>
                          <div className="border p-7 text-center" style={{ borderRadius: 'var(--r)', borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)', background: 'var(--bg)' }}>
                            <h3 style={{ ...headingStyle, fontSize: hf.section, fontWeight: hf.weight === 400 ? 400 : 600 }}>{ev === 'akad' ? t.akad : t.reception}</h3>
                            <p className="mt-4 text-lg font-semibold">{formatLocalDate(when, lang)}</p>
                            <p className="opacity-80">{formatLocalTime(when)}</p>
                            <div style={{ color: 'var(--p)' }}>
                              <orn.Divider className="mx-auto my-4 w-24 opacity-70" />
                            </div>
                            {place && <p className="font-semibold">{place}</p>}
                            {address && <p className={`mt-1 opacity-80 ${bodyText}`}>{address}</p>}
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                              {maps && (
                                <a href={maps} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-xs font-medium text-white" style={{ background: 'var(--p)', borderRadius: 'var(--rb)' }}>
                                  {t.openMaps}
                                </a>
                              )}
                              {cal && (
                                <a href={cal} target="_blank" rel="noopener noreferrer" className="border px-4 py-2 text-xs font-medium" style={{ borderColor: 'var(--p)', color: 'var(--p)', borderRadius: 'var(--rb)' }}>
                                  {t.saveDate}
                                </a>
                              )}
                            </div>
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                </Block>
              );

            case 'countdown':
              return <Countdown key="countdown" target={mainDate} t={t} />;

            case 'galeri':
              return (
                <Block key="galeri" title={t.gallery} headingStyle={headingStyle}>
                  {galleryPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {galleryPhotos.map((src, i) => (
                        <button
                          key={src}
                          onClick={() => setLightbox(i)}
                          className={`wl-reveal overflow-hidden ${i % 3 === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'}`}
                          style={{ borderRadius: radius.photo, '--d': `${(i % 3) * 90}ms` } as CSSProperties}
                          aria-label={`Foto ${i + 1}`}
                        >
                          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    placeholders && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {[0, 1, 2, 3].map((i) => (
                          <PhotoPlaceholder key={i} className={i === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'} radius={radius.photo} delay={(i % 3) * 90} />
                        ))}
                      </div>
                    )
                  )}
                  {galleryVideos.map((src) => (
                    <video key={src} src={src} controls playsInline preload="metadata" className="mt-3 w-full bg-black" style={{ borderRadius: radius.photo }} />
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
                      <div className="border p-5 text-center" style={{ borderRadius: 'var(--r)', borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)' }}>
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
          <div style={{ color: 'var(--p)' }}>
            <orn.Sprig className="mx-auto mb-3 w-20" />
          </div>
          <p style={{ color: 'var(--tx)' }}>{names}</p>
          <p className="mt-1">{t.madeWith}</p>
          {preset?.credit && <p className="mt-2 opacity-80">{preset.credit}</p>}
        </footer>

        {musicUrl && (
          <div className="pointer-events-none sticky bottom-4 z-20 flex h-0 justify-end pr-4">
            <button
              onClick={toggleMusic}
              className={`pointer-events-auto -mt-12 flex h-11 w-11 items-center justify-center text-white shadow-lg ${playing && animated ? 'wl-pulse' : ''}`}
              style={{ background: 'var(--p)', borderRadius: radius.button === '0px' ? '0px' : '999px' }}
              aria-label={playing ? 'Jeda musik' : 'Putar musik'}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        )}

        {lightbox !== null && <Lightbox photos={galleryPhotos} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />}
      </div>
    </ThemeContext.Provider>
  );
}

function Block({ title, children, headingStyle, tint }: { title: string; children: ReactNode; headingStyle: CSSProperties; tint?: string }) {
  const { orn, motif, fx, sectionFont } = useTheme();
  return (
    <section className="relative px-6 py-16" style={{ background: tint }}>
      {tint && fx !== 'none' && <PatternLayer kind={motif.pattern} opacity={0.05} />}
      <div className="wl-reveal relative mb-10 text-center">
        <h2 style={{ ...headingStyle, ...sectionFont }}>{title}</h2>
        <div style={{ color: 'var(--p)' }}>
          <orn.Divider className="mx-auto mt-3 w-28" />
        </div>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function PhotoPlaceholder({ className = '', radius, delay = 0 }: { className?: string; radius: string; delay?: number }) {
  return (
    <div
      className={`wl-reveal flex items-center justify-center overflow-hidden ${className}`}
      style={{ borderRadius: radius, '--d': `${delay}ms`, background: 'linear-gradient(140deg, color-mix(in srgb, var(--p) 22%, var(--bg)), color-mix(in srgb, var(--s) 40%, var(--bg)))' } as CSSProperties}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--p)', opacity: 0.55 }} aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M4 18l5-5 4 4 3-3 4 4" />
      </svg>
    </div>
  );
}

// Gaya sel hitung mundur per motif. Latar seksi selalu warna utama (atau gelap untuk gaya neon/pixel).
const COUNTDOWN_LOOK: Record<CountdownKind, { section: CSSProperties; cell: CSSProperties; num?: CSSProperties; round?: boolean }> = {
  soft: { section: { background: 'var(--p)' }, cell: { background: 'rgba(255,255,255,.15)' } },
  outline: { section: { background: 'var(--p)' }, cell: { border: '1px solid rgba(255,255,255,.7)' } },
  round: { section: { background: 'var(--p)' }, cell: { background: 'rgba(255,255,255,.15)', borderRadius: '999px' }, round: true },
  ticket: { section: { background: 'var(--p)' }, cell: { background: 'rgba(255,255,255,.12)', border: '1.5px dashed rgba(255,255,255,.7)' } },
  pixel: {
    section: { background: 'color-mix(in srgb, var(--p) 30%, #0b0b14)' },
    cell: { border: '3px solid #fff', background: 'rgba(0,0,0,.35)', borderRadius: '0px' },
    num: { fontFamily: 'var(--font-pixel)', fontSize: '1.15rem', fontWeight: 400 },
  },
  neon: {
    section: { background: 'color-mix(in srgb, var(--p) 22%, #07070f)' },
    cell: { border: '1.5px solid var(--s)', background: 'rgba(0,0,0,.35)', boxShadow: '0 0 14px color-mix(in srgb, var(--s) 70%, transparent), inset 0 0 12px color-mix(in srgb, var(--s) 30%, transparent)' },
    num: { textShadow: '0 0 12px var(--s), 0 0 3px var(--s)' },
  },
  flip: {
    section: { background: 'color-mix(in srgb, var(--p) 40%, #0d0d0d)' },
    cell: { background: 'linear-gradient(#2c2c2c calc(50% - 1px), #000 calc(50% - 1px) calc(50% + 1px), #1c1c1c calc(50% + 1px))', borderRadius: '8px', boxShadow: '0 6px 14px -6px rgba(0,0,0,.6)' },
  },
};

function Countdown({ target, t }: { target: string; t: Strings }) {
  const { motif, fx, radius, sectionFont } = useTheme();
  const now = useNow();
  const end = localToInstant(target);
  const diff = now === null || Number.isNaN(end) ? null : Math.max(0, end - now);
  const parts = diff === null ? null : [Math.floor(diff / 86_400_000), Math.floor((diff / 3_600_000) % 24), Math.floor((diff / 60_000) % 60), Math.floor((diff / 1000) % 60)];
  const labels = [t.days, t.hours, t.minutes, t.seconds];
  const look = COUNTDOWN_LOOK[motif.countdown];
  return (
    <section className="wl-reveal px-6 py-14 text-center" style={{ ...look.section, color: '#fff' }}>
      <h2 style={{ ...sectionFont, color: '#fff' }}>{t.countdown}</h2>
      <div className="mt-7 grid grid-cols-4 gap-2.5" role="timer" aria-live="off">
        {labels.map((label, i) => (
          <div
            key={label}
            className={`flex flex-col items-center justify-center ${look.round ? 'aspect-square' : 'py-4'} ${fx === 'none' ? 'backdrop-blur-sm' : ''}`}
            style={{ borderRadius: radius.cell, ...look.cell }}
          >
            <div key={parts ? parts[i] : 'x'} className={`text-3xl font-semibold tabular-nums ${fx === 'premium' ? 'wl-tick' : ''}`} style={{ fontFamily: 'var(--font-cormorant)', ...look.num }}>
              {parts ? String(parts[i]).padStart(2, '0') : '--'}
            </div>
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
    <div className="border p-5 text-center" style={{ borderRadius: 'var(--r)', borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)' }}>
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
        className="mt-3 border px-4 py-1.5 text-xs font-medium"
        style={{ borderColor: 'var(--p)', color: 'var(--p)', borderRadius: 'var(--rb)' }}
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

  if (state === 'done') return <p className="p-6 text-center font-medium" style={{ background: 'var(--bg)', color: accent, borderRadius: 'var(--r)' }}>{t.thanks}</p>;

  const field = 'w-full border bg-white/80 px-4 py-3 text-sm outline-none focus:ring-2';
  const fieldStyle = { borderColor: 'color-mix(in srgb, var(--p) 30%, transparent)', color: '#2b2420', borderRadius: 'var(--rf)' } as CSSProperties;
  return (
    <form onSubmit={submit} className="space-y-3">
      <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} className={field} style={fieldStyle} aria-label={t.name} />
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Kehadiran">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => setAttending(v)}
            className="border px-3 py-3 text-sm font-medium transition-colors"
            style={{ borderRadius: 'var(--rf)', ...(attending === v ? { background: accent, color: '#fff', borderColor: accent } : { borderColor: 'color-mix(in srgb, var(--p) 30%, transparent)', background: 'rgba(255,255,255,.8)', color: '#2b2420' }) }}
            aria-pressed={attending === v}
          >
            {v ? t.attending : t.notAttending}
          </button>
        ))}
      </div>
      {attending && (
        <label className="flex items-center justify-between border bg-white/80 px-4 py-2.5 text-sm" style={{ borderRadius: 'var(--rf)', borderColor: 'color-mix(in srgb, var(--p) 30%, transparent)', color: '#2b2420' }}>
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
      <button type="submit" disabled={state === 'sending'} className="w-full py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: accent, borderRadius: 'var(--rf)' }}>
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
            <li key={i} className="wl-reveal p-4" style={{ background: 'var(--bg)', borderRadius: 'var(--r)', '--d': `${Math.min(i, 5) * 80}ms` } as CSSProperties}>
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
