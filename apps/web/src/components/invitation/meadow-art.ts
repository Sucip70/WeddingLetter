// Ornamen tiga undangan berwarna dominan: Lavender (ungu), Hortensia (biru), dan Marigold (oranye).
// Bunga digambar prosedural menjadi potongan teks SVG (fungsi murni, deterministik; pola sama dengan season-art.ts): dahlia,
// anemon, hortensia, marigold, poppy, forget-me-not, lavender, beri, kuncup, dan gypsophila. Ranting SELALU berjalan sejajar
// bingkai (horizontal atau vertikal) dengan tunas pendek di kedua sisi, bukan menjulur diagonal; klaster bunga terbesar ada di
// sudut dan mengecil ke ujung. Warna bunga utama mengikuti palet tema lewat var(--p)/var(--s), jadi tiap palet mengubah suasananya.
//
// Gambar dibuat sendiri dari bentuk botani umum, bukan salinan ilustrasi pihak lain.
import { gypsophila, leafD, put, rng } from './flora-art';

// Tiga desain berwarna dominan + tiga desain musim (sakura = Musim Semi, autumn = Musim Gugur, winter = Musim Dingin).
export type Meadow = 'lavender' | 'hortensia' | 'marigold' | 'sakura' | 'autumn' | 'winter';

const f = (n: number) => (Math.round(n * 10) / 10).toString();
type P = [number, number];
const rot = ([x, y]: P, deg: number): P => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};

// ----- warna -----
interface T {
  light: string;
  base: string;
  dark: string;
  deep: string;
}
// Nada warna dipasang sekali di elemen <svg> sebagai variabel CSS (meadowVars) supaya potongan SVG tidak mengulang ekspresi
// color-mix panjang di setiap kelopak (ukuran HTML ±3x lebih kecil).
const tv = (k: string): T => ({ light: `var(--m${k}l)`, base: `var(--m${k}b)`, dark: `var(--m${k}d)`, deep: `var(--m${k}k)` });
const tnVars = (k: string, c: string, shadow: string): Record<string, string> => ({
  [`--m${k}l`]: `color-mix(in srgb, ${c} 55%, #fff)`,
  [`--m${k}b`]: c,
  [`--m${k}d`]: `color-mix(in srgb, ${c} 80%, ${shadow})`,
  [`--m${k}k`]: `color-mix(in srgb, ${c} 56%, ${shadow})`,
});
const mix = (v: string, d: string, pct: number, other = '#fff') => `color-mix(in srgb, var(${v}, ${d}) ${pct}%, ${other})`;

type Kind = 'dahlia' | 'anemone' | 'hydra' | 'marigold' | 'poppy' | 'forget' | 'lav' | 'berry' | 'bud' | 'gyp' | 'blossom' | 'sakura' | 'mum' | 'maple' | 'hellebore' | 'flake' | 'pine';
interface Cfg {
  vars: Record<string, string>;
  hero: T;
  soft: T;
  pale: T;
  red: T;
  centre: string;
  leaf: string;
  leafDark: string;
  leafLight: string;
  stem: string;
  berry: string;
  focal: Kind[];
  fill: Kind[];
  seed: number;
  // Susunan ornamen (tiap desain berbeda): edge = ranting sepanjang tepi bingkai, twig = ranting tipis gelap dengan bunga mungil dan kepala hortensia di sudut,
  // garland = untaian girlan bunga yang menjuntai.
  comp: 'edge' | 'twig' | 'garland';
}
const CFG: Record<Meadow, Cfg> = {
  lavender: {
    vars: { ...tnVars('h', mix('--p', '#6d4aa6', 60), '#2a1445'), ...tnVars('s', mix('--s', '#c4aef0', 85), '#2a1445'), ...tnVars('p', '#f4eefc', '#4a3a70'), ...tnVars('r', '#9a5bbf', '#2a1445') },
    hero: tv('h'),
    soft: tv('s'),
    pale: tv('p'),
    red: tv('r'),
    centre: '#2b2048',
    leaf: '#86a38c',
    leafDark: '#5f7f68',
    leafLight: '#b4cbb8',
    stem: '#6f8f76',
    berry: '#6d3f8c',
    focal: ['dahlia', 'anemone', 'hydra', 'dahlia'],
    fill: ['lav', 'forget', 'lav', 'gyp', 'bud', 'berry'],
    seed: 17,
    comp: 'edge',
  },
  hortensia: {
    vars: { ...tnVars('h', mix('--p', '#0f8a9c', 52, '#27d6dc'), '#0a2a3a'), ...tnVars('s', mix('--s', '#6fd4e0', 80, '#bff4f4'), '#0a2a3a'), ...tnVars('p', '#f1fbfc', '#2a5a70'), ...tnVars('r', '#1f4a8f', '#0a1a3a') },
    hero: tv('h'),
    soft: tv('s'),
    pale: tv('p'),
    red: tv('r'),
    centre: '#12304a',
    leaf: '#5f9aa0',
    leafDark: '#3f6f78',
    leafLight: '#9cc7c9',
    stem: '#3a4a66',
    berry: '#1d3f7a',
    focal: ['hydra', 'hydra', 'anemone', 'hydra'],
    fill: ['forget', 'forget', 'berry', 'forget', 'bud'],
    seed: 29,
    comp: 'twig',
  },
  marigold: {
    vars: { ...tnVars('h', mix('--p', '#e0701c', 88), '#4a1a05'), ...tnVars('s', mix('--s', '#f6b83a', 92), '#4a1a05'), ...tnVars('p', '#fff3dc', '#8a5a20'), ...tnVars('r', '#d4492a', '#4a1a05') },
    hero: tv('h'),
    soft: tv('s'),
    pale: tv('p'),
    red: tv('r'),
    centre: '#3a1d12',
    leaf: '#7f9459',
    leafDark: '#5d7340',
    leafLight: '#a9b97f',
    stem: '#6d7f4a',
    berry: '#c4452d',
    focal: ['marigold', 'dahlia', 'poppy', 'marigold'],
    fill: ['berry', 'blossom', 'bud', 'gyp', 'forget', 'berry'],
    seed: 41,
    comp: 'garland',
  },
  sakura: {
    vars: { ...tnVars('h', mix('--p', '#e88fb0', 72), '#6a1f3a'), ...tnVars('s', mix('--p', '#e88fb0', 38), '#6a1f3a'), ...tnVars('p', '#fff5f8', '#8a5a70'), ...tnVars('r', '#c2527a', '#4a1030') },
    hero: tv('h'),
    soft: tv('s'),
    pale: tv('p'),
    red: tv('r'),
    centre: '#8a3a5a',
    leaf: '#8fbf8a',
    leafDark: '#6fa56f',
    leafLight: '#b5d8ae',
    stem: '#6a4b3d',
    berry: '#c2527a',
    focal: ['sakura', 'sakura', 'blossom', 'sakura'],
    fill: ['bud', 'sakura', 'bud', 'forget'],
    seed: 53,
    comp: 'edge',
  },
  autumn: {
    vars: { ...tnVars('h', mix('--p', '#b45309', 92, '#f0b429'), '#3a1604'), ...tnVars('s', mix('--s', '#7c2d12', 55, '#e9a825'), '#3a1604'), ...tnVars('p', '#fff1d6', '#8a5a20'), ...tnVars('r', '#a8321a', '#3a0e04') },
    hero: tv('h'),
    soft: tv('s'),
    pale: tv('p'),
    red: tv('r'),
    centre: '#3a1d12',
    leaf: '#c2692a',
    leafDark: '#a8481f',
    leafLight: '#d9a03a',
    stem: '#5a3a22',
    berry: '#c0392b',
    focal: ['mum', 'maple', 'dahlia', 'mum'],
    fill: ['berry', 'maple', 'bud', 'maple'],
    seed: 67,
    comp: 'edge',
  },
  winter: {
    vars: { ...tnVars('h', mix('--p', '#4b7bb5', 75), '#0e2036'), ...tnVars('s', mix('--s', '#8fb4de', 75), '#0e2036'), ...tnVars('p', '#ffffff', '#5a7a9a'), ...tnVars('r', '#c0392b', '#4a0e08') },
    hero: tv('h'),
    soft: tv('s'),
    pale: tv('p'),
    red: tv('r'),
    centre: '#c9a227',
    leaf: '#4f8a72',
    leafDark: '#3f6b5a',
    leafLight: '#6f9a86',
    stem: '#4b5d52',
    berry: '#c0392b',
    focal: ['hellebore', 'flake', 'hellebore', 'flake'],
    fill: ['berry', 'pine', 'flake', 'pine', 'bud'],
    seed: 79,
    comp: 'edge',
  },
};

