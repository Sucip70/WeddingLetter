// Rangkaian bunga untuk desain "Buket Pengantin" (lihat flora-art.ts untuk bunga tunggalnya). Setiap fungsi mengembalikan potongan
// SVG (teks) dalam kotak yang disebutkan di komentarnya. `g` = palet bunga: GARDEN (hero mengikuti tema, untuk JSX) atau
// GARDEN_FIXED (semua hex, untuk data URI).
import { BLOOM, GARDEN, anemone, blossom, cosmos, daisy, filler, gypsophila, leafD, peony, put, rng, rose, sprig, tone } from './flora-art';
import type { Garden } from './flora-art';

const skyTone = tone(BLOOM.sky, '#3a5f8a');
const whiteTone = tone(BLOOM.white, '#7a8a9a');
const lilacTone = tone(BLOOM.lilac, '#4f3a7a');

const leaf = (g: Garden, L: number, w: number, rot: number, x: number, y: number) =>
  put(x, y, rot, 1, `<path d="${leafD(L, w)}" fill="${g.leaf}" stroke="${g.leafDark}" stroke-opacity=".6" stroke-width=".6"/><path d="M0 0L${(L * 0.85).toFixed(1)} 0" stroke="${g.leafDark}" stroke-opacity=".4" stroke-width=".6"/>`);

// Karangan sudut kiri-atas, kotak 0 0 170 170: bunga bergerombol di sudut, daun & eukaliptus menjalar sepanjang dua tepi.
export function cornerCluster(g: Garden = GARDEN) {
  let s = '';
  // tangkai & daun di belakang
  s += put(30, 52, -22, 1, sprig(118, 8, 24, g.leafLight, g.leafDark, true));
  s += put(52, 30, 66, 1, sprig(118, 8, 24, g.leafLight, g.leafDark, true));
  s += put(40, 42, 34, 1, sprig(100, 5, 30, g.leaf, g.leafDark));
  s += put(42, 40, 12, 1, gypsophila(104, 11));
  s += put(40, 44, 48, 1, gypsophila(98, 17));
  s += leaf(g, 54, 13, -52, 30, 34);
  s += leaf(g, 54, 13, 142, 34, 30);
  // bunga kecil pengisi
  s += put(74, 70, 0, 1, filler(26, 10, [skyTone, lilacTone, whiteTone], 4, 0.22));
  s += put(20, 100, 0, 1, filler(14, 5, [skyTone, whiteTone], 8, 0.24));
  // bunga besar, dari belakang ke depan
  s += put(80, 26, 8, 1, peony(25, g.soft));
  s += put(24, 94, -10, 1, cosmos(17, g.cool));
  s += put(118, 24, 20, 1, cosmos(13, g.warm));
  s += put(98, 64, 12, 1, anemone(19));
  s += put(28, 28, 0, 1, rose(20, g.warm));
  s += put(86, 90, 0, 1, daisy(14, BLOOM.blush, BLOOM.butter, '#e39aae'));
  s += put(50, 52, 14, 1, rose(33, g.hero));
  s += put(70, 48, 0, 1, blossom(8, tone(BLOOM.butter, '#8a6a1c'), '#fff'));
  s += put(14, 62, 0, 1, blossom(7, tone(BLOOM.lavender, '#4f3a7a')));
  return s;
}

// Pemisah horizontal, kotak 0 0 240 40: mawar di tengah diapit aster/kosmos, daun, dan garis halus.
export function dividerRow(g: Garden = GARDEN) {
  let s = `<path d="M6 20H64M176 20H234" stroke="${g.leafDark}" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/>`;
  for (const side of [-1, 1]) {
    const cx = 120 + side * 0;
    s += put(cx + side * 40, 20, side === 1 ? 0 : 180, 1, `<path d="M0 0C14 -9 28 -9 38 0C28 8 14 8 0 0Z" fill="${g.leaf}" stroke="${g.leafDark}" stroke-opacity=".6" stroke-width=".6"/>`);
    s += put(cx + side * 79, 20, 0, 1, blossom(7, skyTone));
    s += put(cx + side * 56, 20, 0, 1, side === 1 ? cosmos(12, g.warm) : daisy(12, BLOOM.blush, BLOOM.butter, '#e39aae'));
    s += put(cx + side * 36, 20, side === 1 ? 24 : -24, 1, `<path d="M0 0C6 -6 12 -6 16 0C12 5 6 5 0 0Z" fill="${g.leafLight}" stroke="${g.leafDark}" stroke-opacity=".5" stroke-width=".5"/>`);
  }
  s += put(120, 20, 0, 1, rose(16, g.hero));
  s += put(100, 12, 0, 1, blossom(5, tone(BLOOM.butter, '#8a6a1c'), '#fff'));
  s += put(140, 29, 0, 1, blossom(4.5, lilacTone));
  return s;
}

