'use client';

// Komponen React untuk desain "Buket Pengantin" (kulit `bloom`): monogram karangan bunga, lengkung foto berbunga, ornamen sudut
// / pemisah / ranting, dan data URI untaian bunga. Bunga digambar di flora-art.ts & flora-comp.ts (potongan SVG berupa teks);
// di sini tiap potongan dihitung sekali di tingkat modul lalu dipasang lewat dangerouslySetInnerHTML (aman: isinya statis,
// dihasilkan kode ini sendiri, bukan input pengguna). Bunga utama memakai warna sekunder tema (var(--s)) sehingga ikut palet.
import { createContext, useContext } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { BLOOM, GARDEN, makeGarden } from './flora-art';
import { archCrown, cornerCluster, dividerRow, garlandTile, miniBloom, romanticCorner, romanticDivider, romanticSprig, smallSprig, wreath } from './flora-comp';
import type { Garden } from './flora-art';
import { botaniCorner, botaniDivider, botaniSprig, filigreeCorner } from './botani-art';

const CORNER = cornerCluster();
const DIVIDER = dividerRow();
const SPRIG = smallSprig();
const WREATH = wreath();
const MINI = miniBloom();
// "Taman mawar" (Floral Romantis): komposisi serupa, hanya mawar & peony merah muda (warna utama ikut --p).
const ROSE_CORNER = romanticCorner();
const ROSE_DIVIDER = romanticDivider();
const ROSE_SPRIG = romanticSprig();
// "Taman Botani": daun teh & bunga liar hijau (warna daun turunan --p) dan sudut filigran bingkai.
const BOTANI_CORNER = botaniCorner();
const BOTANI_DIVIDER = botaniDivider();
const BOTANI_SPRIG = botaniSprig();
const FILIGREE = filigreeCorner();
const FILIGREE_ORN = filigreeCorner('currentColor', false);

// Sprite: di halaman yang memuat banyak salinan sekaligus (katalog: tiap kartu punya 4 sudut + monogram, masing-masing
// ±80-110 KB SVG yang persis sama) gambar besar didefinisikan SEKALI lewat <BloomSpriteScope> lalu dirujuk dengan <use>.
// Warna tema tetap ikut: isi <use> mewarisi variabel CSS (--s) dari elemen <use>, yaitu dari kartu induknya.
// Di luar scope ini (halaman undangan, editor) komponen menyisipkan SVG langsung seperti biasa.
const SpriteContext = createContext(false);
const SPRITE_ID = { corner: 'wl-bloom-corner', wreath: 'wl-bloom-wreath', roseCorner: 'wl-rose-corner', botaniCorner: 'wl-botani-corner' } as const;

export function BloomSpriteScope({ children }: { children: ReactNode }) {
  return (
    <SpriteContext.Provider value>
      <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden focusable="false">
        <defs>
          <g id={SPRITE_ID.corner} dangerouslySetInnerHTML={{ __html: CORNER }} />
          <g id={SPRITE_ID.wreath} dangerouslySetInnerHTML={{ __html: WREATH }} />
          <g id={SPRITE_ID.roseCorner} dangerouslySetInnerHTML={{ __html: ROSE_CORNER }} />
          <g id={SPRITE_ID.botaniCorner} dangerouslySetInnerHTML={{ __html: BOTANI_CORNER }} />
        </defs>
      </svg>
      {children}
    </SpriteContext.Provider>
  );
}