// Variabel CSS nada warna untuk elemen <svg> yang memuat potongan gambar jenis `v`.
export const meadowVars = (v: Meadow): Record<string, string> => CFG[v].vars;

// ----- bentuk dasar -----

// n kelopak sebagai SATU path (hemat simpul). Kelopak menunjuk ke atas dari (cx,cy), dirotasi ke sekelilingnya.
// pointed = kelopak runcing (dahlia, hortensia); selain itu membulat dengan lekukan kecil di ujung.
function layer(n: number, L: number, W: number, off: number, pointed: boolean | 'notch' = false, cx = 0, cy = 0) {
  // Kelopak kecil cukup berkoordinat bulat (jauh lebih pendek tanpa beda terlihat).
  const q = L < 13 ? 1 : 10;
  const f = (v: number) => (Math.round(v * q) / q).toString();
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = off + (k * 360) / n;
    const p = (x: number, y: number) => {
      const r = rot([x, y], a);
      return `${f(r[0] + cx)} ${f(r[1] + cy)}`;
    };
    d += pointed === true
      ? `M${f(cx)} ${f(cy)}C${p(-W, -L * 0.3)} ${p(-W * 0.7, -L * 0.8)} ${p(0, -L)}C${p(W * 0.7, -L * 0.8)} ${p(W, -L * 0.3)} ${f(cx)} ${f(cy)}Z`
      : `M${f(cx)} ${f(cy)}C${p(-W, -L * 0.25)} ${p(-W * 1.05, -L * 0.85)} ${p(-W * 0.25, -L * 0.98)}${pointed === 'notch' ? `L${p(0, -L * 0.86)}L${p(W * 0.25, -L * 0.98)}` : `Q${p(0, -L * 1.05)} ${p(W * 0.25, -L * 0.98)}`}C${p(W * 1.05, -L * 0.85)} ${p(W, -L * 0.25)} ${f(cx)} ${f(cy)}Z`;
  }
  return d;
}
// Garis memancar dari jari-jari r0 ke r1 (benang sari).
function rays(n: number, r0: number, r1: number, off = 0) {
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = ((off + (k * 360) / n) * Math.PI) / 180;
    d += `M${f(Math.sin(a) * r0)} ${f(-Math.cos(a) * r0)}L${f(Math.sin(a) * r1)} ${f(-Math.cos(a) * r1)}`;
  }
  return d;
}
const path = (d: string, fill: string, stroke: string, op = 0.4, w = 0.5) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-opacity="${op}" stroke-width="${w}" stroke-linejoin="round"/>`;

// ----- bunga (pusat di 0,0; jari-jari ~ r) -----

// Dahlia: lima lapis kelopak runcing, dari luar (terang, panjang) ke dalam (gelap, pendek).
function dahlia(r: number, t: T) {
  const rows: [number, number, number, number, string][] = [[15, 1, 0.2, 0, t.light], [14, 0.86, 0.19, 12, t.light], [12, 0.7, 0.18, 5, t.base], [10, 0.54, 0.17, 14, t.base], [8, 0.38, 0.16, 8, t.dark]];
  let s = `<circle r="${f(r * 1.02)}" fill="${t.deep}" opacity=".14"/>`;
  const small = r < 11;
  for (const [n, h, w, off, fill] of small ? rows.slice(0, 4) : rows) s += path(layer(small ? Math.ceil(n * 0.7) : n, r * h, r * w * (small ? 1.3 : 1), off, true), fill, t.deep, 0.35);
  return s + `<circle r="${f(r * 0.07)}" fill="${t.deep}"/>`;
}
function anemone(r: number, petal: T, centre: string) {
  return (
    path(layer(7, r, r * 0.44, 6), petal.light, petal.dark, 0.7, 0.8) +
    `<circle r="${f(r * 0.55)}" fill="${petal.base}" fill-opacity=".35"/>` +
    `<path d="${rays(26, r * 0.2, r * 0.36)}" stroke="${centre}" stroke-width=".7" stroke-linecap="round"/>` +
    `<circle r="${f(r * 0.22)}" fill="${centre}"/><circle r="${f(r * 0.1)}" fill="#000" fill-opacity=".45"/>`
  );
}
// Hortensia: gugusan floret empat kelopak, digabung per warna.
function hydra(r: number, t: T, seed: number) {
  const rnd = rng(seed);
  const tones = [t.light, t.base, t.dark];
  const groups: string[] = ['', '', ''];
  const pts: [number, number][] = [];
  const count = r < 11 ? 8 : 15;
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.74;
    pts.push([Math.cos(a) * d, Math.sin(a) * d * 0.92]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  let dots = '';
  pts.forEach(([x, y], i) => {
    const k = (i + Math.floor(rnd() * 3)) % 3;
    groups[k] += layer(4, r * 0.42, r * 0.3, rnd() * 90, true, x, y);
    dots += `M${f(x)} ${f(y)}h.1`;
  });
  return groups.map((d, i) => path(d, tones[i]!, t.deep, 0.35, 0.4)).join('') + `<path d="${dots}" stroke="#f6efc2" stroke-width="${f(r * 0.07)}" stroke-linecap="round"/>`;
}
// Marigold: lima lapis kelopak membulat berumbai, oranye ke kuning.
function marigold(r: number, t: T, t2: T) {
  const rows: [number, number, number, number, string][] = [[17, 1, 0.3, 0, t.base], [15, 0.82, 0.3, 9, t2.base], [12, 0.64, 0.28, 4, t.base], [9, 0.46, 0.26, 16, t2.light], [7, 0.3, 0.22, 8, t.dark]];
  let s = `<circle r="${f(r * 1.02)}" fill="${t.deep}" opacity=".14"/>`;
  const small = r < 11;
  for (const [n, h, w, off, fill] of small ? rows.slice(0, 4) : rows) s += path(layer(small ? Math.ceil(n * 0.7) : n, r * h, r * w, off), fill, t.deep, 0.4);
  return s + `<circle r="${f(r * 0.08)}" fill="${t.deep}"/>`;
}
function poppy(r: number, t: T) {
  return (
    `<circle r="${f(r * 1.02)}" fill="${t.deep}" opacity=".14"/>` +
    path(layer(4, r, r * 0.95, 20), t.light, t.deep, 0.4) +
    path(layer(4, r * 0.74, r * 0.8, 65), t.base, t.deep, 0.4) +
    `<path d="${rays(14, r * 0.2, r * 0.38)}" stroke="#2b1f2b" stroke-width=".8" stroke-linecap="round"/><circle r="${f(r * 0.2)}" fill="#2b1f2b"/>`
  );
}
function forget(r: number, t: T) {
  return path(layer(5, r * 0.6, r * 0.42, 0), t.light, t.deep, 0.5) + `<circle r="${f(r * 0.2)}" fill="#f4d03f"/>`;
}
// Lavender: batang + floret berpasangan; menunjuk ke +x (panjang len).
function lavender(len: number, t: T, stem: string) {
  const n = 9;
  let a = '';
  let b = '';
  for (let i = 0; i < n; i++) {
    const x = len * (0.28 + (0.72 * i) / n);
    const s = len * 0.06 * (1 - i / (n * 1.6));
    const ell = (cy: number) => `M${f(x - s * 0.5)} ${f(cy)}a${f(s * 0.5)} ${f(s)} 0 1 0 ${f(s)} 0a${f(s * 0.5)} ${f(s)} 0 1 0 ${f(-s)} 0`;
    if (i % 2) b += ell(-s * 0.9) + ell(s * 0.9);
    else a += ell(-s * 0.9) + ell(s * 0.9);
  }
  return `<path d="M0 0Q${f(len * 0.5)} ${f(-len * 0.04)} ${f(len)} 0" fill="none" stroke="${stem}" stroke-width="1" stroke-linecap="round"/>` + path(a, t.base, t.deep, 0.4) + path(b, t.light, t.deep, 0.4) + `<ellipse cx="${f(len * 1.02)}" rx="${f(len * 0.05)}" ry="${f(len * 0.03)}" fill="${t.light}"/>`;
}
function berries(r: number, c: string, stem: string) {
  let s = `<path d="M0 0Q${f(r * 2)} ${f(-r * 1.2)} ${f(r * 4.4)} ${f(-r * 0.4)}" fill="none" stroke="${stem}" stroke-width="1" stroke-linecap="round"/>`;
  for (let i = 0; i < 3; i++) s += `<circle cx="${f(r * (1.2 + i * 1.4))}" cy="${f(-r * (0.2 + (i % 2) * 1.05))}" r="${f(r * 0.62)}" fill="${c}" stroke="#000" stroke-opacity=".25" stroke-width=".4"/><circle cx="${f(r * (1.2 + i * 1.4) - r * 0.2)}" cy="${f(-r * (0.2 + (i % 2) * 1.05) - r * 0.2)}" r="${f(r * 0.17)}" fill="#fff" fill-opacity=".55"/>`;
  return s;
}
function bud(r: number, t: T, green: string) {
  return `<path d="M0 0C${f(-r * 0.7)} ${f(-r * 0.3)} ${f(-r * 0.6)} ${f(-r * 1.2)} 0 ${f(-r * 1.5)}C${f(r * 0.6)} ${f(-r * 1.2)} ${f(r * 0.7)} ${f(-r * 0.3)} 0 0Z" fill="${t.light}" stroke="${t.deep}" stroke-opacity=".5" stroke-width=".5"/><path d="M-1.6 0C-3.4 2.4 0 3.6 1.6 0Z" fill="${green}"/>`;
}
const leaf = (L: number, w: number, fill: string, vein: string) => `<path d="${leafD(L, L * w)}" fill="${fill}" stroke="${vein}" stroke-opacity=".5" stroke-width=".4"/><path d="M0 0L${f(L * 0.86)} 0" stroke="${vein}" stroke-opacity=".5" stroke-width=".4"/>`;

// ----- bunga musim: sakura (Semi), krisan & maple (Gugur), hellebore, kristal salju & pinus (Dingin) -----
function sakura(r: number, t: T) {
  return (
    `<circle r="${f(r * 1.02)}" fill="${t.deep}" opacity=".1"/>` +
    path(layer(5, r, r * 0.62, 0, 'notch'), t.light, t.deep, 0.5, 0.6) +
    path(layer(5, r * 0.5, r * 0.36, 36, 'notch'), t.base, t.deep, 0.4) +
    `<path d="${rays(10, r * 0.08, r * 0.34, 10)}" stroke="${t.deep}" stroke-width=".6" stroke-linecap="round"/><circle r="${f(r * 0.09)}" fill="#e9a825"/>`
  );
}
// Krisan: empat lingkar kelopak sempit runcing.
function mum(r: number, t: T) {
  const rows: [number, number, number, string][] = [[22, 1, 0, t.light], [18, 0.78, 8, t.base], [14, 0.56, 4, t.dark], [10, 0.34, 10, t.base]];
  let s = `<circle r="${f(r * 1.02)}" fill="${t.deep}" opacity=".12"/>`;
  for (const [n, h, off, fill] of rows) s += path(layer(n, r * h, r * 0.11, off, true), fill, t.deep, 0.4, 0.4);
  return s + `<circle r="${f(r * 0.07)}" fill="${t.deep}"/>`;
}
const MAPLE = 'M0-12L2.6-6.6 7-8.4 5.8-3 11.4-4.2 7.8.6 10.8 3.6 5 3.8 5.4 7.8.8 6 0 12-.8 6-5.4 7.8-5 3.8-10.8 3.6-7.8.6-11.4-4.2-5.8-3-7-8.4-2.6-6.6Z';
function maple(r: number, fill: string, vein: string) {
  return `<g transform="scale(${f(r / 12)})"><path d="${MAPLE}" fill="${fill}" stroke="${vein}" stroke-opacity=".6" stroke-width=".7" stroke-linejoin="round"/><path d="M0-9V16M0 2L-6-3M0 2L6-3M0-3L-3-7M0-3L3-7" fill="none" stroke="${vein}" stroke-opacity=".55" stroke-width=".6" stroke-linecap="round"/></g>`;
}
// Hellebore (mawar Natal): lima kelopak bulat putih, benang sari emas.
function hellebore(r: number, petal: T, edge: T) {
  return (
    `<circle r="${f(r * 1.02)}" fill="${edge.deep}" opacity=".1"/>` +
    path(layer(5, r, r * 0.85, 0), '#fff', edge.deep, 0.5, 0.7) +
    path(layer(5, r * 0.58, r * 0.5, 36), petal.light, edge.base, 0.4) +
    `<path d="${rays(14, r * 0.12, r * 0.34, 5)}" stroke="#c9a227" stroke-width=".8" stroke-linecap="round"/><circle r="${f(r * 0.1)}" fill="#c9a227"/>`
  );
}
function flake(r: number, t: T) {
  let d = rays(6, 0, r);
  for (let k = 0; k < 6; k++) {
    for (const tt of [0.46, 0.72]) {
      for (const side of [-1, 1]) {
        const b = rot([0, -r * tt], k * 60);
        const e = rot([side * r * 0.2 * (1.1 - tt * 0.35), -r * tt - r * 0.16], k * 60);
        d += `M${f(b[0])} ${f(b[1])}L${f(e[0])} ${f(e[1])}`;
      }
    }
  }
  return `<path d="${d}" stroke="${t.base}" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#fff" stroke-width="1.1" stroke-linecap="round" fill="none"/><circle r="${f(r * 0.1)}" fill="#fff"/>`;
}
// Ranting pinus: menunjuk ke +x, jarum berpasangan.
function pine(len: number, c: string) {
  let d = '';
  for (let i = 1; i <= 9; i++) {
    const x = (len * i) / 10;
    const L = (len / 12) * (1 - i / 16);
    d += `M${f(x)} 0L${f(x + L * 0.5)} ${f(-L)}M${f(x)} 0L${f(x + L * 0.5)} ${f(L)}`;
  }
  return `<path d="M0 0H${f(len)}" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
}

// Satu bunga menurut jenisnya (r = jari-jari kira-kira).
function flower(kind: Kind, r: number, V: Cfg, i: number, seed: number) {
  const two = i % 2 ? V.soft : V.hero;
  switch (kind) {
    case 'dahlia': return dahlia(r, two);
    case 'anemone': return anemone(r, V.pale, V.centre);
    case 'hydra': return hydra(r, [V.hero, V.red, V.soft][i % 3]!, seed);
    case 'marigold': return marigold(r, V.hero, V.soft);
    case 'poppy': return poppy(r, V.red);
    case 'forget': return forget(r, [V.hero, V.red, V.soft][i % 3]!);
    case 'lav': return lavender(r * 2.4, i % 2 ? V.hero : V.soft, V.stem);
    case 'berry': return berries(r * 0.5, V.berry, V.stem);
    case 'bud': return bud(r * 0.7, V.soft, V.leaf);
    case 'gyp': return gypsophila(r * 2.2, seed, '#fff', V.leafLight);
    case 'blossom': return forget(r * 1.1, V.soft);
    case 'sakura': return sakura(r, i % 3 === 2 ? V.soft : V.hero);
    case 'mum': return mum(r, i % 2 ? V.soft : V.hero);
    case 'maple': return maple(r * 1.1, [V.hero.base, V.red.base, V.soft.base][i % 3]!, V.stem);
    case 'hellebore': return hellebore(r, V.pale, V.soft);
    case 'flake': return flake(r, V.hero);
    case 'pine': return pine(r * 3.2, V.leaf);
  }
}
const isDirectional = (k: Kind) => k === 'lav' || k === 'berry' || k === 'gyp' || k === 'pine';
const isUp = (k: Kind) => k === 'bud';

// ----- ranting sejajar bingkai -----

interface Out {
  st: string[];
  lf: string[];
  fo: string[];
  fi: string[];
}
const out = (): Out => ({ st: [], lf: [], fo: [], fi: [] });
const render = (o: Out) => o.st.join('') + o.lf.join('') + o.fo.join('') + o.fi.join('');

// Batang utama dari (ox,oy) ke arah (dx,dy) sepanjang len, bergelombang kecil; tunas bergantian di dua sisi, makin pendek ke
// ujung. inSign = sisi dalam kartu (+1 = arah (-dy,dx)). outward = pengali panjang tunas ke luar bingkai.
function edgeStem(o: Out, V: Cfg, rnd: () => number, ox: number, oy: number, dx: number, dy: number, len: number, opts: { from?: number; inSign?: 1 | -1; outward?: number; size?: number; leaves?: boolean } = {}) {
  const { from = 24, inSign = 1, outward = 0.55, size = 1, leaves = true } = opts;
  const px = -dy * inSign;
  const py = dx * inSign;
  const ph = rnd() * 6;
  const at = (t: number): P => {
    const w = 1.8 * Math.sin(t * 0.09 + ph);
    return [ox + dx * t + px * w, oy + dy * t + py * w];
  };
  let d = `M${f(ox)} ${f(oy)}`;
  for (let t = 4; t <= len; t += 4) {
    const p = at(t);
    d += `L${f(p[0])} ${f(p[1])}`;
  }
  o.st.push(`<path d="${d}" fill="none" stroke="${V.stem}" stroke-width="1.5" stroke-linecap="round"/>`);
  const ang0 = (Math.atan2(dy, dx) * 180) / Math.PI;
  const tones = [V.leaf, V.leafDark, V.leafLight];
  // daun kecil menempel di batang
  for (let t = from - 6; leaves && t < len; t += 14) {
    const b = at(t);
    const side = Math.floor(t / 14) % 2 ? 1 : -1;
    o.lf.push(put(b[0], b[1], ang0 + side * (52 + rnd() * 16), 1, leaf((8 + rnd() * 5) * size * (1 - 0.3 * (t / len)), 0.34, tones[Math.floor(rnd() * 3)]!, V.leafDark)));
  }
  let side: 1 | -1 = 1;
  let k = 0;
  for (let t = from; t < len - 8; t += 12 + rnd() * 6) {
    const fr = t / len;
    const b = at(t);
    const ln = (22 - 12 * fr) * (0.85 + rnd() * 0.3) * size * (side === 1 ? 1 : outward);
    const vx = px * side * 0.85 + dx * 0.55;
    const vy = py * side * 0.85 + dy * 0.55;
    const ex = b[0] + vx * ln;
    const ey = b[1] + vy * ln;
    const ang = (Math.atan2(vy, vx) * 180) / Math.PI;
    o.st.push(`<path d="M${f(b[0])} ${f(b[1])}Q${f(b[0] + vx * ln * 0.5 + dx * 3)} ${f(b[1] + vy * ln * 0.5 + dy * 3)} ${f(ex)} ${f(ey)}" fill="none" stroke="${V.stem}" stroke-width=".9" stroke-linecap="round"/>`);
    if (leaves) o.lf.push(put(b[0] + vx * ln * 0.45, b[1] + vy * ln * 0.45, ang + side * 38, 1, leaf(11 * size * (1 - 0.3 * fr), 0.34, tones[k % 3]!, V.leafDark)));
    const useFocal = fr < 0.55 && side === 1 && rnd() < 0.75;
    const kind = useFocal ? V.focal[k % V.focal.length]! : V.fill[k % V.fill.length]!;
    const r = useFocal ? (9 - 3.5 * fr) * size : (7.5 - 2 * fr) * size;
    const tipRot = isDirectional(kind) ? ang : isUp(kind) ? ang + 90 : rnd() * 360;
    (useFocal ? o.fo : o.fi).push(put(ex, ey, tipRot, 1, flower(kind, r, V, k, 100 + Math.floor(rnd() * 900))));
    side = side === 1 ? -1 : 1;
    k++;
  }
  const e = at(len);
  o.fi.push(put(e[0], e[1], ang0, 1, flower(V.fill[(k + 1) % V.fill.length]!, 6 * size, V, k + 1, 7)));
}

const SPECKS = (V: Cfg) => {
  const rnd = rng(V.seed + 3);
  let d = '';
  for (let i = 0; i < 9; i++) d += `M${f(20 + rnd() * 120)} ${f(20 + rnd() * 120)}h.1`;
  return `<path d="${d}" stroke="#d4af37" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>`;
};

// ----- sudut (kotak 0 0 170 170; sudut kiri-atas, dicerminkan untuk sudut lain) -----
function edgeCorner(v: Meadow) {
  const V = CFG[v];
  const rnd = rng(V.seed);
  const o = out();
  const cx = 32;
  const cy = 32;
  // kipas daun di belakang klaster
  for (let i = 0; i < 9; i++) {
    const a = -8 + i * 13;
    o.lf.push(put(cx, cy, a, 1, leaf(44 + rnd() * 18, 0.3, [V.leaf, V.leafDark, V.leafLight][i % 3]!, V.leafDark)));
  }
  edgeStem(o, V, rnd, 14, 14, 1, 0, 150, { from: 56, inSign: 1 });
  edgeStem(o, V, rnd, 14, 14, 0, 1, 150, { from: 56, inSign: -1 });
  const cluster: [number, number, number][] = [[cx, cy, 24], [cx + 36, cy - 6, 15], [cx - 6, cy + 36, 15], [cx + 24, cy + 22, 12]];
  cluster.forEach(([x, y, r], i) => o.fo.push(put(x, y, rnd() * 360, 1, flower(V.focal[i % V.focal.length]!, r, V, i, 11 + i))));
  [[cx + 54, cy + 2, 'forget'], [cx + 2, cy + 54, 'forget'], [cx + 44, cy + 36, 'bud']].forEach(([x, y, kind], i) => o.fi.push(put(x as number, y as number, 40 * i, 1, flower(kind as Kind, 7, V, i + 1, 3))));
  return render(o) + SPECKS(V);
}



// ----- mahkota bingkai foto lengkung (kotak lebar w x tinggi h) -----
function archCrown(v: Meadow, w: number, h: number) {
  void h;
  const V = CFG[v];
  const rnd = rng(V.seed + 4);
  const cx = w / 2;
  const r = w / 2;
  const n = 13;
  const at = (i: number, k: number, extra = 0): [number, number, number] => {
    const a = Math.PI * 0.84 + (i / (n - 1)) * Math.PI * 1.32 + (k * (Math.PI * 1.32)) / (n - 1);
    return [cx + Math.cos(a) * (r + extra), r + Math.sin(a) * (r + extra), (a * 180) / Math.PI + 90];
  };
  const big = Array.from({ length: n }, (_, i) => at(i, 0));
  const fill = Array.from({ length: n - 1 }, (_, i) => at(i, 0.5, 6));
  const first = big[0]!;
  const last = big[n - 1]!;
  const o = out();
  o.st.push(`<path d="M${f(first[0])} ${f(first[1])}A${f(r)} ${f(r)} 0 1 1 ${f(last[0])} ${f(last[1])}" fill="none" stroke="${V.stem}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`);
  const tones = [V.leaf, V.leafDark, V.leafLight];
  big.forEach(([x, y, a], i) => o.lf.push(put(x, y, a + (i % 2 ? -50 : 50), 1, leaf(20 + rnd() * 5, 0.32, tones[i % 3]!, V.leafDark))));
  fill.forEach(([x, y, a], i) => o.lf.push(put(x, y, a + (i % 2 ? 40 : -40), 1, leaf(12, 0.32, tones[(i + 1) % 3]!, V.leafDark))));
  big.forEach(([x, y], i) => {
    const kind = V.focal[i % V.focal.length]!;
    o.fo.push(put(x, y, i * 31, 1, flower(kind, [15, 19, 13, 20, 16, 21, 14][i % 7]!, V, i, 20 + i)));
  });
  fill.forEach(([x, y, a], i) => {
    const kind = V.fill[i % V.fill.length]!;
    o.fi.push(put(x, y, isDirectional(kind) ? a : isUp(kind) ? a + 180 : i * 47, 1, flower(kind, 7, V, i, 40 + i)));
  });
  return render(o);
}


