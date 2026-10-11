// Ornamen bunga & daun untuk tiga undangan musim: Musim Semi (sakura), Musim Gugur (maple, krisan, buah rosehip), dan Musim Dingin
// (kristal salju, bunga hellebore/snowdrop, ranting pinus, holly berbuah merah). Dibangkitkan secara prosedural menjadi potongan
// teks SVG (fungsi murni, deterministik; sama seperti flora-art.ts & botani-art.ts), lalu dipasang lewat dangerouslySetInnerHTML
// di season-parts.tsx. Warna utama mengikuti palet tema lewat var(--p)/var(--s); sengaja hemat simpul: satu bunga = 2-4 elemen
// (kelopak digabung dalam satu path), jadi satu sudut kurang dari ±150 simpul.
//
// Gambar dibuat sendiri dari bentuk botani umum, bukan salinan ilustrasi pihak lain.
import { put } from './flora-art';

export type Season = 'sakura' | 'autumn' | 'winter';

const f = (n: number) => (Math.round(n * 10) / 10).toString();
type P = [number, number];
const rot = ([x, y]: P, deg: number): P => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const pt = (p: P) => `${f(p[0])} ${f(p[1])}`;

// ----- warna (var tema + nilai bawaan) -----
const MIX = (v: string, d: string, pct: number, other: string) => `color-mix(in srgb, var(${v}, ${d}) ${pct}%, ${other})`;
const C = {
  sakura: {
    petal: MIX('--p', '#e88fb0', 40, '#fff'),
    inner: MIX('--p', '#e88fb0', 78, '#fff'),
    edge: MIX('--p', '#e88fb0', 82, '#7a2a4a'),
    stamen: '#e9a825',
    wood: '#6a4b3d',
    leaf: MIX('--s', '#9bc48f', 82, '#4a7a3f'),
    leafLight: MIX('--s', '#9bc48f', 60, '#fff'),
  },
  autumn: {
    a: 'var(--p, #b45309)',
    b: MIX('--p', '#b45309', 52, '#f0b429'),
    c: 'var(--s, #7c2d12)',
    gold: '#e9a825',
    wood: '#5a3a22',
    berry: '#c0392b',
    vein: MIX('--s', '#7c2d12', 70, '#2a1608'),
  },
  winter: {
    ice: 'var(--p, #4b7bb5)',
    frost: MIX('--p', '#4b7bb5', 55, '#fff'),
    pale: 'var(--s, #dbe9f7)',
    pine: '#3f6b5a',
    pineLight: '#6f9a86',
    berry: '#c0392b',
    gold: '#e9c35a',
  },
};

// ----- bentuk dasar -----

// Cincin kelopak (n buah) sebagai SATU path: tiap kelopak membulat menunjuk ke atas dari (0,0), dirotasi ke sekelilingnya.
function petalRing(n: number, r: number, off: number, notch = 0.15, wide = 0.8) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = off + (k * 360) / n;
    const pts: P[] = [
      [-r * 0.62, -r * 0.2],
      [-r * wide, -r * 0.95],
      [-r * notch, -r],
      [0, -r * (notch ? 0.86 : 1.02)],
      [r * notch, -r],
      [r * wide, -r * 0.95],
      [r * 0.62, -r * 0.2],
    ].map((p) => rot(p as P, a));
    const mid: P = notch ? rot([0, -r * 0.86], a) : rot([0, -r * 1.02], a);
    d += `M0 0C${pt(pts[0]!)} ${pt(pts[1]!)} ${pt(pts[2]!)}L${pt(mid)}L${pt(pts[4]!)}C${pt(pts[5]!)} ${pt(pts[6]!)} 0 0Z`;
  }
  return d;
}

// Garis memancar (untuk benang sari, krisan, kristal): dari jari-jari r0 ke r1, sebanyak n.
function rays(n: number, r0: number, r1: number, off = 0) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = ((off + (k * 360) / n) * Math.PI) / 180;
    d += `M${f(Math.sin(a) * r0)} ${f(-Math.cos(a) * r0)}L${f(Math.sin(a) * r1)} ${f(-Math.cos(a) * r1)}`;
  }
  return d;
}