// Ranting bunga kecil (di bawah foto / footer), kotak 0 0 130 70.
export function smallSprig(g: Garden = GARDEN) {
  let s = put(6, 60, -26, 1, sprig(120, 6, 22, g.leaf, g.leafDark));
  s += put(20, 62, -10, 1, gypsophila(90, 5));
  s += put(100, 20, 0, 1, cosmos(11, g.cool));
  s += put(78, 34, 0, 1, daisy(9, BLOOM.blush, BLOOM.butter, '#e39aae'));
  s += put(52, 46, 0, 1, blossom(6, skyTone));
  s += put(112, 38, 0, 1, rose(13, g.hero));
  return s;
}

// ----- buket (kotak 0 0 300 400): kepala bunga, tangkai, kertas pembungkus, pita dipisah supaya bisa dianimasikan -----
export function bouquetHead(g: Garden = GARDEN) {
  let s = '';
  // daun & eukaliptus melingkar di belakang
  for (const [a, L] of [[-168, 118], [-140, 126], [-112, 124], [-70, 124], [-42, 126], [-14, 118]] as const) s += leaf(g, L, 26, a, 150, 214);
  s += put(150, 214, -150, 1, sprig(150, 8, 26, g.leafLight, g.leafDark, true));
  s += put(150, 214, -30, 1, sprig(150, 8, 26, g.leafLight, g.leafDark, true));
  s += put(150, 214, -118, 1, gypsophila(168, 21));
  s += put(150, 214, -62, 1, gypsophila(168, 27));
  s += put(150, 214, -90, 1, gypsophila(150, 33));
  // pengisi di sela-sela
  s += put(96, 88, 0, 1, filler(24, 9, [skyTone, lilacTone, whiteTone], 6, 0.22));
  s += put(206, 90, 0, 1, filler(24, 9, [lilacTone, skyTone, whiteTone], 7, 0.22));
  s += put(150, 200, 0, 1, filler(36, 12, [skyTone, whiteTone], 9, 0.2));
  // bunga belakang -> depan
  s += put(60, 112, -12, 1, cosmos(26, g.warm));
  s += put(240, 112, 14, 1, cosmos(24, g.cool));
  s += put(112, 60, 6, 1, daisy(20, BLOOM.blush, BLOOM.butter, '#e39aae'));
  s += put(194, 58, -8, 1, daisy(19));
  s += put(150, 72, 10, 1, anemone(32));
  s += put(92, 156, -8, 1, peony(40, g.soft));
  s += put(208, 154, 10, 1, peony(38, g.cool));
  s += put(150, 130, 0, 1, rose(46, g.hero));
  s += put(112, 196, 20, 1, rose(26, g.warm));
  s += put(190, 198, -16, 1, rose(24, g.soft));
  s += put(150, 190, 0, 1, blossom(9, tone(BLOOM.butter, '#8a6a1c'), '#fff'));
  s += put(70, 160, 0, 1, blossom(8, lilacTone));
  s += put(232, 160, 0, 1, blossom(8, skyTone));
  return s;
}
export function bouquetStems(g: Garden = GARDEN) {
  let s = '';
  for (const [x, y] of [[96, 214], [124, 224], [150, 228], [176, 224], [204, 214]]) s += `<path d="M${x} ${y}Q${(x + 150) / 2} 300 150 352" fill="none" stroke="${g.leafDark}" stroke-width="5" stroke-linecap="round"/><path d="M${x} ${y}Q${(x + 150) / 2} 300 150 352" fill="none" stroke="${g.leaf}" stroke-width="2.4" stroke-linecap="round"/>`;
  return s;
}
// Kertas pembungkus: dua lembar membentuk kerucut (kiri/kanan), kotak yang sama (0 0 300 400).
export function paperLeft() {
  return `<path d="M72 238C100 252 128 256 150 258L150 396C142 396 134 394 128 388L84 300C74 280 68 258 72 238Z" fill="#fffdf8" stroke="#d9d0c2" stroke-width="1.4" stroke-linejoin="round"/><path d="M96 258L130 380" stroke="#e6ddcf" stroke-width="1"/><path d="M84 248L112 372" stroke="#efe7da" stroke-width="1"/>`;
}
export function paperRight() {
  return `<path d="M228 238C200 252 172 256 150 258L150 396C158 396 166 394 172 388L216 300C226 280 232 258 228 238Z" fill="#fbf6ec" stroke="#d9d0c2" stroke-width="1.4" stroke-linejoin="round"/><path d="M204 258L170 380" stroke="#e3d9c8" stroke-width="1"/><path d="M216 248L188 372" stroke="#ebe3d3" stroke-width="1"/>`;
}
export const ribbonColor = 'color-mix(in srgb, var(--s, #ef8fa8) 78%, #fff)';
export const ribbonDark = 'color-mix(in srgb, var(--s, #ef8fa8) 62%, #7a3350)';
export function ribbonBand() {
  return `<path d="M88 296Q150 316 212 296L208 316Q150 336 92 316Z" fill="${ribbonColor}" stroke="${ribbonDark}" stroke-opacity=".5" stroke-width="1"/>`;
}
export function ribbonBow() {
  return `<path d="M150 312C128 282 96 290 104 316C112 336 140 328 150 312Z" fill="${ribbonColor}" stroke="${ribbonDark}" stroke-opacity=".55" stroke-width="1.1" stroke-linejoin="round"/><path d="M150 312C172 282 204 290 196 316C188 336 160 328 150 312Z" fill="${ribbonColor}" stroke="${ribbonDark}" stroke-opacity=".55" stroke-width="1.1" stroke-linejoin="round"/><path d="M150 312C140 336 126 360 108 376L120 380L134 372L142 392Z" fill="${ribbonColor}" stroke="${ribbonDark}" stroke-opacity=".55" stroke-width="1.1" stroke-linejoin="round"/><path d="M150 312C160 336 174 360 192 376L180 380L166 372L158 392Z" fill="${ribbonColor}" stroke="${ribbonDark}" stroke-opacity=".55" stroke-width="1.1" stroke-linejoin="round"/><circle cx="150" cy="314" r="9" fill="${ribbonDark}" fill-opacity=".85"/>`;
}

