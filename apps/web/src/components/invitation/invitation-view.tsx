'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { formatLocalDate, formatLocalTime, localToInstant, parseLocal } from '@/lib/format';
import { findPreset } from '@/lib/presets';
import type { InvitationViewData } from '@/lib/types';
import { STRINGS } from './i18n';
import type { Lang, Strings } from './i18n';
import { GATE_MS, Gate, REVEALS_COVER, REVEAL_DELAY_MS } from './gates';
import type { GatePhase } from './gates';
import { isCoverKind, resolveCover } from '@/lib/cover-layouts';
import { CoverLayout, isLightCover } from './cover';
import { CoverFx, Particles, PatternLayer, PhotoFrame, Reveal, useReveal } from './effects';
import { BODY, HEADING, RADIUS, motifFor } from './motifs';
import type { CountdownKind, Motif } from './motifs';
import { DOVE_SILHOUETTE, DOVE_VIEWBOX, Dove, DovePair } from './dove-art';
import { Monogram, ORNAMENTS, PauseIcon, PlayIcon } from './ornaments';
import type { OrnamentSet } from './ornaments';
import { BloomMini, FloralMonogram, garlandCss, miniBloomCss } from './bloom-parts';
import { KERATON_BG, keratonVars } from './batik-art';
import { Gunungan } from './gunungan-art';

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

// Tekstur kertas kraft: butiran halus + serat memanjang (SVG feTurbulence), dikalikan ke warna latar tema.
const KRAFT_TEXTURE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .36 0 0 0 0 .25 0 0 0 0 .14 0 0 0 .36 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\"), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .5' numOctaves='2' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .32 0 0 0 0 .18 0 0 0 .2 -.03'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")";

// Tekstur Elegan: urat marmer gading + butiran halus (SVG feTurbulence, dikalikan ke warna latar tema) dan dua pasang
// garis emas tipis di tepi halaman (rel) yang menyambung dengan bingkai sampul.
const MARBLE = "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'800'%3E%3Cfilter%20id%3D'a'%20x%3D'0'%20y%3D'0'%20width%3D'100%25'%20height%3D'100%25'%20color-interpolation-filters%3D'sRGB'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.0032%20.0055'%20numOctaves%3D'4'%20seed%3D'3'%20stitchTiles%3D'stitch'%20result%3D'n'%2F%3E%3CfeColorMatrix%20in%3D'n'%20type%3D'matrix'%20values%3D'0%200%200%200%20.46%200%200%200%200%20.4%200%200%200%200%20.3%201%200%200%200%200'%20result%3D'c'%2F%3E%3CfeComponentTransfer%20in%3D'c'%20result%3D'd'%3E%3CfeFuncA%20type%3D'table'%20tableValues%3D'0%200%200%200%200%200%200%200%200%200%20.5%200%200%200%200%200%200%200%200%200%200'%2F%3E%3C%2FfeComponentTransfer%3E%3CfeGaussianBlur%20in%3D'd'%20stdDeviation%3D'.6'%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D'b'%20x%3D'0'%20y%3D'0'%20width%3D'100%25'%20height%3D'100%25'%20color-interpolation-filters%3D'sRGB'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.007%20.011'%20numOctaves%3D'3'%20seed%3D'8'%20stitchTiles%3D'stitch'%20result%3D'n'%2F%3E%3CfeColorMatrix%20in%3D'n'%20type%3D'matrix'%20values%3D'0%200%200%200%20.55%200%200%200%200%20.48%200%200%200%200%20.36%201%200%200%200%200'%20result%3D'c'%2F%3E%3CfeComponentTransfer%20in%3D'c'%3E%3CfeFuncA%20type%3D'table'%20tableValues%3D'0%200%200%200%200%200%200%200%200%200%20.3%200%200%200%200%200%200%200%200%200%200'%2F%3E%3C%2FfeComponentTransfer%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23a)'%20opacity%3D'.22'%2F%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23b)'%20opacity%3D'.16'%2F%3E%3C%2Fsvg%3E\")";
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";
const RAIL = 'linear-gradient(color-mix(in srgb, var(--p) 46%, transparent), color-mix(in srgb, var(--p) 46%, transparent))';
const RAIL_SOFT = 'linear-gradient(color-mix(in srgb, var(--p) 24%, transparent), color-mix(in srgb, var(--p) 24%, transparent))';
const GILDED_BG: CSSProperties = {
  backgroundImage: `${MARBLE}, ${GRAIN}, ${RAIL}, ${RAIL}, ${RAIL_SOFT}, ${RAIL_SOFT}`,
  backgroundSize: '800px 800px, 240px 240px, 1px 100%, 1px 100%, 1px 100%, 1px 100%',
  backgroundPosition: '0 0, 0 0, left 10px top 0, right 10px top 0, left 17px top 0, right 17px top 0',
  backgroundRepeat: 'repeat, repeat, no-repeat, no-repeat, no-repeat, no-repeat',
  backgroundBlendMode: 'multiply, multiply, normal, normal, normal, normal',
};
// Tekstur Sepasang Merpati: awan biru sangat tipis di atas warna latar (dikalikan), dan siluet merpati sebagai mask ikon.
const CLOUD_TEX = "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'700'%20height%3D'700'%3E%3Cfilter%20id%3D'c'%20x%3D'0'%20y%3D'0'%20width%3D'100%25'%20height%3D'100%25'%20color-interpolation-filters%3D'sRGB'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.0035%20.0065'%20numOctaves%3D'4'%20seed%3D'5'%20stitchTiles%3D'stitch'%20result%3D'n'%2F%3E%3CfeColorMatrix%20in%3D'n'%20type%3D'matrix'%20values%3D'0%200%200%200%20.55%200%200%200%200%20.66%200%200%200%200%20.86%201.7%200%200%200%20-.62'%2F%3E%3CfeGaussianBlur%20stdDeviation%3D'6'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23c)'%20opacity%3D'.26'%2F%3E%3C%2Fsvg%3E\")";
const DOVE_ICON = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${DOVE_VIEWBOX}'><path d='${DOVE_SILHOUETTE}'/></svg>`)}")`;
const DOVE_BG: CSSProperties = {
  backgroundImage: `radial-gradient(ellipse 120% 26% at 50% 0%, color-mix(in srgb, var(--p) 16%, transparent), transparent 80%), ${CLOUD_TEX}`,
  backgroundSize: '100% 100%, 700px 700px',
  backgroundRepeat: 'no-repeat, repeat',
  backgroundBlendMode: 'normal, multiply',
  ['--dove-icon' as string]: DOVE_ICON,
};
// Latar Buket Pengantin: putih bersih dengan semburat pastel yang sangat tipis (blush, lavender, biru langit, kuning mentega)
// berulang vertikal tiap 1800px, jadi di sepanjang halaman ada sentuhan warna lembut di sisi kiri dan kanan.
const BLOOM_BG: CSSProperties = {
  backgroundImage: [
    'radial-gradient(ellipse 60% 220px at 0% 220px, rgba(246,179,195,.30), transparent 72%)',
    'radial-gradient(ellipse 58% 240px at 100% 760px, rgba(192,166,238,.26), transparent 72%)',
    'radial-gradient(ellipse 60% 220px at 0% 1260px, rgba(156,199,238,.26), transparent 72%)',
    'radial-gradient(ellipse 56% 200px at 100% 1640px, rgba(248,216,110,.24), transparent 72%)',
  ].join(', '),
  backgroundSize: '100% 1800px',
  backgroundRepeat: 'repeat-y',
};
const AKSARA = 'ꦲꦸꦤ꧀ꦝꦁꦔꦤ꧀'; // "undhangan" (undangan), aksara Jawa dekoratif
const initialOf = (name: string, fallback = '') => (name.trim().charAt(0) || fallback).toUpperCase();