// ----- sakura -----
function sakuraBlossom(r: number) {
  const c = C.sakura;
  return (
    `<path d="${petalRing(5, r, 0)}" fill="${c.petal}" stroke="${c.edge}" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round"/>` +
    `<path d="${petalRing(5, r * 0.5, 0, 0, 0.9)}" fill="${c.inner}" opacity=".7"/>` +
    `<path d="${rays(9, r * 0.1, r * 0.38, 10)}" stroke="${c.edge}" stroke-width=".7" stroke-linecap="round"/>` +
    `<circle r="${f(r * 0.1)}" fill="${c.stamen}"/>`
  );
}
function sakuraBud(r: number) {
  const c = C.sakura;
  return `<path d="M0 0C${f(-r * 0.7)} ${f(-r * 0.3)} ${f(-r * 0.6)} ${f(-r * 1.2)} 0 ${f(-r * 1.5)}C${f(r * 0.6)} ${f(-r * 1.2)} ${f(r * 0.7)} ${f(-r * 0.3)} 0 0Z" fill="${c.inner}" stroke="${c.edge}" stroke-opacity=".5" stroke-width=".5"/><path d="M-1.4 0C-3 2 0 3.200 1.400 0Z" fill="${c.wood}"/>`;
}
const smallLeaf = (L: number, fill: string, vein: string) => `<path d="M0 0C${f(L * 0.25)} ${f(-L * 0.32)} ${f(L * 0.75)} ${f(-L * 0.3)} ${f(L)} 0C${f(L * 0.75)} ${f(L * 0.3)} ${f(L * 0.25)} ${f(L * 0.32)} 0 0Z" fill="${fill}" stroke="${vein}" stroke-opacity=".5" stroke-width=".4"/>`;

function sakuraCorner() {
  const c = C.sakura;
  let s = `<path d="M-6 20C30 2 62 44 104 30S150 30 170 50M16 -6C40 30 0 66 20 104S40 140 30 170" fill="none" stroke="${c.wood}" stroke-width="3.2" stroke-linecap="round"/>`;
  s += `<path d="M52 24C58 44 72 52 90 54M14 60C34 58 50 68 56 88M104 30C116 14 132 14 150 20M20 104C36 100 46 112 54 126M40 8C46 18 62 20 70 14" fill="none" stroke="${c.wood}" stroke-width="1.8" stroke-linecap="round"/>`;
  const leaves: [number, number, number][] = [[44, 22, 40], [78, 30, 70], [118, 28, -40], [22, 80, 110], [24, 130, 80], [64, 70, 20], [34, 46, 150]];
  for (const [x, y, a] of leaves) s += put(x, y, a, 1, smallLeaf(14, c.leaf, c.wood));
  const buds: [number, number, number, number][] = [[96, 52, 130, 6], [62, 90, 160, 6], [54, 128, 120, 5], [142, 26, 80, 5], [10, 100, 20, 5]];
  for (const [x, y, a, r] of buds) s += put(x, y, a, 1, sakuraBud(r));
  const flowers: [number, number, number, number][] = [[28, 28, 16, 8], [60, 28, 12, 40], [96, 38, 10, 20], [128, 38, 8, 0], [24, 62, 12, 30], [34, 96, 9, 12], [40, 132, 7, 0], [54, 56, 9, 50], [84, 56, 7, 12]];
  for (const [x, y, r, a] of flowers) s += put(x, y, a, 1, sakuraBlossom(r));
  // kelopak lepas
  for (const [x, y, a] of [[110, 70, 30], [74, 104, -40], [150, 70, 60]] as [number, number, number][]) s += put(x, y, a, 1, `<path d="M0 0C-3-3-3-8 0-9C3-8 3-3 0 0Z" fill="${c.petal}" opacity=".85"/>`);
  return s;
}