// Ombak bunga untuk sapuan gerbang (kotak 0 0 400 100): dua baris bunga & daun di sepanjang garis bergelombang.
export function flowerBand(g: Garden = GARDEN) {
  let s = '';
  const xs = [14, 52, 90, 128, 166, 204, 242, 280, 318, 356, 394];
  xs.forEach((x, i) => {
    const y = 56 + Math.sin(i * 1.7) * 8;
    s += leaf(g, 40, 10, -40 + (i % 2) * 80, x - 10, y + 12);
    s += leaf(g, 34, 9, 200 + (i % 3) * 20, x + 8, y + 10);
  });
  xs.forEach((x, i) => {
    const y = 40 + Math.sin(i * 1.7) * 8;
    const kinds = [
      () => rose(24 + (i % 3) * 3, g.hero),
      () => peony(22, g.soft),
      () => cosmos(19, g.cool),
      () => anemone(20),
      () => daisy(17, BLOOM.blush, BLOOM.butter, '#e39aae'),
      () => cosmos(19, g.warm),
      () => peony(21, g.cool),
    ];
    s += put(x, y + 6, (i * 37) % 60, 1, kinds[i % kinds.length]!());
    if (i % 2 === 0) s += put(x + 19, y + 24, 0, 1, blossom(8, skyTone));
  });
  return s;
}

// Mahkota bunga di tepi lengkung foto: kotak lebar `w` x tinggi `h` (px), bunga disebar sepanjang setengah lingkaran atas dan sisi.
export function archCrown(w: number, h: number, g: Garden = GARDEN) {
  const cx = w / 2;
  const r = w / 2;
  let s = '';
  const pts: [number, number, number][] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 0.92 + (i / (n - 1)) * Math.PI * 1.16;
    pts.push([cx + Math.cos(a) * r, r + Math.sin(a) * r, (a * 180) / Math.PI + 90]);
  }
  pts.forEach(([x, y, ang]) => {
    s += leaf(g, 30, 8, ang - 34, x, y);
    s += leaf(g, 28, 7.5, ang + 134, x, y);
    s += leaf(g, 22, 6, ang + 90, x, y);
  });
  // bunga kecil di sela bunga besar
  for (let i = 0; i < n - 1; i++) {
    const a = Math.PI * 0.92 + ((i + 0.5) / (n - 1)) * Math.PI * 1.16;
    s += put(cx + Math.cos(a) * (r + 3), r + Math.sin(a) * (r + 3), 0, 1, blossom(6.4, i % 3 === 0 ? skyTone : i % 3 === 1 ? lilacTone : whiteTone));
  }
  pts.forEach(([x, y], i) => {
    const big = [18, 14, 15, 19, 22, 19, 15, 14, 18][i]!;
    const kinds = [
      () => peony(big, g.soft),
      () => cosmos(big, g.warm),
      () => daisy(big, BLOOM.blush, BLOOM.butter, '#e39aae'),
      () => anemone(big),
      () => rose(big, g.hero),
      () => anemone(big),
      () => cosmos(big, g.cool),
      () => daisy(big),
      () => peony(big, g.cool),
    ];
    s += put(x, y, i * 23, 1, kinds[i]!());
  });
  void h;
  return s;
}

