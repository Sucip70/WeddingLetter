// Komponen React untuk ornamen tiga undangan berwarna dominan (Lavender, Hortensia, Marigold): sudut, pemisah, ranting, dan bingkai
// foto lengkung berhias bunga. Gambarnya dibangkitkan di meadow-art.ts (potongan SVG berupa teks); tiap potongan dihitung sekali di
// tingkat modul lalu dipasang lewat dangerouslySetInnerHTML (aman: isinya statis, dihasilkan kode ini sendiri, bukan input pengguna).
// Nada warna bunga dipasang di elemen <svg> sebagai variabel CSS (meadowVars) dan mengikuti --p/--s tema.
import type { CSSProperties, ReactNode } from 'react';
import { GHOST_BOX, MEADOW_FRAME, meadowCorner, meadowCrown, meadowDivider, meadowEdgeTile, meadowGhost, meadowSprig, meadowVars } from './meadow-art';
import type { Meadow } from './meadow-art';

const MEADOWS: Meadow[] = ['lavender', 'hortensia', 'marigold', 'sakura', 'autumn', 'winter'];
const build = (fn: (v: Meadow) => string) => Object.fromEntries(MEADOWS.map((v) => [v, fn(v)])) as Record<Meadow, string>;
const CORNER = build(meadowCorner);
const DIVIDER = build(meadowDivider);
const SPRIG = build(meadowSprig);
const VARS = Object.fromEntries(MEADOWS.map((v) => [v, meadowVars(v) as CSSProperties])) as Record<Meadow, CSSProperties>;

// Sudut kiri-atas yang dicerminkan untuk tiga sudut lain (bunga tidak diputar supaya tidak terbalik).
const MIRROR: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
export function MeadowCorner({ meadow, className = 'w-36', rotate = 0 }: { meadow: Meadow; className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  return <svg viewBox="0 0 170 170" className={`overflow-visible ${className}`} style={{ ...VARS[meadow], scale: MIRROR[rotate] ?? '1 1' }} dangerouslySetInnerHTML={{ __html: CORNER[meadow] }} aria-hidden />;
}
export function MeadowDivider({ meadow, className = 'w-56' }: { meadow: Meadow; className?: string }) {
  return <svg viewBox="0 0 240 40" className={`overflow-visible ${className}`} style={VARS[meadow]} dangerouslySetInnerHTML={{ __html: DIVIDER[meadow] }} aria-hidden />;
}
export function MeadowSprig({ meadow, className = 'w-28', flip }: { meadow: Meadow; className?: string; flip?: boolean }) {
  return <svg viewBox="0 0 130 70" className={`overflow-visible ${className}`} style={{ ...VARS[meadow], ...(flip ? { scale: '-1 1' } : null) }} dangerouslySetInnerHTML={{ __html: SPRIG[meadow] }} aria-hidden />;
}

// Bayangan bunga kabur di latar blok isi; letak (kiri/kanan bergantian) diatur CSS `.wl-ghost` di globals.css.
const GHOST = build(meadowGhost);
export function MeadowGhost({ meadow }: { meadow: Meadow }) {
  return <svg viewBox={`0 0 ${GHOST_BOX.w} ${GHOST_BOX.h}`} className="wl-ghost" style={VARS[meadow]} dangerouslySetInnerHTML={{ __html: GHOST[meadow] }} aria-hidden />;
}

const CROWNS = new Map<string, string>();
function crownFor(meadow: Meadow, w: number, h: number) {
  const key = `${meadow}-${w}x${h}`;
  let c = CROWNS.get(key);
  if (!c) {
    c = meadowCrown(meadow, w, h);
    CROWNS.set(key, c);
  }
  return c;
}

// Tampilan bingkai: tepi putih dengan bayangan berwarna tema.
const FRAME_SHADOW = '0 24px 36px -24px color-mix(in srgb, var(--p) 70%, transparent), 0 0 0 1px color-mix(in srgb, var(--p) 26%, transparent)';

// Bingkai foto lengkung berhias: mahkota bunga mengikuti lengkung atas, dua ranting di kaki. Ukuran bingkai harus pasti (px)
// supaya mahkota pas: `w` x `h` = ukuran luar (termasuk tepi).
export function MeadowFrame({ meadow, children, className = '', style }: { meadow: Meadow; children: (photoClass: string) => ReactNode; className?: string; style?: CSSProperties }) {
  const { w, h, shape, photo } = MEADOW_FRAME[meadow];
  const inner = shape.replace('rounded-b-[22px]', 'rounded-b-[16px]');
  return (
    <div className={`relative ${className}`} style={{ width: w, height: h, ...style }}>
      <div className={`h-full w-full bg-white p-[7px] ${shape}`} style={{ boxShadow: FRAME_SHADOW }}>
        <div className={`h-full w-full overflow-hidden ${inner}`} style={{ boxShadow: '0 0 0 1px color-mix(in srgb, var(--p) 22%, transparent)' }}>{children(`${photo} ${inner}`)}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={VARS[meadow]} dangerouslySetInnerHTML={{ __html: crownFor(meadow, w, h) }} aria-hidden />
    </div>
  );
}

// Bingkai penuh di tepi sampul (tema musim): garis tipis ganda mengelilingi halaman, ubin bunga berulang di tepi kiri & kanan,
// satu aksen di tengah tepi atas & bawah. Karangan sudut (MeadowCorner) menutupi sudutnya, jadi ubin hanya mengisi bagian tengah tepi.
const TILES = Object.fromEntries(MEADOWS.map((v) => [v, [0, 1, 2].map((k) => meadowEdgeTile(v, k))])) as Record<Meadow, string[]>;
export function MeadowPageFrame({ meadow }: { meadow: Meadow }) {
  const t = TILES[meadow];
  const across = (i: number) => <svg key={i} viewBox="0 0 60 24" className="h-6 w-14 overflow-visible" dangerouslySetInnerHTML={{ __html: t[i % 3]! }} />;
  const down = (i: number) => <svg key={i} viewBox="0 0 24 60" className="h-14 w-6 overflow-visible" dangerouslySetInnerHTML={{ __html: `<g transform="translate(24 0) rotate(90)">${t[i % 3]!}</g>` }} />;
  return (
    <div className="pointer-events-none absolute inset-[14px]" style={{ ...VARS[meadow], color: 'var(--p)' }} aria-hidden>
      <div className="absolute inset-0 rounded-[6px]" style={{ border: '1.2px solid currentColor', opacity: 0.8 }} />
      <div className="absolute inset-[5px] rounded-[3px]" style={{ border: '0.7px solid currentColor', opacity: 0.5 }} />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">{across(0)}</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">{across(1)}</div>
      <div className="absolute bottom-40 left-0 top-44 flex -translate-x-1/2 flex-col items-center justify-between">{[0, 1, 2, 1, 0, 2, 1, 0].map(down)}</div>
      <div className="absolute bottom-44 right-0 top-40 flex translate-x-1/2 flex-col items-center justify-between">{[1, 2, 0, 2, 1, 0, 2, 1].map(down)}</div>
    </div>
  );
}