// ----- gugur -----
const MAPLE = 'M0-12L2.6-6.6 7-8.4 5.8-3 11.4-4.2 7.8.6 10.8 3.6 5 3.8 5.4 7.8.8 6 0 12-.8 6-5.4 7.8-5 3.8-10.8 3.6-7.8.6-11.4-4.2-5.8-3-7-8.4-2.6-6.6Z';
function maple(r: number, fill: string) {
  const c = C.autumn;
  return `<g transform="scale(${f(r / 12)})"><path d="${MAPLE}" fill="${fill}" stroke="${c.vein}" stroke-opacity=".6" stroke-width=".7" stroke-linejoin="round"/><path d="M0-9V16M0 2L-6-3M0 2L6-3M0-3L-3-7M0-3L3-7" fill="none" stroke="${c.vein}" stroke-opacity=".55" stroke-width=".6" stroke-linecap="round"/></g>`;
}
// Krisan: tiga lingkar kelopak sempit (garis tebal berujung bulat) + pusat.
function mum(r: number, tone: string) {
  const c = C.autumn;
  return (
    `<path d="${rays(16, r * 0.45, r, 0)}" stroke="${tone}" stroke-width="${f(r * 0.2)}" stroke-linecap="round"/>` +
    `<path d="${rays(12, r * 0.25, r * 0.72, 15)}" stroke="${c.gold}" stroke-width="${f(r * 0.18)}" stroke-linecap="round"/>` +
    `<path d="${rays(8, 0, r * 0.4, 22)}" stroke="${c.a}" stroke-width="${f(r * 0.16)}" stroke-linecap="round"/>` +
    `<circle r="${f(r * 0.1)}" fill="${c.vein}"/>`
  );
}
function berries(n: number, r: number) {
  const c = C.autumn;
  let s = `<path d="M0 0Q${f(r * 2)} ${f(-r * 1.2)} ${f(r * 4.4)} ${f(-r * 0.4)}" fill="none" stroke="${c.wood}" stroke-width="1" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) s += `<circle cx="${f(r * (1.2 + i * 1.4))}" cy="${f(-r * (0.2 + (i % 2) * 1.05))}" r="${f(r * 0.62)}" fill="${c.berry}" stroke="#7a1f14" stroke-opacity=".5" stroke-width=".4"/>`;
  return s;
}
function autumnCorner() {
  const c = C.autumn;
  let s = `<path d="M-6 14C46 10 100 22 160 40M10 -6C12 44 20 96 32 160" fill="none" stroke="${c.wood}" stroke-width="2.6" stroke-linecap="round"/>`;
  const fills = [c.a, c.b, c.c];
  const leaves: [number, number, number, number, number][] = [[24, 24, -20, 24, 0], [62, 18, 30, 16, 1], [100, 32, 70, 14, 2], [20, 64, -60, 17, 1], [32, 100, -100, 14, 0], [54, 54, 10, 16, 2], [134, 46, 50, 11, 1], [28, 138, -130, 11, 2], [84, 70, 100, 12, 0]];
  for (const [x, y, a, r, k] of leaves) s += put(x, y, a, 1, maple(r, fills[k]!));
  s += put(46, 36, 0, 1, mum(14, c.b));
  s += put(78, 44, 0, 1, mum(9, c.c));
  s += put(40, 76, 0, 1, mum(10, c.gold));
  s += put(100, 48, 20, 1, berries(3, 4));
  s += put(30, 112, -80, 1, berries(3, 4));
  return s;
}

// ----- salju -----
function snowflake(r: number) {
  const c = C.winter;
  let d = rays(6, 0, r);
  for (let k = 0; k < 6; k++) {
    for (const t of [0.46, 0.72]) {
      for (const side of [-1, 1]) {
        const base = rot([0, -r * t], k * 60);
        const tip = rot([side * r * 0.2 * (1.1 - t * 0.35), -r * t - r * 0.16], k * 60);
        d += `M${pt(base)}L${pt(tip)}`;
      }
    }
  }
  return `<path d="${d}" stroke="${c.ice}" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" fill="none"/><circle r="${f(r * 0.1)}" fill="#fff" stroke="${c.frost}" stroke-width=".6"/>`;
}
// Hellebore (mawar Natal): lima kelopak bulat putih berurat biru, pusat benang sari kuning.
function hellebore(r: number) {
  const c = C.winter;
  return (
    `<path d="${petalRing(5, r, 0, 0, 0.95)}" fill="#fff" stroke="${c.frost}" stroke-width=".8" stroke-linejoin="round"/>` +
    `<path d="${petalRing(5, r * 0.55, 36, 0, 0.9)}" fill="${c.pale}" opacity=".85"/>` +
    `<path d="${rays(14, r * 0.12, r * 0.34, 5)}" stroke="${c.gold}" stroke-width=".9" stroke-linecap="round"/>` +
    `<circle r="${f(r * 0.1)}" fill="${c.gold}"/>`
  );
}
function pine(len: number) {
  const c = C.winter;
  let d = '';
  for (let i = 1; i <= 9; i++) {
    const x = (len * i) / 10;
    const L = 9 * (1 - i / 16);
    d += `M${f(x)} 0L${f(x + L * 0.5)} ${f(-L)}M${f(x)} 0L${f(x + L * 0.5)} ${f(L)}`;
  }
  return `<path d="M0 0H${len}" stroke="${c.pine}" stroke-width="1.4" stroke-linecap="round"/><path d="${d}" stroke="${c.pine}" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${c.pineLight}" stroke-width=".6" stroke-linecap="round" fill="none" opacity=".8"/>`;
}
function holly(r: number) {
  const c = C.winter;
  // Daun holly: tepi bergelombang dengan ujung runcing bergantian (pangkal di 0,0, ujung di L,0).
  const L = r * 1.3;
  const W = r * 0.42;
  const n = 9;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const prof = W * Math.pow(Math.sin(Math.PI * t), 0.75) * (i % 2 ? 1.28 : 0.74);
    top.push(`${f(L * t)} ${f(-prof)}`);
    bot.push(`${f(L * t)} ${f(prof)}`);
  }
  const leaf = `M0 0L${top.join('L')}L${f(L)} 0L${bot.reverse().join('L')}Z`;
  const one = (a: number) => put(0, 0, a, 1, `<path d="${leaf}" fill="${c.pine}" stroke="#2c4a3e" stroke-opacity=".7" stroke-width=".6" stroke-linejoin="round"/><path d="M0 0H${f(L * 0.92)}" stroke="${c.pineLight}" stroke-width=".7"/>`);
  const berry = (x: number, y: number, k: number) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * k)}" fill="${c.berry}" stroke="#7a1f14" stroke-opacity=".5" stroke-width=".4"/>`;
  return one(-40) + one(40) + one(0) + berry(r * 0.1, -r * 0.14, 0.27) + berry(-r * 0.12, r * 0.14, 0.25) + berry(r * 0.2, r * 0.16, 0.22);
}
function winterCorner() {
  let s = '';
  s += put(4, 4, 0, 1, pine(130));
  s += put(4, 4, 90, 1, pine(130));
  s += put(60, 60, 45, 1, holly(26));
  for (const [x, y, r, a] of [[46, 40, 14, 0], [82, 34, 10, 20], [36, 80, 10, 40], [112, 22, 7, 0], [20, 112, 7, 10]] as [number, number, number, number][]) s += put(x, y, a, 1, hellebore(r));
  for (const [x, y, r] of [[22, 22, 18], [74, 14, 10], [14, 74, 10], [100, 60, 8], [58, 100, 8], [130, 30, 6], [30, 130, 6]] as [number, number, number][]) s += put(x, y, 15, 1, snowflake(r));
  s += `<path d="M96 88h.1M72 76h.1M118 46h.1M46 118h.1M142 54h.1M54 142h.1" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  return s;
}

export function seasonCorner(season: Season) {
  return season === 'sakura' ? sakuraCorner() : season === 'autumn' ? autumnCorner() : winterCorner();
}

// ----- pemisah (kotak 0 0 240 40) -----
export function seasonDivider(season: Season) {
  const mid = 120;
  if (season === 'sakura') {
    const c = C.sakura;
    let s = `<path d="M8 22Q64 12 112 22M128 22Q176 12 232 22" fill="none" stroke="${c.wood}" stroke-width="1.4" stroke-linecap="round"/>`;
    for (const [x, y, a] of [[44, 17, 20], [84, 20, -30], [156, 20, 30], [196, 17, -20]] as [number, number, number][]) s += put(x, y, a, 1, smallLeaf(12, c.leaf, c.wood));
    for (const [x, y, r] of [[26, 18, 7], [64, 17, 6], [176, 17, 6], [214, 18, 7]] as [number, number, number][]) s += put(x, y, 0, 1, sakuraBlossom(r));
    s += put(mid, 21, 0, 1, sakuraBlossom(13));
    s += put(98, 24, 20, 1, sakuraBlossom(7)) + put(142, 24, -20, 1, sakuraBlossom(7));
    return s;
  }
  if (season === 'autumn') {
    const c = C.autumn;
    let s = `<path d="M8 22Q64 14 108 22M132 22Q176 14 232 22" fill="none" stroke="${c.wood}" stroke-width="1.3" stroke-linecap="round"/>`;
    for (const [x, y, a, r, k] of [[30, 17, -25, 10, 1], [66, 20, 30, 8, 2], [174, 20, -30, 8, 2], [210, 17, 25, 10, 1], [96, 18, 60, 7, 0], [144, 18, -60, 7, 0]] as [number, number, number, number, number][]) s += put(x, y, a, 1, maple(r, [c.a, c.b, c.c][k]!));
    s += put(mid, 20, 0, 1, mum(12, c.b));
    s += put(52, 22, 0, 1, berries(2, 3.4)) + put(188, 22, 180, 1, berries(2, 3.4));
    return s;
  }
  const c = C.winter;
  let s = `<path d="M8 20H92M148 20H232" stroke="${c.frost}" stroke-width="1" stroke-linecap="round"/>`;
  s += put(mid, 20, 0, 1, hellebore(12));
  s += put(86, 20, 0, 1, snowflake(8)) + put(154, 20, 0, 1, snowflake(8));
  s += put(60, 20, 0, 1, snowflake(5)) + put(180, 20, 0, 1, snowflake(5));
  s += put(30, 20, 0, 1, holly(9)) + put(210, 20, 180, 1, holly(9));
  return s;
}

// ----- ranting kecil (kotak 0 0 130 70): di kaki foto & footer -----
export function seasonSprig(season: Season) {
  if (season === 'sakura') {
    const c = C.sakura;
    let s = `<path d="M4 62C34 60 70 44 118 14" fill="none" stroke="${c.wood}" stroke-width="2" stroke-linecap="round"/>`;
    s += put(30, 54, 40, 1, smallLeaf(12, c.leaf, c.wood)) + put(60, 42, -30, 1, smallLeaf(11, c.leaf, c.wood));
    for (const [x, y, r] of [[22, 54, 8], [56, 44, 10], [88, 30, 9], [114, 16, 8]] as [number, number, number][]) s += put(x, y, x, 1, sakuraBlossom(r));
    s += put(74, 40, 130, 1, sakuraBud(5));
    return s;
  }
  if (season === 'autumn') {
    const c = C.autumn;
    let s = `<path d="M4 62C34 60 70 44 118 14" fill="none" stroke="${c.wood}" stroke-width="2" stroke-linecap="round"/>`;
    for (const [x, y, a, r, k] of [[22, 54, -30, 12, 0], [52, 46, 20, 10, 1], [84, 30, 60, 10, 2], [108, 20, 30, 8, 0]] as [number, number, number, number, number][]) s += put(x, y, a, 1, maple(r, [c.a, c.b, c.c][k]!));
    s += put(70, 50, 0, 1, berries(3, 4));
    return s;
  }
  const c = C.winter;
  let s = put(4, 62, -26, 1, pine(116));
  s += put(60, 38, 30, 1, holly(14));
  s += put(96, 24, 0, 1, hellebore(9)) + put(20, 50, 0, 1, snowflake(8));
  void c;
  return s;
}

// ----- mahkota bingkai foto lengkung (kotak lebar w x tinggi h) -----
export function seasonCrown(season: Season, w: number, h: number) {
  void h;
  const cx = w / 2;
  const r = w / 2;
  // Dua lapis: bunga/daun besar di sepanjang lengkung (13 titik, sampai sepertiga bawah sisi) + isian kecil di sela-selanya, lebih ke luar.
  const n = 13;
  const at = (i: number, k: number, extra = 0): [number, number, number] => {
    const a = Math.PI * 0.84 + (i / (n - 1)) * Math.PI * 1.32 + k * (Math.PI * 1.32) / (n - 1);
    return [cx + Math.cos(a) * (r + extra), r + Math.sin(a) * (r + extra), (a * 180) / Math.PI + 90];
  };
  const big = Array.from({ length: n }, (_, i) => at(i, 0));
  const fill = Array.from({ length: n - 1 }, (_, i) => at(i, 0.5, 7));
  const cyc = <T,>(list: T[], i: number) => list[i % list.length]!;
  let s = '';
  if (season === 'sakura') {
    const c = C.sakura;
    const first = big[0]!;
    const last = big[n - 1]!;
    s += `<path d="M${f(first[0])} ${f(first[1])}A${f(r)} ${f(r)} 0 1 1 ${f(last[0])} ${f(last[1])}" fill="none" stroke="${c.wood}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`;
    big.forEach(([x, y, a], i) => { s += put(x, y, a + (i % 2 ? 120 : -120), 1, smallLeaf(18, c.leaf, c.wood)); });
    fill.forEach(([x, y, a], i) => { s += put(x, y, a + 180, 1, i % 2 ? sakuraBud(6) : smallLeaf(11, c.leafLight, c.wood)); });
    big.forEach(([x, y], i) => { s += put(x, y, i * 31, 1, sakuraBlossom(cyc([15, 19, 13, 20, 16, 21, 14], i))); });
    fill.forEach(([x, y], i) => { if (i % 2 === 0) s += put(x, y, i * 47, 1, sakuraBlossom(cyc([8, 10, 7], i))); });
  } else if (season === 'autumn') {
    const c = C.autumn;
    const tones = [c.a, c.b, c.c];
    big.forEach(([x, y, a], i) => { s += put(x, y, a + (i % 2 ? 70 : -70), 1, maple(cyc([20, 16, 18, 22, 17, 21, 16], i), tones[i % 3]!)); });
    fill.forEach(([x, y, a], i) => { s += i % 3 === 0 ? put(x, y, a, 1, berries(2, 3.6)) : put(x, y, a + 90, 1, maple(cyc([10, 12], i), tones[(i + 1) % 3]!)); });
    big.forEach(([x, y], i) => { if (i % 2 === 0) s += put(x, y, 0, 1, mum(cyc([12, 14, 11, 15], i / 2), i % 4 ? c.gold : c.b)); });
  } else {
    const c = C.winter;
    big.forEach(([x, y, a], i) => { s += put(x, y, a - 90 + (i % 2 ? 26 : -26), 1, pine(i % 2 ? 30 : 26)); });
    fill.forEach(([x, y], i) => { s += put(x, y, i * 20, 1, snowflake(cyc([7, 9, 6], i))); });
    big.forEach(([x, y], i) => { s += put(x, y, i * 20, 1, i % 3 === 1 ? snowflake(15) : hellebore(cyc([13, 16, 12, 17, 14], i))); });
    big.forEach(([x, y, a], i) => { if (i === 2 || i === 6 || i === 10) s += put(x, y, a, 1, holly(14)); });
    void c;
  }
  return s;
}