// ----- komposisi "garland" (Marigold): untaian kepala bunga di benang melengkung, menjuntai dari sudut -----
// Untaian dari a ke b melalui titik kendali c: kepala bunga rapat di sepanjang benang, daun di sela-selanya.
function strand(o: Out, V: Cfg, rnd: () => number, a: P, c: P, b: P, n: number, r0: number, r1: number) {
  const at = (t: number): [P, number] => {
    const x = (1 - t) * (1 - t) * a[0] + 2 * t * (1 - t) * c[0] + t * t * b[0];
    const y = (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * c[1] + t * t * b[1];
    const dx = 2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
    const dy = 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
    return [[x, y], (Math.atan2(dy, dx) * 180) / Math.PI];
  };
  o.st.push(`<path d="M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}" fill="none" stroke="${V.stem}" stroke-width="1.3" stroke-linecap="round"/>`);
  const tones = tonesOf(V);
  for (let i = 0; i < n; i++) {
    const [p, ang] = at((i + 0.5) / n);
    const [q] = at((i + 1) / n);
    const r = r0 + (r1 - r0) * (i / n);
    const kind: Kind = i % 3 === 1 ? 'dahlia' : 'marigold';
    o.fo.push(put(p[0], p[1], rnd() * 360, 1, flower(kind, r * (kind === 'dahlia' ? 0.8 : 1), V, i, 70 + i)));
    if (i < n - 1) o.lf.push(put(q[0], q[1], ang + (i % 2 ? 78 : -78), 1, leaf(r * 1.5, 0.34, tones[i % 3]!, V.leafDark)));
  }
}
function garlandCorner(v: Meadow) {
  const V = CFG[v];
  const rnd = rng(V.seed);
  const o = out();
  strand(o, V, rnd, [16, 12], [88, 66], [164, 12], 11, 9, 7.5);
  strand(o, V, rnd, [14, 14], [-4, 76], [26, 128], 8, 9, 6.5);
  strand(o, V, rnd, [34, 22], [64, 34], [96, 62], 4, 8, 6);
  for (let i = 0; i < 7; i++) o.lf.push(put(26, 26, 8 + i * 13, 1, leaf(36 + rnd() * 14, 0.3, tonesOf(V)[i % 3]!, V.leafDark)));
  const heads: [number, number, number, Kind][] = [[28, 28, 25, 'marigold'], [60, 30, 14, 'poppy'], [28, 62, 14, 'poppy']];
  heads.forEach(([x, y, r, k], i) => o.fo.push(put(x, y, i * 40, 1, flower(k, r, V, i, 13 + i))));
  const fills: [number, number, Kind][] = [[46, 46, 'berry'], [74, 50, 'blossom'], [44, 82, 'bud']];
  fills.forEach(([x, y, k], i) => o.fi.push(put(x, y, 50 + 40 * i, 1, flower(k, 7, V, i, 9))));
  return render(o) + SPECKS(V);
}

function ringCrown(v: Meadow, w: number) {
  const V = CFG[v];
  const rnd = rng(V.seed + 4);
  const o = out();
  const c = w / 2;
  const n = 15;
  const tones = tonesOf(V);
  o.st.push(`<circle cx="${f(c)}" cy="${f(c)}" r="${f(c)}" fill="none" stroke="${V.stem}" stroke-width="1.4"/>`);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const b = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
    const deg = (a * 180) / Math.PI + 90;
    o.lf.push(put(c + Math.cos(b) * c, c + Math.sin(b) * c, deg + (i % 2 ? 80 : -80), 1, leaf(15 + rnd() * 4, 0.34, tones[i % 3]!, V.leafDark)));
    o.fo.push(put(c + Math.cos(a) * c, c + Math.sin(a) * c, i * 41, 1, flower(i % 3 === 1 ? 'dahlia' : 'marigold', i % 3 === 1 ? 9 : 12, V, i, 80 + i)));
  }
  o.fo.push(put(c, 0, 0, 1, flower('poppy', 11, V, 1, 3)), put(c, c * 2, 0, 1, flower('poppy', 9, V, 1, 4)));
  return render(o);
}