// ----- karangan lingkaran untuk monogram (kotak -100 -100 200 200): 16 bunga & daun melingkar, terbuka lapang di tengah -----
export function wreath(g: Garden = GARDEN, seed = 5) {
  const rnd = rng(seed);
  const R = 70;
  let s = `<circle r="${R}" fill="none" stroke="${g.leafDark}" stroke-opacity=".35" stroke-width="1.2"/>`;
  const n = 16;
  // daun dulu (di belakang), searah putaran, berpasangan
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 - 90 + 360 / n / 2;
    const rad = (a * Math.PI) / 180;
    const x = Math.cos(rad) * R;
    const y = Math.sin(rad) * R;
    s += put(x, y, a + 90 + (i % 2 ? 28 : -28), 1, `<path d="${leafD(26, 7.5)}" fill="${g.leaf}" stroke="${g.leafDark}" stroke-opacity=".6" stroke-width=".6"/>`);
    s += put(x, y, a - 90 + (i % 2 ? -22 : 22), 1, `<path d="${leafD(22, 6.5)}" fill="${g.leafLight}" stroke="${g.leafDark}" stroke-opacity=".55" stroke-width=".5"/>`);
  }
  const kinds: ((r: number) => string)[] = [
    (r) => rose(r * 1.18, g.hero),
    (r) => cosmos(r * 0.9, g.cool),
    (r) => daisy(r * 0.82, BLOOM.blush, BLOOM.butter, '#e39aae'),
    (r) => peony(r * 1.05, g.soft),
    (r) => anemone(r * 0.88),
    (r) => cosmos(r * 0.9, g.warm),
    (r) => blossom(r * 0.5, skyTone),
    (r) => rose(r * 0.95, g.warm),
  ];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 - 90;
    const rad = (a * Math.PI) / 180;
    const k = kinds[i % kinds.length]!;
    const r = 15 + rnd() * 3;
    s += put(Math.cos(rad) * R, Math.sin(rad) * R, rnd() * 80, 1, k(r));
  }
  // bunga kecil menyembul di sela-sela bunga besar: bergantian di sisi luar dan dalam karangan
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * 360 - 90;
    const rad = (a * Math.PI) / 180;
    const rr = R + (i % 2 ? -17 : 17);
    s += put(Math.cos(rad) * rr, Math.sin(rad) * rr, 0, 1, blossom(i % 2 ? 4.6 : 5.4, i % 4 === 0 ? lilacTone : i % 4 === 1 ? skyTone : whiteTone));
  }
  return s;
}

// ----- untaian bunga ubin (tile 200 x 40, berulang horizontal): batang menjalar di y=20, bunga kecil & daun -----
export function garlandTile(g: Garden = GARDEN) {
  let s = `<path d="M0 21Q25 15 50 21T100 21T150 21T200 21" fill="none" stroke="${g.leafDark}" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>`;
  const leaves: [number, number, number, number][] = [[16, 20, -24, 19], [34, 20, 150, 18], [66, 21, -150, 20], [84, 20, 24, 22], [118, 21, -26, 20], [136, 20, 158, 18], [166, 20, -150, 20], [182, 21, 160, 15]];
  for (const [x, y, rot, L] of leaves) s += put(x, y, rot, 1, `<path d="${leafD(L, L * 0.3)}" fill="${g.leaf}" stroke="${g.leafDark}" stroke-opacity=".6" stroke-width=".5"/>`);
  s += put(40, 19, 14, 1, rose(11, g.hero));
  s += put(100, 20, 0, 1, cosmos(9, g.warm));
  s += put(160, 19, 8, 1, daisy(9, BLOOM.blush, BLOOM.butter, '#e39aae'));
  s += put(70, 26, 0, 1, blossom(4.6, skyTone));
  s += put(130, 25, 0, 1, blossom(4.6, lilacTone));
  s += put(10, 22, 0, 1, blossom(3.6, whiteTone));
  s += put(190, 22, 0, 1, blossom(3.6, skyTone));
  s += put(100, 20, 0, 1, '');
  return s;
}

// ----- bunga mini untuk ikon kutipan / pemisah kecil (kotak -40 -24 80 48): satu mawar + dua daun + bunga kecil -----
export function miniBloom(g: Garden = GARDEN) {
  let s = put(-4, 4, -152, 1, `<path d="${leafD(30, 8)}" fill="${g.leaf}" stroke="${g.leafDark}" stroke-opacity=".6" stroke-width=".6"/>`);
  s += put(4, 4, -28, 1, `<path d="${leafD(30, 8)}" fill="${g.leaf}" stroke="${g.leafDark}" stroke-opacity=".6" stroke-width=".6"/>`);
  s += put(-26, 6, 0, 1, cosmos(9, g.cool));
  s += put(26, 6, 0, 1, daisy(9, BLOOM.blush, BLOOM.butter, '#e39aae'));
  s += put(0, -2, 0, 1, rose(16, g.hero));
  return s;
}