// Ornamen sudut kiri-atas yang dicerminkan untuk tiga sudut lain (bunga tidak diputar supaya tidak terbalik).
export function BloomCorner({ className = 'w-40', rotate = 0 }: { className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  const mirror: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
  const sprite = useContext(SpriteContext);
  const props = { viewBox: '0 0 170 170', className: `overflow-visible ${className}`, style: { scale: mirror[rotate] ?? '1 1' }, 'aria-hidden': true } as const;
  return sprite ? (
    <svg {...props}>
      <use href={`#${SPRITE_ID.corner}`} />
    </svg>
  ) : (
    <svg {...props} dangerouslySetInnerHTML={{ __html: CORNER }} />
  );
}
// Sudut karangan mawar (Floral Romantis); pola sprite sama dengan BloomCorner.
export function RoseCorner({ className = 'w-40', rotate = 0 }: { className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  const mirror: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
  const sprite = useContext(SpriteContext);
  const props = { viewBox: '0 0 170 170', className: `overflow-visible ${className}`, style: { scale: mirror[rotate] ?? '1 1' }, 'aria-hidden': true } as const;
  return sprite ? (
    <svg {...props}>
      <use href={`#${SPRITE_ID.roseCorner}`} />
    </svg>
  ) : (
    <svg {...props} dangerouslySetInnerHTML={{ __html: ROSE_CORNER }} />
  );
}
// Sudut karangan daun & bunga liar (Taman Botani); pola sprite sama dengan BloomCorner.
export function BotaniCorner({ className = 'w-40', rotate = 0 }: { className?: string; rotate?: 0 | 90 | 180 | 270 }) {
  const mirror: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
  const sprite = useContext(SpriteContext);
  const props = { viewBox: '0 0 170 170', className: `overflow-visible ${className}`, style: { scale: mirror[rotate] ?? '1 1' }, 'aria-hidden': true } as const;
  return sprite ? (
    <svg {...props}>
      <use href={`#${SPRITE_ID.botaniCorner}`} />
    </svg>
  ) : (
    <svg {...props} dangerouslySetInnerHTML={{ __html: BOTANI_CORNER }} />
  );
}
export function BotaniDivider({ className = 'w-56' }: { className?: string }) {
  return <svg viewBox="0 0 240 40" className={`overflow-visible ${className}`} dangerouslySetInnerHTML={{ __html: BOTANI_DIVIDER }} aria-hidden />;
}
export function BotaniSprig({ className = 'w-28', flip }: { className?: string; flip?: boolean }) {
  return <svg viewBox="0 0 130 70" className={`overflow-visible ${className}`} style={flip ? { scale: '-1 1' } : undefined} dangerouslySetInnerHTML={{ __html: BOTANI_SPRIG }} aria-hidden />;
}
// Sudut bingkai filigran (kiri-atas, dicerminkan untuk tiga sudut lain); warna = currentColor.
export function FiligreeCorner({ className = 'w-14', rotate = 0, lines = true }: { className?: string; rotate?: 0 | 90 | 180 | 270; lines?: boolean }) {
  const mirror: Record<number, string> = { 0: '1 1', 90: '-1 1', 180: '-1 -1', 270: '1 -1' };
  return <svg viewBox="0 0 64 64" className={`overflow-visible ${className}`} style={{ scale: mirror[rotate] ?? '1 1' }} dangerouslySetInnerHTML={{ __html: lines ? FILIGREE : FILIGREE_ORN }} aria-hidden />;
}
export function RoseDivider({ className = 'w-56' }: { className?: string }) {
  return <svg viewBox="0 0 240 40" className={`overflow-visible ${className}`} dangerouslySetInnerHTML={{ __html: ROSE_DIVIDER }} aria-hidden />;
}
export function RoseSprig({ className = 'w-28', flip }: { className?: string; flip?: boolean }) {
  return <svg viewBox="0 0 130 70" className={`overflow-visible ${className}`} style={flip ? { scale: '-1 1' } : undefined} dangerouslySetInnerHTML={{ __html: ROSE_SPRIG }} aria-hidden />;
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
  const sprite = useContext(SpriteContext);
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }} aria-hidden>
      {sprite ? (
        <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full overflow-visible">
          <use href={`#${SPRITE_ID.wreath}`} />
        </svg>
      ) : (
        <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full overflow-visible" dangerouslySetInnerHTML={{ __html: WREATH }} />
      )}
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