const tonesOf = (V: Cfg) => [V.leaf, V.leafDark, V.leafLight];


// ----- komposisi "twig" (Hortensia Turquoise): ranting tipis gelap sejajar bingkai, bunga mungil, kepala hortensia di sudut -----
function twigCorner(v: Meadow) {
  const V = CFG[v];
  const rnd = rng(V.seed);
  const o = out();
  edgeStem(o, V, rnd, 14, 14, 1, 0, 152, { from: 62, inSign: 1, outward: 0.8, size: 0.9, leaves: false });
  edgeStem(o, V, rnd, 14, 14, 0, 1, 152, { from: 62, inSign: -1, outward: 0.8, size: 0.9, leaves: false });
  // ranting kedua yang lebih pendek, sedikit ke dalam, supaya sudut terasa penuh
  edgeStem(o, V, rnd, 26, 30, 1, 0, 84, { from: 40, inSign: 1, outward: 0.6, size: 0.7, leaves: false });
  edgeStem(o, V, rnd, 30, 26, 0, 1, 84, { from: 40, inSign: -1, outward: 0.6, size: 0.7, leaves: false });
  const heads: [number, number, number, Kind][] = [[34, 34, 32, 'hydra'], [78, 26, 22, 'hydra'], [26, 78, 22, 'hydra'], [66, 64, 20, 'hydra'], [56, 44, 11, 'anemone'], [110, 22, 14, 'hydra'], [22, 110, 14, 'hydra']];
  heads.forEach(([x, y, r, k], i) => o.fo.push(put(x, y, i * 40, 1, flower(k, r, V, i, 31 + i))));
  const fills: [number, number, Kind][] = [[96, 44, 'forget'], [44, 96, 'forget'], [88, 78, 'berry'], [128, 34, 'forget'], [34, 128, 'forget']];
  fills.forEach(([x, y, k], i) => o.fi.push(put(x, y, 55 * i, 1, flower(k, 6, V, i, 9))));
  return render(o) + SPECKS(V);
}
// Mahkota bingkai oval: ranting tipis melingkar dengan bunga mungil, dua kelompok hortensia (kiri-atas besar, kanan-bawah kecil).
function twigCrown(v: Meadow, w: number, h: number) {
  const V = CFG[v];
  const rnd = rng(V.seed + 4);
  const o = out();
  const cx = w / 2;
  const cy = h / 2;
  const at = (deg: number, extra = 0): [number, number, number] => {
    const a = (deg * Math.PI) / 180;
    return [cx + Math.cos(a) * (w / 2 + extra), cy + Math.sin(a) * (h / 2 + extra), deg + 90];
  };
  o.st.push(`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w / 2)}" ry="${f(h / 2)}" fill="none" stroke="${V.stem}" stroke-width="1.4"/>`);
  for (let i = 0; i < 26; i++) {
    const deg = i * (360 / 26) + rnd() * 6;
    const out1 = i % 2 === 0;
    const [x, y] = at(deg);
    const [ex, ey] = at(deg + 4, out1 ? 8 + rnd() * 6 : -6 - rnd() * 4);
    o.st.push(`<path d="M${f(x)} ${f(y)}L${f(ex)} ${f(ey)}" stroke="${V.stem}" stroke-width=".8" stroke-linecap="round"/>`);
    o.fi.push(put(ex, ey, deg, 1, flower(i % 5 === 0 ? 'berry' : 'forget', 5.5, V, i, 60 + i)));
  }
  const groups: [number, number, number][] = [[212, 64, 5], [32, 46, 4]];
  groups.forEach(([mid, span, n], g) => {
    for (let i = 0; i < n; i++) {
      const deg = mid - span / 2 + (span * i) / (n - 1);
      const [x, y] = at(deg);
      o.fo.push(put(x, y, i * 40, 1, flower(i === 2 && g === 0 ? 'anemone' : 'hydra', g ? 17 + (i % 2) * 4 : 22 + (i % 3) * 5, V, i + g, 20 + i + g * 7)));
    }
  });
  return render(o);
}

