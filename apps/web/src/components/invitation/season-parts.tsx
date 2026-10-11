// Komponen React untuk ornamen undangan musim (Semi, Gugur, Dingin): sudut, pemisah, ranting, dan bingkai foto berhias bunga/daun.
// Gambarnya dibangkitkan di season-art.ts (potongan SVG berupa teks); di sini tiap potongan dihitung sekali di tingkat modul lalu
// dipasang lewat dangerouslySetInnerHTML (aman: isinya statis, dihasilkan kode ini sendiri, bukan input pengguna).
import type { CSSProperties, ReactNode } from 'react';
import { seasonCorner, seasonCrown, seasonDivider, seasonSprig } from './season-art';
import type { Season } from './season-art';

const SEASONS: Season[] = ['sakura', 'autumn', 'winter'];
const CORNER = Object.fromEntries(SEASONS.map((s) => [s, seasonCorner(s)])) as Record<Season, string>;
const DIVIDER = Object.fromEntries(SEASONS.map((s) => [s, seasonDivider(s)])) as Record<Season, string>;
const SPRIG = Object.fromEntries(SEASONS.map((s) => [s, seasonSprig(s)])) as Record<Season, string>;

// Sudut kiri-atas yang dicerminkan untuk tiga sudut lain (bunga tidak diputar supaya tidak terbalik).
const MIRROR: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
export function SeasonCorner({ season, className = 'w-36', rotate = 0 }: { season: Season; className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  return <svg viewBox="0 0 170 170" className={`overflow-visible ${className}`} style={{ scale: MIRROR[rotate] ?? '1 1' }} dangerouslySetInnerHTML={{ __html: CORNER[season] }} aria-hidden />;
}
export function SeasonDivider({ season, className = 'w-56' }: { season: Season; className?: string }) {
  return <svg viewBox="0 0 240 40" className={`overflow-visible ${className}`} dangerouslySetInnerHTML={{ __html: DIVIDER[season] }} aria-hidden />;
}
export function SeasonSprig({ season, className = 'w-28', flip }: { season: Season; className?: string; flip?: boolean }) {
  return <svg viewBox="0 0 130 70" className={`overflow-visible ${className}`} style={flip ? { scale: '-1 1' } : undefined} dangerouslySetInnerHTML={{ __html: SPRIG[season] }} aria-hidden />;
}

const CROWNS = new Map<string, string>();
function crownFor(season: Season, w: number, h: number) {
  const key = `${season}-${w}x${h}`;
  let c = CROWNS.get(key);
  if (!c) {
    c = seasonCrown(season, w, h);
    CROWNS.set(key, c);
  }
  return c;
}

// Tampilan bingkai per musim: warna tepi & bayangan (warna tema ikut palet).
const FRAME: Record<Season, { edge: string; shadow: string; inner: string }> = {
  sakura: { edge: '#fff', shadow: '0 24px 36px -24px color-mix(in srgb, var(--p) 70%, transparent), 0 0 0 1px color-mix(in srgb, var(--p) 24%, transparent)', inner: 'color-mix(in srgb, var(--p) 20%, transparent)' },
  autumn: { edge: 'color-mix(in srgb, var(--bg) 70%, #fff)', shadow: '0 24px 36px -24px color-mix(in srgb, var(--p) 75%, transparent), 0 0 0 1px color-mix(in srgb, var(--p) 40%, transparent)', inner: 'color-mix(in srgb, var(--p) 34%, transparent)' },
  winter: { edge: '#fff', shadow: '0 24px 36px -24px color-mix(in srgb, var(--p) 65%, transparent), 0 0 0 1px color-mix(in srgb, var(--p) 30%, transparent), 0 0 24px 2px color-mix(in srgb, #fff 80%, var(--s))', inner: 'color-mix(in srgb, var(--p) 26%, transparent)' },
};

// Bingkai foto lengkung berhias: tepi berwarna, mahkota bunga/daun mengikuti lengkung atas, dua ranting di kaki.
// Ukuran bingkai harus pasti (px) supaya mahkota pas: `w` x `h` = ukuran luar (termasuk tepi).
export function SeasonFrame({ season, children, w = 188, h = 236, className = '', style }: { season: Season; children: ReactNode; w?: number; h?: number; className?: string; style?: CSSProperties }) {
  const look = FRAME[season];
  return (
    <div className={`relative ${className}`} style={{ width: w, height: h, ...style }}>
      <div className="h-full w-full rounded-t-[999px] rounded-b-[22px] p-[7px]" style={{ background: look.edge, boxShadow: look.shadow }}>
        <div className="h-full w-full overflow-hidden rounded-t-[999px] rounded-b-[16px]" style={{ boxShadow: `0 0 0 1px ${look.inner}` }}>{children}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" dangerouslySetInnerHTML={{ __html: crownFor(season, w, h) }} aria-hidden />
      <SeasonSprig season={season} className="pointer-events-none absolute -bottom-4 -left-12 w-[6.6rem]" />
      <SeasonSprig season={season} className="pointer-events-none absolute -bottom-4 -right-12 w-[6.6rem]" flip />
    </div>
  );
}