export function InvitationView({ view, mode = 'live', embedded = false, placeholders = false, gate }: InvitationViewProps) {
  const { theme } = view.layout;
  const { data } = view;
  // Snapshot lama (sebelum ada motif/fx) tetap dirender: motif mengikuti preset, tanpa animasi.
  const motif = motifFor(theme.motif ?? theme.preset);
  const fx = theme.fx ?? 'none';
  const orn = ORNAMENTS[motif.ornament];
  const radius = RADIUS[motif.radius];
  const hf = HEADING[motif.heading ?? theme.headingFont] ?? HEADING.serif;
  const bf = BODY[motif.body ?? theme.bodyFont] ?? BODY.serif;
  // Font nama mempelai bisa berbeda dari font judul seksi (Elegan: aksara tulisan tangan vs Cinzel).
  const nf = HEADING[motif.names ?? motif.heading ?? theme.headingFont] ?? hf;
  const skin = motif.skin;
  const gilded = skin === 'gilded';
  const airy = skin === 'dove';
  const bloom = skin === 'bloom';
  const keraton = skin === 'keraton';
  // Untaian bunga & ikon bunga mini sebagai gambar CSS (data URI): bunga utamanya berwarna sekunder tema, jadi dihitung per tema.
  const bloomCss = useMemo(() => (bloom ? { garland: garlandCss(theme.secondary), mini: miniBloomCss(theme.secondary) } : null), [bloom, theme.secondary]);
  // Batik Jawa: parang, kawung, dan ikon gunungan sebagai gambar CSS (data URI) yang warnanya ikut tema; lihat batik-art.ts.
  const keratonCss = useMemo(() => (keraton ? keratonVars(theme.primary, theme.secondary, theme.background) : null), [keraton, theme.primary, theme.secondary, theme.background]);
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
  // Jeda animasi masuk sampul (ms) untuk gerbang yang menyingkap sampul belakangan; dipertahankan sampai diputar ulang
  // supaya animasi yang sedang berjalan tidak melompat saat gerbang dilepas.
  const [revealDelay, setRevealDelay] = useState(0);
  useEffect(() => () => clearTimeout(gateTimer.current), []);
  // Gerbang dinonaktifkan dari luar (mis. admin mengganti jenis di builder): pastikan tidak menggantung.
  const gateActive = gateKind !== null && gatePhase !== 'open';
  // Isi sampul dipasang ulang (animasi masuk diputar) saat gerbang selesai. Gerbang yang menyingkap sampul
  // sedikit demi sedikit selama membuka (REVEALS_COVER) memasangnya ulang saat diketuk, supaya animasi masuk
  // berjalan ketika sampul mulai terlihat dan tidak berkedip lagi saat gerbang dilepas.
  const coverKey = gateActive && !(gatePhase === 'opening' && gateKind && REVEALS_COVER[gateKind]) ? 'gate' : 'open';

  // Musik baru terdengar setelah animasi gerbang selesai. Browser (terutama Safari iOS) hanya mengizinkan audio
  // bersuara yang dimulai dari sentuhan, sedangkan akhir gerbang datang dari timer. Jadi saat gerbang diketuk,
  // elemen audio "dibuka" dulu: diputar tanpa suara lalu dijeda (sekalian mulai memuat lagunya); setelah itu
  // play() dari timer diizinkan. Kalau lagu belum selesai dimuat saat gerbang selesai, pemutaran bisu itu
  // dibiarkan berlanjut dan cukup dibunyikan.
  const musicWanted = useRef(false);
  const unlockMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.paused) return;
    musicWanted.current = false;
    a.muted = true;
    void a
      .play()
      .then(() => {
        if (!musicWanted.current) a.pause();
      }, () => undefined)
      .finally(() => {
        a.muted = false;
      });
  }, []);
  const startMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    musicWanted.current = true;
    a.muted = false;
    if (a.paused) {
      a.currentTime = 0;
      void a.play().catch(() => undefined);
    }
  }, []);

  const openGate = useCallback(() => {
    if (!gateKind || gatePhase !== 'closed') return;
    // Ketukan = sentuhan pengguna: buka izin audio sekarang, bunyikan saat gerbang selesai (di pratinjau tidak).
    const live = mode === 'live';
    if (live) unlockMusic();
    setGatePhase('opening');
    setRevealDelay(REVEAL_DELAY_MS[gateKind] ?? 0);
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    gateTimer.current = setTimeout(() => {
      setGatePhase('open');
      if (live) startMusic();
    }, reduced ? 350 : GATE_MS[gateKind]);
  }, [gateKind, gatePhase, mode, unlockMusic, startMusic]);

  const replayGate = useCallback(() => {
    clearTimeout(gateTimer.current);
    rootRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    setGatePhase('closed');
    setRevealDelay(0);
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
    // backgroundColor, bukan shorthand `background`: React hanya menulis ulang properti yang berubah, dan menulis shorthand saat warna
    // berganti (pilih palet) akan menghapus backgroundImage (tekstur kraft, marmer, parang, dst.) yang nilainya tidak berubah.
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: bf.family,
    ...(skin === 'kraft' ? { backgroundImage: KRAFT_TEXTURE, backgroundBlendMode: 'multiply' } : gilded ? GILDED_BG : airy ? DOVE_BG : bloom && bloomCss ? { ...BLOOM_BG, ['--bloom-garland' as string]: bloomCss.garland, ['--bloom-mini' as string]: bloomCss.mini } : keraton && keratonCss ? { ...KERATON_BG, ...keratonCss } : null),
  } as CSSProperties;
  const headingStyle: CSSProperties = {
    fontFamily: hf.family,
    color: 'var(--p)',
    letterSpacing: hf.tracking,
    textTransform: hf.upper ? 'uppercase' : undefined,
  };
  const namesStyle: CSSProperties = { ...headingStyle, fontFamily: nf.family, letterSpacing: nf.tracking, textTransform: nf.upper ? 'uppercase' : undefined };
  const sectionFont: CSSProperties = keraton
    ? { ...headingStyle, fontSize: '1.5rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' }
    : gilded
    ? { ...headingStyle, fontSize: '1.35rem', fontWeight: 500, letterSpacing: '0.26em', textTransform: 'uppercase' }
    : bloom
      ? { ...headingStyle, fontSize: '2.5rem', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.1 }
      : { ...headingStyle, fontSize: hf.section, fontWeight: hf.weight === 400 ? 400 : 500 };
  const soft = skin === 'kraft' ? 'color-mix(in srgb, var(--p) 9%, transparent)' : keraton ? 'color-mix(in srgb, var(--p) 6%, transparent)' : gilded ? 'color-mix(in srgb, var(--p) 7%, transparent)' : airy ? 'color-mix(in srgb, var(--p) 6%, transparent)' : bloom ? 'color-mix(in srgb, var(--s) 6%, transparent)' : 'color-mix(in srgb, var(--p) 9%, var(--bg))';
  // Elegan: kicker & tanggal di sampul memakai Cinzel berjarak lebar.
  const monoA = initialOf(groom, placeholders ? 'A' : '');
  const monoB = initialOf(bride, placeholders ? 'S' : '');
  const showMono = !!(monoA && monoB);
  // Nama panjang mengecilkan huruf nama di sampul (nama pendek tidak berubah).
  const nameScale = names.length > 34 ? 0.55 : names.length > 22 ? 0.72 : 1;
  const scaled = (size: string) => (nameScale === 1 ? size : `calc(${size} * ${nameScale})`);
  const kickerBloom: CSSProperties = { fontFamily: 'var(--font-cormorant), serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.42em', opacity: 0.8 };
  const kickerKr: CSSProperties = { fontFamily: 'var(--font-montserrat), sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.42em', opacity: 0.85 };
  const kickerStyle: CSSProperties = { fontFamily: 'var(--font-cinzel), serif', fontSize: 11, letterSpacing: '0.46em', opacity: 0.8 };
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
  const cornerBase = `absolute ${fx === 'premium' ? 'wl-breathe' : ''}`;
  const cornerTop = `${cornerBase} ${motif.cornerSize?.top ?? 'w-24'}`;
  const cornerBottom = `${cornerBase} ${motif.cornerSize?.bottom ?? 'w-24'}`;
  const kraft = skin === 'kraft';
  const coverBackground = kraft
    ? 'radial-gradient(ellipse at 50% 42%, color-mix(in srgb, var(--bg) 70%, #fff) 0, transparent 62%), radial-gradient(ellipse at 50% 50%, transparent 55%, color-mix(in srgb, var(--p) 22%, transparent) 130%)'
    : keraton
      ? 'radial-gradient(ellipse 78% 36% at 50% 36%, color-mix(in srgb, #fff 62%, var(--bg)) 0, transparent 72%), radial-gradient(ellipse 120% 40% at 50% 108%, color-mix(in srgb, var(--p) 16%, transparent), transparent 74%)'
    : bloom
      ? 'radial-gradient(ellipse 80% 40% at 50% 40%, #fff 0, rgba(255,255,255,0) 72%), linear-gradient(180deg, color-mix(in srgb, var(--s) 9%, #fff) 0%, #fff 32%, #fff 68%, color-mix(in srgb, var(--p) 9%, #fff) 100%)'
      : airy
      ? 'radial-gradient(ellipse 100% 36% at 50% 104%, color-mix(in srgb, var(--s) 38%, transparent), transparent 74%), linear-gradient(180deg, color-mix(in oklch, var(--p) 56%, white) 0%, color-mix(in oklch, var(--p) 34%, white) 34%, color-mix(in oklch, var(--p) 12%, white) 62%, #fffdf9 82%, color-mix(in srgb, var(--s) 22%, #fffdf9) 100%)'
      : gilded
      ? 'radial-gradient(ellipse 90% 52% at 50% 33%, color-mix(in srgb, #fff 60%, var(--bg)) 0, transparent 72%), radial-gradient(ellipse 80% 40% at 50% 104%, color-mix(in srgb, var(--p) 22%, transparent), transparent 72%), linear-gradient(180deg, color-mix(in srgb, var(--p) 9%, var(--bg)), var(--bg) 42%, color-mix(in srgb, var(--p) 13%, var(--bg)))'
      : 'linear-gradient(165deg, color-mix(in srgb, var(--p) 20%, var(--bg)), var(--bg) 52%, color-mix(in srgb, var(--p) 10%, color-mix(in srgb, var(--s) 12%, var(--bg))))';
  const cornersNode = (
    <div key={coverKey} className="pointer-events-none absolute inset-0" style={{ color: 'var(--p)' }} aria-hidden>
      {kraft && <div className="wl-cover-stitch" />}
      {gilded && ['t h', 'b h', 'l v', 'r v', 't h i', 'b h i', 'l v i', 'r v i'].map((c) => <span key={c} className={`wl-gf ${c}`} />)}
      <div className={gilded ? 'wl-corner-in' : undefined}>
        <orn.Corner className={`${cornerTop} ${keraton ? 'left-[30px] top-[30px]' : 'left-2 top-2'}`} rotate={0} />
        <orn.Corner className={`${cornerTop} ${keraton ? 'right-[30px] top-[30px]' : 'right-2 top-2'}`} rotate={90} />
        <orn.Corner className={`${cornerBottom} ${keraton ? 'bottom-[30px] right-[30px]' : 'bottom-2 right-2'}`} rotate={180} />
        <orn.Corner className={`${cornerBottom} ${keraton ? 'bottom-[30px] left-[30px]' : 'bottom-2 left-2'}`} rotate={270} />
      </div>
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
        // Selama gerbang menutupi sampul, isi undangan di belakangnya tidak terlihat: CSS menjeda semua animasinya (globals.css).
        data-gate={coverKey === 'gate' ? 'closed' : undefined}
        // Terpasang sejak render server: keadaan awal "tersembunyi" sudah aktif sebelum hidrasi, jadi tidak ada kedipan.
        data-armed={animated ? '' : undefined}
        className={`wl-root ${skin ? `wl-${skin}` : ''} ${embedded ? 'phone-scroll relative h-full overflow-y-auto overflow-x-hidden' : 'mx-auto w-full max-w-[480px] overflow-x-clip shadow-[0_0_60px_rgba(0,0,0,0.08)]'}`}
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
            motif={theme.motif ?? theme.preset}
            headingFamily={nf.family}
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

        {/* Premium: partikel melayang di seluruh halaman (lapisan lengket seukuran layar). Dengan gerbang, baru
            dipasang saat sampul mulai terlihat dan masuk bertahap dari tepi layar, bukan muncul di tengah. */}
        {fx === 'premium' && (!gateKind || coverKey === 'open') && (
          <div className="pointer-events-none sticky top-0 z-[5] h-0" style={keraton ? { color: 'var(--s)' } : undefined} aria-hidden>
            <div className="relative" style={{ height: layerHeight }}>
              <Particles kind={motif.particles.kind} count={particleCount} mode={motif.particles.mode} height={layerHeight} enter={!!gateKind} />
            </div>
          </div>
        )}

        {/* ===== Sampul ===== */}
        <section
          ref={coverRef}
          className="relative flex flex-col items-center justify-center overflow-hidden px-8 text-center"
          style={{ ...(embedded ? { height: '100%' } : { minHeight: '100svh' }), ...(revealDelay ? { '--gd': `${revealDelay}ms` } : null) } as CSSProperties}
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
              heading={{ family: nf.family, size: scaled(gilded ? '4.2rem' : nf.size), weight: nf.weight, tracking: nf.tracking, upper: nf.upper }}
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
              gilded={gilded}
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
            {bloom && !coverPhoto && showMono && (
              <div className={`mb-1 ${enter(0).className}`} style={enter(0).style}>
                <FloralMonogram a={monoA} b={monoB} size={128} />
              </div>
            )}
            {airy && !coverPhoto && (
              <div className={`mb-3 ${enter(0).className}`} style={enter(0).style}>
                <DovePair size="w-[4.4rem]" />
              </div>
            )}
            {gilded && !coverPhoto && showMono && (
              <div className={`mb-6 ${enter(0).className}`} style={enter(0).style}>
                <Monogram a={monoA} b={monoB} size={92} />
              </div>
            )}
            {keraton && !coverPhoto && (
              <p className={`wl-foil wl-aksara mb-1 ${enter(0).className}`} style={enter(0).style} lang="jv">{AKSARA}</p>
            )}
            <p className={`text-xs uppercase tracking-[0.35em] opacity-80 ${enter(100).className}`} style={{ ...(gilded ? kickerStyle : bloom ? kickerBloom : keraton ? kickerKr : null), ...enter(100).style }}>{kicker}</p>
            {keraton && !coverPhoto && (
              <div className={`mt-6 h-[13.5rem] [@media(max-height:700px)]:mt-3 [@media(max-height:700px)]:h-[9.5rem] ${enter(180).className}`} style={{ ...enter(180).style, aspectRatio: '200 / 272' }}>
                <Gunungan />
              </div>
            )}
            <h1
              className={`${keraton ? 'mt-7' : 'mt-4'} ${gilded ? 'leading-[1.2]' : 'leading-[1.1]'} ${enter(250).className} ${fx === 'premium' && !coverPhoto ? 'wl-shimmer' : gilded && !coverPhoto ? 'wl-foil' : ''}`}
              style={{ ...namesStyle, ...enter(250).style, color: coverInk, fontSize: scaled(gilded ? '4.3rem' : nf.size), fontWeight: nf.weight }}
            >
              {names}
            </h1>
            {shortDate && (
              gilded ? (
                <p className={`mt-4 flex items-center gap-3 text-[13px] ${enter(450).className}`} style={{ ...enter(450).style, fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.34em' }}>
                  <i className="inline-block h-[5px] w-[5px] rotate-45" style={{ background: 'var(--p)' }} />
                  {shortDate}
                  <i className="inline-block h-[5px] w-[5px] rotate-45" style={{ background: 'var(--p)' }} />
                </p>
              ) : keraton ? (
                <p className={`mt-4 flex items-center gap-3 text-[12.5px] ${enter(450).className}`} style={{ ...enter(450).style, fontFamily: 'var(--font-montserrat), sans-serif', fontWeight: 500, letterSpacing: '0.32em' }}>
                  <i className="inline-block h-[5px] w-[5px] rotate-45" style={{ background: 'var(--kr-gold-d)' }} />
                  {shortDate}
                  <i className="inline-block h-[5px] w-[5px] rotate-45" style={{ background: 'var(--kr-gold-d)' }} />
                </p>
              ) : bloom ? (
                <p className={`mt-3 flex items-center gap-3 text-[15px] ${enter(450).className}`} style={{ ...enter(450).style, fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, letterSpacing: '0.3em' }}>
                  <span className="h-px w-9" style={{ background: 'linear-gradient(90deg, transparent, var(--s))' }} />
                  {shortDate}
                  <span className="h-px w-9" style={{ background: 'linear-gradient(270deg, transparent, var(--s))' }} />
                </p>
              ) : (
                <p className={`mt-5 text-sm tracking-[0.3em] ${enter(450).className}`} style={enter(450).style}>{shortDate}</p>
              )
            )}
            <div className={enter(600).className} style={{ ...enter(600).style, color: coverInk }}>
              <orn.Divider className={keraton ? 'mt-5 w-52' : bloom ? 'mt-2 w-60' : 'mt-6 w-32 opacity-80'} />
            </div>
            {(mode === 'live' || placeholders) && (
              <div className={`mt-8 text-sm ${enter(750).className}`} style={enter(750).style}>
                <p className="opacity-80" style={keraton ? { fontFamily: 'var(--font-montserrat), sans-serif', fontSize: 10.5, letterSpacing: '0.3em', textTransform: 'uppercase' } : gilded ? { fontFamily: 'var(--font-cinzel), serif', fontSize: 10.5, letterSpacing: '0.34em', textTransform: 'uppercase' } : bloom ? { fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', fontSize: 14 } : undefined}>{t.dear}</p>
                <p className={keraton ? 'mt-1 text-[1.35rem] font-semibold italic' : gilded ? 'mt-1 text-[1.35rem] font-semibold italic' : bloom ? 'mt-0.5 text-[1.45rem] font-semibold' : 'mt-1 text-lg font-semibold'} style={keraton ? { fontFamily: 'var(--font-playfair), serif' } : gilded || bloom ? { fontFamily: 'var(--font-cormorant), serif' } : undefined}>{guest ?? t.guestFallback}</p>
              </div>
            )}
            <button
              onClick={open}
              className={`wl-btn mt-10 px-7 py-3 text-sm font-medium tracking-wide shadow-lg transition-transform hover:scale-[1.03] ${fx === 'premium' ? 'wl-pulse' : ''} ${enter(900).className}`}
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
                  <div className={gilded || airy || bloom ? 'space-y-14' : 'space-y-12'}>
                    {(['pria', 'wanita'] as const).map((who, i) => {
                      const nick = str(data, 'mempelai', `${who}_nama`) || (placeholders ? (who === 'pria' ? 'Andi' : 'Sinta') : '');
                      if (!nick) return null;
                      const full = str(data, 'mempelai', `${who}_lengkap`);
                      const parents = str(data, 'mempelai', `${who}_ortu`);
                      const photo = url(str(data, 'mempelai', `${who}_foto`));
                      return (
                        <Reveal key={who} delay={i * 120} className="flex flex-col items-center text-center">
                          {bloom && i === 1 && (
                            <div className="-mt-4 mb-9 flex w-full justify-center" aria-hidden>
                              <BloomMini className="w-28" />
                            </div>
                          )}
                          {airy && i === 1 && (
                            <div className="-mt-5 mb-8 flex w-full justify-center">
                              <DovePair size="w-[3rem]" />
                            </div>
                          )}
                          {keraton && i === 1 && (
                            <div className="-mt-6 mb-9 flex w-full items-center justify-center gap-4" aria-hidden>
                              <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, var(--kr-gold-d))' }} />
                              <span className="wl-foil text-[3rem] italic leading-none" style={{ fontFamily: 'var(--font-playfair), serif' }}>&amp;</span>
                              <span className="h-px w-16" style={{ background: 'linear-gradient(270deg, transparent, var(--kr-gold-d))' }} />
                            </div>
                          )}
                          {gilded && i === 1 && (
                            <div className="-mt-6 mb-9 flex w-full items-center justify-center gap-4" style={{ color: 'var(--p)' }} aria-hidden>
                              <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, currentColor)' }} />
                              <span className="wl-foil text-[3.2rem] italic leading-none" style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 500 }}>&amp;</span>
                              <span className="h-px w-16" style={{ background: 'linear-gradient(270deg, transparent, currentColor)' }} />
                            </div>
                          )}
                          <div className={`relative ${fx === 'premium' ? 'wl-float' : ''}`} style={fx === 'premium' ? { animationDelay: `${i * -2}s` } : undefined}>
                            <PhotoFrame frame={motif.frame} src={photo} label={nick} placeholders={placeholders} letterFont="var(--font-script)" tilt={i ? 2.5 : -2.5} photoRadius={radius.photo} />
                            {!bloom && (
                              <div className={`absolute -bottom-3 w-20 ${i ? '-right-6' : '-left-6'}`} style={{ color: 'var(--p)' }}>
                                <orn.Sprig className="w-20" flip={!!i} />
                              </div>
                            )}
                          </div>
                          <p className="mt-6 text-xs uppercase tracking-[0.3em] opacity-60" style={gilded ? { fontFamily: 'var(--font-cinzel), serif', fontSize: 10.5, letterSpacing: '0.36em' } : undefined}>{who === 'pria' ? t.groom : t.bride}</p>
                          <h3 className={gilded ? 'mt-2 wl-foil leading-[1.25]' : 'mt-2'} style={{ ...namesStyle, fontSize: keraton ? '2.3rem' : gilded || airy || bloom ? '2.9rem' : hf.section, fontWeight: nf.weight === 400 ? 400 : 500 }}>
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
                  {quote && <blockquote className={gilded || airy || bloom || keraton ? 'wl-quote text-center' : 'text-center text-xl italic leading-relaxed'} style={{ fontFamily: 'var(--font-cormorant)' }}>{gilded || airy || bloom || keraton ? quote : `“${quote}”`}</blockquote>}
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
                          <div className="wl-card border p-7 text-center" style={{ borderRadius: 'var(--r)', borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)', background: 'var(--bg)' }}>
                            <h3 style={{ ...headingStyle, fontSize: hf.section, fontWeight: hf.weight === 400 ? 400 : 600 }}>{ev === 'akad' ? t.akad : t.reception}</h3>
                            <p className="wl-ev-date mt-4 text-lg font-semibold">{formatLocalDate(when, lang)}</p>
                            <p className="wl-ev-time opacity-80">{formatLocalTime(when)}</p>
                            <div style={{ color: 'var(--p)' }}>
                              <orn.Divider className={bloom ? 'mx-auto my-3 w-48' : 'mx-auto my-4 w-24 opacity-70'} />
                            </div>
                            {place && <p className="font-semibold">{place}</p>}
                            {address && <p className={`mt-1 opacity-80 ${bodyText}`}>{address}</p>}
                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                              {maps && (
                                <a href={maps} target="_blank" rel="noopener noreferrer" className="wl-btn px-4 py-2 text-xs font-medium text-white" style={{ background: 'var(--p)', borderRadius: 'var(--rb)' }}>
                                  {t.openMaps}
                                </a>
                              )}
                              {cal && (
                                <a href={cal} target="_blank" rel="noopener noreferrer" className="wl-btn-o border px-4 py-2 text-xs font-medium" style={{ borderColor: 'var(--p)', color: 'var(--p)', borderRadius: 'var(--rb)' }}>
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
                    <div className={`grid grid-cols-2 ${gilded || airy || bloom ? 'gap-4' : 'gap-2.5'}`}>
                      {galleryPhotos.map((src, i) => (
                        <button
                          key={src}
                          onClick={() => setLightbox(i)}
                          className={`wl-gal wl-reveal overflow-hidden ${i % 3 === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'}`}
                          style={{ borderRadius: radius.photo, '--d': `${(i % 3) * 90}ms` } as CSSProperties}
                          aria-label={`Foto ${i + 1}`}
                        >
                          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    placeholders && (
                      <div className={`grid grid-cols-2 ${gilded || airy || bloom ? 'gap-4' : 'gap-2.5'}`}>
                        {[0, 1, 2, 3].map((i) => (
                          <PhotoPlaceholder key={i} className={`wl-gal ${i === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'}`} radius={radius.photo} delay={(i % 3) * 90} />
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
                      <div className="wl-card border p-5 text-center" style={{ borderRadius: 'var(--r)', borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)' }}>
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

        <footer className={`px-6 pb-24 pt-12 text-center text-xs ${gilded || airy || bloom || keraton ? '' : 'opacity-60'}`}>
          {keraton ? (
            <>
              <div className="mx-auto h-[6rem]" style={{ aspectRatio: '200 / 272' }}>
                <Gunungan />
              </div>
              <p className="mt-4 text-[1.9rem] leading-tight" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--p)' }}>{names}</p>
              <div className="mt-3" style={{ color: 'var(--p)' }}>
                <orn.Divider className="mx-auto w-48" />
              </div>
              <p className="mt-3 opacity-60">{t.madeWith}</p>
              {preset?.credit && <p className="mt-2 opacity-50">{preset.credit}</p>}
            </>
          ) : bloom ? (
            <>
              {showMono && (
                <div className="flex justify-center">
                  <FloralMonogram a={monoA} b={monoB} size={124} />
                </div>
              )}
              <p className="mt-2 text-[2.2rem] leading-tight" style={{ fontFamily: 'var(--font-script), cursive', color: 'var(--p)' }}>{names}</p>
              <div className="mt-1" style={{ color: 'var(--p)' }}>
                <orn.Divider className="mx-auto w-56" />
              </div>
              <p className="mt-3 opacity-60">{t.madeWith}</p>
              {preset?.credit && <p className="mt-2 opacity-50">{preset.credit}</p>}
            </>
          ) : airy ? (
            <>
              <DovePair className="mx-auto" size="w-[4.2rem]" />
              <p className="mt-2 text-[2.1rem] leading-tight" style={{ fontFamily: 'var(--font-script), cursive', color: 'var(--p)' }}>{names}</p>
              <div className="mt-2" style={{ color: 'var(--p)' }}>
                <orn.Divider className="mx-auto w-36" />
              </div>
              <p className="mt-3 opacity-60">{t.madeWith}</p>
              {preset?.credit && <p className="mt-2 opacity-50">{preset.credit}</p>}
            </>
          ) : gilded ? (
            <>
              {showMono && (
                <div className="flex justify-center">
                  <Monogram a={monoA} b={monoB} size={84} />
                </div>
              )}
              <p className="wl-foil mt-3 text-[2rem] leading-tight" style={{ fontFamily: 'var(--font-script), cursive' }}>{names}</p>
              <div className="mt-3" style={{ color: 'var(--p)' }}>
                <orn.Divider className="mx-auto w-32" />
              </div>
              <p className="mt-3 opacity-60">{t.madeWith}</p>
              {preset?.credit && <p className="mt-2 opacity-50">{preset.credit}</p>}
            </>
          ) : (
            <>
              <div style={{ color: 'var(--p)' }}>
                <orn.Sprig className="mx-auto mb-3 w-20" />
              </div>
              <p style={{ color: 'var(--tx)' }}>{names}</p>
              <p className="mt-1">{t.madeWith}</p>
              {preset?.credit && <p className="mt-2 opacity-80">{preset.credit}</p>}
            </>
          )}
        </footer>

        {musicUrl && (
          <div className="pointer-events-none sticky bottom-4 z-20 flex h-0 justify-end pr-4">
            <button
              onClick={toggleMusic}
              className={`wl-fab pointer-events-auto -mt-12 flex h-11 w-11 items-center justify-center text-white shadow-lg ${playing && animated ? 'wl-pulse' : ''}`}
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
    <section className={`wl-block relative px-6 py-16 ${tint ? 'wl-tint' : ''}`} style={{ background: tint }}>
      {tint && fx !== 'none' && <PatternLayer kind={motif.pattern} opacity={0.05} />}
      <div className="wl-reveal relative mb-10 text-center">
        <h2 className={motif.skin === 'gilded' ? 'wl-heading' : undefined} style={{ ...headingStyle, ...sectionFont }}>{title}</h2>
        <div style={{ color: 'var(--p)' }}>
          <orn.Divider className={motif.skin === 'gilded' ? 'mx-auto mt-4 w-36' : motif.skin === 'keraton' ? 'mx-auto mt-4 w-48' : motif.skin === 'bloom' ? 'mx-auto mt-0 w-60' : 'mx-auto mt-3 w-28'} />
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
  sky: {
    section: { background: 'radial-gradient(ellipse 60% 40% at 12% 100%, rgba(255,255,255,.4), transparent 70%), radial-gradient(ellipse 50% 36% at 88% 96%, rgba(255,255,255,.34), transparent 70%), linear-gradient(180deg, color-mix(in oklch, var(--p) 100%, black 14%), color-mix(in oklch, var(--p) 66%, white))' },
    cell: { background: 'rgba(255,255,255,.17)', border: '1px solid rgba(255,255,255,.55)', backdropFilter: 'blur(6px)', boxShadow: '0 14px 26px -18px rgba(20,30,60,.55), inset 0 1px 0 rgba(255,255,255,.5)' },
    num: { fontWeight: 600 },
  },
  bloom: {
    section: { background: 'linear-gradient(180deg, color-mix(in srgb, var(--s) 12%, #fff), color-mix(in srgb, var(--p) 10%, #fff))', borderTop: '1px solid color-mix(in srgb, var(--s) 22%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--s) 22%, transparent)' },
    cell: { background: '#fff', border: '1px solid color-mix(in srgb, var(--s) 28%, transparent)', boxShadow: '0 18px 26px -20px color-mix(in srgb, var(--s) 80%, transparent)' },
    num: { color: 'var(--p)', fontWeight: 600 },
  },
  luxe: {
    section: { background: 'radial-gradient(ellipse 85% 100% at 50% 0%, color-mix(in srgb, var(--tx) 72%, #627ab8) 0, color-mix(in srgb, var(--tx) 93%, #000) 72%)', borderTop: '1px solid color-mix(in srgb, var(--p) 55%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--p) 55%, transparent)' },
    cell: {
      border: '1px solid color-mix(in srgb, var(--p) 64%, transparent)',
      background: 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.01))',
      boxShadow: 'inset 0 0 0 3px color-mix(in srgb, var(--tx) 90%, #000), inset 0 0 0 4px color-mix(in srgb, var(--p) 32%, transparent)',
    },
    num: { fontWeight: 500, backgroundImage: 'var(--foil-lit)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' },
  },
  keraton: {
    section: { background: 'var(--kr-kawung-dark, none), linear-gradient(180deg, color-mix(in srgb, var(--p) 82%, #000), var(--p))', borderTop: '1px solid var(--s)', borderBottom: '1px solid var(--s)' },
    cell: {
      border: '1px solid color-mix(in srgb, var(--s) 70%, transparent)',
      background: 'rgba(0,0,0,.2)',
      boxShadow: 'inset 0 0 0 3px color-mix(in srgb, var(--p) 78%, #000), inset 0 0 0 4px color-mix(in srgb, var(--s) 38%, transparent)',
    },
    num: { fontFamily: 'var(--font-playfair), serif', fontWeight: 500, backgroundImage: 'var(--foil-lit)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' },
  },
  flip: {
    section: { background: 'color-mix(in srgb, var(--p) 40%, #0d0d0d)' },
    cell: { background: 'linear-gradient(#2c2c2c calc(50% - 1px), #000 calc(50% - 1px) calc(50% + 1px), #1c1c1c calc(50% + 1px))', borderRadius: '8px', boxShadow: '0 6px 14px -6px rgba(0,0,0,.6)' },
  },
};

function Countdown({ target, t }: { target: string; t: Strings }) {
  const { orn, motif, fx, radius, sectionFont } = useTheme();
  const keraton = motif.countdown === 'keraton';
  const luxe = motif.countdown === 'luxe' || keraton;
  const sky = motif.countdown === 'sky';
  const light = motif.countdown === 'bloom';
  const now = useNow();
  const end = localToInstant(target);
  const diff = now === null || Number.isNaN(end) ? null : Math.max(0, end - now);
  const parts = diff === null ? null : [Math.floor(diff / 86_400_000), Math.floor((diff / 3_600_000) % 24), Math.floor((diff / 60_000) % 60), Math.floor((diff / 1000) % 60)];
  const labels = [t.days, t.hours, t.minutes, t.seconds];
  const look = COUNTDOWN_LOOK[motif.countdown];
  return (
    <section className="wl-reveal relative overflow-hidden px-6 py-14 text-center" style={{ ...look.section, color: light ? 'var(--tx)' : '#fff' }}>
      {sky && (
        <Dove className="wl-glide pointer-events-none absolute left-0 top-5 w-[3.4rem] opacity-90" speed={0.8} />
      )}
      <h2 className={luxe ? 'wl-foil-lit' : undefined} style={{ ...sectionFont, color: light ? 'var(--p)' : '#fff' }}>{t.countdown}</h2>
      {(luxe || light) && (
        <div className="mt-3" style={{ color: 'var(--p)' }}>
          <orn.Divider className={light ? 'mx-auto w-60' : 'mx-auto w-36'} />
        </div>
      )}
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
            <div className="mt-1 text-[11px] uppercase tracking-widest opacity-80" style={keraton ? { fontFamily: 'var(--font-montserrat), sans-serif', letterSpacing: '0.24em', fontSize: 9.5 } : luxe ? { fontFamily: 'var(--font-cinzel), serif', letterSpacing: '0.2em', fontSize: 10 } : undefined}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CopyCard({ bank, number, holder, t }: { bank: string; number: string; holder: string; t: Strings }) {
  const [done, setDone] = useState(false);
  return (
    <div className="wl-card border p-5 text-center" style={{ borderRadius: 'var(--r)', borderColor: 'color-mix(in srgb, var(--p) 25%, transparent)' }}>
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
        className="wl-btn-o mt-3 border px-4 py-1.5 text-xs font-medium"
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
            <li key={i} className="wl-reveal wl-card p-4" style={{ background: 'var(--bg)', borderRadius: 'var(--r)', '--d': `${Math.min(i, 5) * 80}ms` } as CSSProperties}>
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