// ----- ubin bingkai penuh (kotak 0 0 60 24): batang horizontal pendek dengan satu bunga di tengah -----
// Diulang di sepanjang tepi halaman oleh MeadowPageFrame (meadow-parts.tsx); k = variasi (0-2).
export function meadowEdgeTile(v: Meadow, k: number) {
  const V = CFG[v];
  const rnd = rng(V.seed + 11 + k * 7);
  const o = out();
  const ph = rnd() * 6;
  let d = 'M0 12';
  for (let x = 4; x <= 60; x += 4) d += `L${x} ${f(12 + 1.4 * Math.sin(x * 0.16 + ph))}`;
  o.st.push(`<path d="${d}" fill="none" stroke="${V.stem}" stroke-width="1.4" stroke-linecap="round"/>`);
  const tones = tonesOf(V);
  [8, 19, 41, 52].forEach((x, i) => o.lf.push(put(x, 12, (i % 2 ? -1 : 1) * (48 + rnd() * 22), 1, leaf(9 + rnd() * 3, 0.34, tones[i % 3]!, V.leafDark))));
  o.fo.push(put(30, 12, rnd() * 360, 1, flower(V.focal[k % V.focal.length]!, 8.5 + rnd() * 1.5, V, k, 90 + k)));
  [[12, -6], [48, 6]].forEach(([x, dy], i) => o.fi.push(put(x!, 12 + dy!, 0, 1, flower(V.fill[(k + i) % V.fill.length]!, 4.8, V, k + i, 5 + i))));
  return render(o);
}

