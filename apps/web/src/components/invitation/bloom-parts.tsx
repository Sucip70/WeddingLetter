// Komponen React untuk desain "Buket Pengantin" (kulit `bloom`): monogram karangan bunga, lengkung foto berbunga, ornamen sudut
// / pemisah / ranting, dan data URI untaian bunga. Bunga digambar di flora-art.ts & flora-comp.ts (potongan SVG berupa teks);
// di sini tiap potongan dihitung sekali di tingkat modul lalu dipasang lewat dangerouslySetInnerHTML (aman: isinya statis,
// dihasilkan kode ini sendiri, bukan input pengguna). Bunga utama memakai warna sekunder tema (var(--s)) sehingga ikut palet.
import type { CSSProperties, ReactNode } from 'react';
import { BLOOM, GARDEN, makeGarden } from './flora-art';
import { archCrown, cornerCluster, dividerRow, garlandTile, miniBloom, smallSprig, wreath } from './flora-comp';
import type { Garden } from './flora-art';

const CORNER = cornerCluster();
const DIVIDER = dividerRow();
const SPRIG = smallSprig();
const WREATH = wreath();
const MINI = miniBloom();

// Ornamen sudut kiri-atas yang dicerminkan untuk tiga sudut lain (bunga tidak diputar supaya tidak terbalik).
export function BloomCorner({ className = 'w-40', rotate = 0 }: { className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  const mirror: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
  return <svg viewBox="0 0 170 170" className={`overflow-visible ${className}`} style={{ scale: mirror[rotate] ?? '1 1' }} dangerouslySetInnerHTML={{ __html: CORNER }} aria-hidden />;
}
export function BloomDivider({ className = 'w-56' }: { className?: string }) {
  return <svg viewBox="0 0 240 40" className={`overflow-visible ${className}`} dangerouslySetInnerHTML={{ __html: DIVIDER }} aria-hidden />;
}
export function BloomSprig({ className = 'w-28', flip }: { className?: string; flip?: boolean }) {
  return <svg viewBox="0 0 130 70" className={`overflow-visible ${className}`} style={flip ? { scale: '-1 1' } : undefined} dangerouslySetInnerHTML={{ __html: SPRIG }} aria-hidden />;
}
export function BloomMini({ className = 'w-14' }: { className?: string }) {
  return <svg viewBox="-40 -24 80 48" className={`overflow-visible ${className}`} dangerouslySetInnerHTML={{ __html: MINI }} aria-hidden />;
}

// Monogram: inisial mempelai (aksara tulisan tangan) di tengah karangan bunga lingkaran.
export function FloralMonogram({ a, b, size = 112, className = '' }: { a: string; b: string; size?: number; className?: string }) {
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full overflow-visible" dangerouslySetInnerHTML={{ __html: WREATH }} />
      <span className="relative flex items-baseline leading-none" style={{ fontSize: size * 0.3, fontFamily: 'var(--font-script)', color: 'var(--p)' }}>
        <span>{a}</span>
        <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '0.5em', fontStyle: 'italic', margin: '0 0.08em', transform: 'translateY(-0.25em)', color: 'var(--s)' }}>&amp;</span>
        <span>{b}</span>
      </span>
    </div>
  );
}

// Lengkung foto berbunga: tepi putih bersudut membulat, mahkota bunga mengikuti lengkung atas, dan dua ranting di kaki.
// Ukuran bingkai harus pasti (px/rem) supaya SVG mahkota pas: `w` x `h` = ukuran luar (termasuk bingkai putih).
const CROWNS = new Map<string, string>();
function crownFor(w: number, h: number, g: Garden) {
  const key = `${w}x${h}`;
  let c = CROWNS.get(key);
  if (!c) {
    c = archCrown(w, h, g);
    CROWNS.set(key, c);
  }
  return c;
}
export function FloralArch({ children, w, h, className = '', style }: { children: ReactNode; w: number; h: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={`relative ${className}`} style={{ width: w, height: h, ...style }}>
      <div
        className="h-full w-full rounded-t-[999px] rounded-b-[24px] p-[6px]"
        style={{ background: '#fff', boxShadow: '0 24px 36px -24px color-mix(in srgb, var(--s) 75%, transparent), 0 0 0 1px color-mix(in srgb, var(--s) 22%, transparent)' }}
      >
        <div className="h-full w-full overflow-hidden rounded-t-[999px] rounded-b-[18px]">{children}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" dangerouslySetInnerHTML={{ __html: crownFor(w, h, GARDEN) }} aria-hidden />
      <BloomSprig className="pointer-events-none absolute -bottom-3 -left-8 w-[5.2rem]" />
      <BloomSprig className="pointer-events-none absolute -bottom-3 -right-8 w-[5.2rem]" flip />
    </div>
  );
}

// Untaian bunga ubin sebagai gambar CSS (data URI): warna bunga utama = warna sekunder tema (hex), jadi dihitung per tema.
export function garlandCss(heroHex: string) {
  const g = makeGarden(heroHex);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0 0 200 40">${garlandTile(g)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
// Bunga mini sebagai gambar CSS (ikon kutipan).
export function miniBloomCss(heroHex: string) {
  const g = makeGarden(heroHex);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="48" viewBox="-40 -24 80 48">${miniBloom(g)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Warna pastel untuk partikel & kepingan bunga yang berhamburan.
export const PETAL_COLORS = [BLOOM.blush, BLOOM.rose, BLOOM.peach, BLOOM.lavender, BLOOM.butter, BLOOM.white, BLOOM.sky];
