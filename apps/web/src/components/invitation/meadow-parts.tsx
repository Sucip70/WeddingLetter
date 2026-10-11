// Komponen React untuk ornamen tiga undangan berwarna dominan (Lavender, Wisteria, Marigold): sudut, pemisah, ranting, dan bingkai
// foto lengkung berhias bunga. Gambarnya dibangkitkan di meadow-art.ts (potongan SVG berupa teks); tiap potongan dihitung sekali di
// tingkat modul lalu dipasang lewat dangerouslySetInnerHTML (aman: isinya statis, dihasilkan kode ini sendiri, bukan input pengguna).
// Nada warna bunga dipasang di elemen <svg> sebagai variabel CSS (meadowVars) dan mengikuti --p/--s tema.
import type { CSSProperties, ReactNode } from 'react';
import { MEADOW_FRAME, meadowCorner, meadowCrown, meadowDivider, meadowSprig, meadowVars } from './meadow-art';
import type { Meadow } from './meadow-art';

const MEADOWS: Meadow[] = ['lavender', 'wisteria', 'marigold'];
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