// ----- ekspor: susunan menurut desain; pemisah & ranting kecil sengaja kosong (tidak ada ranting horizontal di tengah halaman) -----
export function meadowCorner(v: Meadow) {
  const comp = CFG[v].comp;
  return comp === 'twig' ? twigCorner(v) : comp === 'garland' ? garlandCorner(v) : edgeCorner(v);
}
export function meadowDivider(v: Meadow) {
  void v;
  return '';
}
export function meadowSprig(v: Meadow) {
  void v;
  return '';
}
export function meadowCrown(v: Meadow, w: number, h: number) {
  const comp = CFG[v].comp;
  return comp === 'twig' ? twigCrown(v, w, h) : comp === 'garland' ? ringCrown(v, w) : archCrown(v, w, h);
}
// Bayangan bunga untuk latar blok isi (dipasang kabur & sangat transparan lewat CSS, lihat .wl-ghost): beberapa kepala hortensia
// dengan ukuran berbeda di tepi kiri; sisi kanan = cerminan. Hanya untuk desain bertipe 'twig' (hortensia).
export const GHOST_BOX = { w: 200, h: 420 };
export function meadowGhost(v: Meadow) {
  const V = CFG[v];
  const heads: [number, number, number][] = [[34, 70, 66], [108, 178, 42], [22, 282, 58], [96, 376, 34]];
  return heads.map(([x, y, r], i) => put(x, y, i * 47, 1, flower('hydra', r, V, i, 71 + i * 5))).join('');
}
// Bentuk & ukuran bingkai foto per desain: lavender = lengkung, hortensia = oval, marigold = bulat.
export const MEADOW_FRAME: Record<Meadow, { w: number; h: number; shape: string; photo: string }> = {
  lavender: { w: 188, h: 236, shape: 'rounded-t-[999px] rounded-b-[22px]', photo: 'h-56 w-44' },
  hortensia: { w: 188, h: 236, shape: 'rounded-[50%]', photo: 'h-56 w-44' },
  marigold: { w: 196, h: 196, shape: 'rounded-full', photo: 'h-[11.5rem] w-[11.5rem]' },
  // Desain musim memakai SeasonFrame (season-parts.tsx) untuk bingkai foto; entri ini hanya melengkapi tipe.
  sakura: { w: 188, h: 236, shape: 'rounded-t-[999px] rounded-b-[22px]', photo: 'h-56 w-44' },
  autumn: { w: 188, h: 236, shape: 'rounded-t-[999px] rounded-b-[22px]', photo: 'h-56 w-44' },
  winter: { w: 188, h: 236, shape: 'rounded-t-[999px] rounded-b-[22px]', photo: 'h-56 w-44' },
};
