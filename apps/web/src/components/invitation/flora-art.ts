// Ilustrasi bunga untuk desain "Buket Pengantin": mawar, peony, aster, anemon, kosmos, bunga filler, daun, dan rangkaian
// (karangan sudut, buket, lengkung, ombak bunga). Semuanya dibangkitkan secara prosedural menjadi potongan teks SVG
// (fungsi murni tanpa React), jadi bisa dipakai di JSX (lewat dangerouslySetInnerHTML), di mask/background CSS (data URI),
// dan di server tanpa hook. Bunga utama ("hero") memakai warna tema (--s) sehingga mengikuti palet; sisanya warna pastel
// tetap supaya tampilannya selalu "putih berbunga warna-warni".

const f = (n: number) => (Math.round(n * 10) / 10).toString();

// Pseudo-acak deterministik (SSR = hidrasi).
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----- warna -----
const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c);
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

export interface Tone {
  base: string;
  light: string;
  dark: string;
  deep: string;
}
// Satu warna dasar (hex atau ekspresi warna CSS) -> empat nada: terang, dasar, gelap, dalam (untuk garis & pusat bunga).
export function tone(base: string, shadow = '#7a3350'): Tone {
  if (isHex(base)) return { base, light: mixHex(base, '#ffffff', 0.4), dark: mixHex(base, shadow, 0.2), deep: mixHex(base, shadow, 0.42) };
  return { base, light: `color-mix(in srgb, ${base} 60%, #fff)`, dark: `color-mix(in srgb, ${base} 80%, ${shadow})`, deep: `color-mix(in srgb, ${base} 58%, ${shadow})` };
}

export const BLOOM = {
  blush: '#f6b3c3',
  rose: '#ec7f9d',
  coral: '#f4806f',
  peach: '#f9b98e',
  butter: '#f8d86e',
  lavender: '#c0a6ee',
  lilac: '#a98ee0',
  sky: '#9cc7ee',
  white: '#ffffff',
  leaf: '#a0c3a8',
  leafDark: '#6c9c7e',
  leafLight: '#c2dcc6',
  stem: '#7ba487',
} as const;

// Palet bunga: `hero` = bunga utama (ikut warna tema lewat --s); sisanya tetap. Kunci `fixed` dipakai untuk gambar data URI
// (CSS var tidak tersedia di dalam gambar).
export interface Garden {
  hero: Tone;
  soft: Tone;
  warm: Tone;
  cool: Tone;
  sun: Tone;
  leaf: string;
  leafDark: string;
  leafLight: string;
}
const HERO_VAR = 'color-mix(in srgb, var(--s, #ef8fa8) 82%, #fff)';
export const GARDEN: Garden = {
  hero: tone(HERO_VAR),
  soft: tone(BLOOM.blush),
  warm: tone(BLOOM.peach, '#8a4a2e'),
  cool: tone(BLOOM.lavender, '#4f3a7a'),
  sun: tone(BLOOM.butter, '#8a6a1c'),
  leaf: BLOOM.leaf,
  leafDark: BLOOM.leafDark,
  leafLight: BLOOM.leafLight,
};
export const GARDEN_FIXED: Garden = { ...GARDEN, hero: tone(BLOOM.rose) };

// ----- bentuk dasar -----
// Kelopak membulat menunjuk ke atas (-y) dari titik pangkal (0,0).
const petalD = (w: number, h: number) => `M0 0C${f(-w)} ${f(-h * 0.2)} ${f(-w * 1.05)} ${f(-h * 0.82)} 0 ${f(-h)}C${f(w * 1.05)} ${f(-h * 0.82)} ${f(w)} ${f(-h * 0.2)} 0 0Z`;
// Kelopak peony: ujung bergelombang.
const ruffleD = (w: number, h: number) =>
  `M0 0C${f(-w)} ${f(-h * 0.15)} ${f(-w * 1.15)} ${f(-h * 0.7)} ${f(-w * 0.62)} ${f(-h * 0.92)}Q${f(-w * 0.3)} ${f(-h * 1.05)} 0 ${f(-h * 0.9)}Q${f(w * 0.3)} ${f(-h * 1.05)} ${f(w * 0.62)} ${f(-h * 0.92)}C${f(w * 1.15)} ${f(-h * 0.7)} ${f(w)} ${f(-h * 0.15)} 0 0Z`;
// Daun lanset.
export const leafD = (L: number, w: number) => `M0 0C${f(L * 0.25)} ${f(-w)} ${f(L * 0.72)} ${f(-w * 0.95)} ${f(L)} 0C${f(L * 0.72)} ${f(w * 0.95)} ${f(L * 0.25)} ${f(w)} 0 0Z`;

const put = (x: number, y: number, rot: number, scale: number, inner: string) => `<g transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${scale !== 1 ? ` scale(${f(scale)})` : ''}">${inner}</g>`;
const ring = (n: number, off: number, fn: (angle: number, i: number) => string) => Array.from({ length: n }, (_, i) => fn(off + (i * 360) / n, i)).join('');

// ----- bunga (pusat di 0,0; jari-jari ~ r) -----
export function rose(r: number, t: Tone) {
  // Lima lapis kelopak membulat, dari luar (terang, lebar) ke dalam (gelap, sempit): tiap kelopak punya bayangan di
  // pangkal dan garis tepi gulungan di ujungnya supaya terbaca sebagai mawar mekar, bukan bintang.
  const layers = [
    { n: 7, off: 0, w: 0.56, h: 0.96, fill: t.light },
    { n: 6, off: 26, w: 0.5, h: 0.76, fill: t.base },
    { n: 5, off: 8, w: 0.42, h: 0.58, fill: t.base },
    { n: 4, off: 40, w: 0.33, h: 0.42, fill: t.dark },
    { n: 3, off: 12, w: 0.24, h: 0.28, fill: t.dark },
  ];
  let s = '';
  for (const L of layers) {
    const w = L.w * r;
    const h = L.h * r;
    s += ring(L.n, L.off, (a) =>
      `<g transform="rotate(${f(a)})"><path d="${petalD(w, h)}" fill="${L.fill}" stroke="${t.deep}" stroke-opacity=".34" stroke-width=".8" stroke-linejoin="round"/><path d="${petalD(w * 0.72, h * 0.55)}" fill="${t.deep}" fill-opacity=".1"/><path d="M${f(-w * 0.62)} ${f(-h * 0.74)}Q0 ${f(-h * 1.03)} ${f(w * 0.62)} ${f(-h * 0.74)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/></g>`,
    );
  }
  s += `<path d="M${f(-r * 0.1)} ${f(r * 0.04)}C${f(-r * 0.16)} ${f(-r * 0.16)} ${f(r * 0.08)} ${f(-r * 0.2)} ${f(r * 0.12)} ${f(-r * 0.04)}C${f(r * 0.14)} ${f(r * 0.1)} ${f(-r * 0.04)} ${f(r * 0.12)} ${f(-r * 0.02)} ${f(r * 0.0)}" fill="none" stroke="${t.deep}" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"/>`;
  return s;
}

export function peony(r: number, t: Tone) {
  const layers = [
    { n: 8, off: 0, w: 0.46, h: 1, fill: t.light },
    { n: 7, off: 24, w: 0.42, h: 0.84, fill: t.light },
    { n: 6, off: 10, w: 0.38, h: 0.66, fill: t.base },
    { n: 5, off: 40, w: 0.3, h: 0.5, fill: t.base },
    { n: 4, off: 22, w: 0.22, h: 0.33, fill: t.dark },
  ];
  let s = '';
  for (const L of layers) s += ring(L.n, L.off, (a) => `<path d="${ruffleD(L.w * r, L.h * r)}" transform="rotate(${f(a)})" fill="${L.fill}" stroke="${t.deep}" stroke-opacity=".28" stroke-width=".7"/>`);
  s += ring(8, 0, (a) => `<path d="M0 ${f(-r * 0.25)}L0 ${f(-r * 0.78)}" transform="rotate(${f(a)})" stroke="${t.deep}" stroke-opacity=".16" stroke-width=".8" stroke-linecap="round"/>`);
  s += `<circle r="${f(r * 0.1)}" fill="${t.deep}" fill-opacity=".5"/>`;
  return s;
}

export function daisy(r: number, petal: string = "#ffffff", center: string = BLOOM.butter, edge: string = "#b6c0d4") {
  let s = ring(14, 0, (a) => `<path d="M0 0C${f(-r * 0.13)} ${f(-r * 0.3)} ${f(-r * 0.12)} ${f(-r * 0.92)} 0 ${f(-r)}C${f(r * 0.12)} ${f(-r * 0.92)} ${f(r * 0.13)} ${f(-r * 0.3)} 0 0Z" transform="rotate(${f(a)})" fill="${petal}" stroke="${edge}" stroke-width=".85"/><path d="M0 ${f(-r * 0.2)}L0 ${f(-r * 0.78)}" transform="rotate(${f(a)})" stroke="${edge}" stroke-opacity=".45" stroke-width=".6" stroke-linecap="round"/>`);
  s += `<circle r="${f(r * 0.27)}" fill="${center}" stroke="${isHex(center) ? mixHex(center, '#8a6a1c', 0.4) : center}" stroke-opacity=".6" stroke-width=".6"/>`;
  s += ring(8, 10, (a) => `<circle cx="0" cy="${f(-r * 0.15)}" r="${f(r * 0.03)}" transform="rotate(${f(a)})" fill="#8a6a1c" fill-opacity=".5"/>`);
  return s;
}

export function anemone(r: number, petal: string = "#ffffff", center: string = "#4b3b72") {
  let s = ring(7, 6, (a) => `<path d="${petalD(r * 0.44, r)}" transform="rotate(${f(a)})" fill="${petal}" stroke="#b9aed0" stroke-width=".9"/>`);
  s += `<circle r="${f(r * 0.56)}" fill="#efe9f8" fill-opacity=".8"/>`;
  s += ring(7, 6, (a) => `<path d="M0 ${f(-r * 0.3)}L0 ${f(-r * 0.78)}" transform="rotate(${f(a)})" stroke="#d8d0e4" stroke-width=".7" stroke-linecap="round"/>`);
  s += `<circle r="${f(r * 0.3)}" fill="#e7def3"/>`;
  s += ring(16, 0, (a) => `<circle cx="0" cy="${f(-r * 0.27)}" r="${f(r * 0.034)}" transform="rotate(${f(a)})" fill="#2f2550"/>`);
  s += `<circle r="${f(r * 0.2)}" fill="${center}"/>`;
  s += `<circle r="${f(r * 0.09)}" fill="#2a2145"/>`;
  return s;
}

export function cosmos(r: number, t: Tone) {
  const w = r * 0.34;
  const h = r;
  const d = `M0 0C${f(-w)} ${f(-h * 0.3)} ${f(-w * 1.1)} ${f(-h * 0.82)} ${f(-w * 0.45)} ${f(-h)}L${f(-w * 0.16)} ${f(-h * 0.93)}L0 ${f(-h)}L${f(w * 0.16)} ${f(-h * 0.93)}L${f(w * 0.45)} ${f(-h)}C${f(w * 1.1)} ${f(-h * 0.82)} ${f(w)} ${f(-h * 0.3)} 0 0Z`;
  let s = ring(8, 0, (a) => `<path d="${d}" transform="rotate(${f(a)})" fill="${t.base}" stroke="${t.deep}" stroke-opacity=".3" stroke-width=".6"/>`);
  s += ring(8, 0, (a) => `<path d="M0 ${f(-h * 0.2)}L0 ${f(-h * 0.8)}" transform="rotate(${f(a)})" stroke="${t.deep}" stroke-opacity=".2" stroke-width=".7" stroke-linecap="round"/>`);
  s += `<circle r="${f(r * 0.2)}" fill="${BLOOM.butter}" stroke="#c9a23c" stroke-opacity=".6" stroke-width=".6"/>`;
  return s;
}

// Bunga kecil lima kelopak (forget-me-not / hydrangea).
export function blossom(r: number, t: Tone, center: string = BLOOM.butter) {
  let s = ring(5, 0, (a) => `<circle cx="0" cy="${f(-r * 0.58)}" r="${f(r * 0.5)}" transform="rotate(${f(a)})" fill="${t.light}" stroke="${t.dark}" stroke-opacity=".5" stroke-width=".5"/>`);
  s += `<circle r="${f(r * 0.24)}" fill="${center}"/>`;
  return s;
}

// Taburan bunga kecil di dalam lingkaran (kluster hydrangea / filler).
export function filler(R: number, count: number, tones: Tone[], seed: number, size = 0.2) {
  const rnd = rng(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R;
    s += put(Math.cos(a) * d, Math.sin(a) * d, rnd() * 72, 1, blossom(R * size * (0.8 + rnd() * 0.5), tones[i % tones.length]!));
  }
  return s;
}

// Tangkai berdaun: tangkai melengkung dari (0,0) ke (len,0); daun berpasangan (bulat: eukaliptus; lanset: daun biasa).
export function sprig(len: number, n: number, leafL: number, fill: string, stroke: string, round = false, bend = 0.12) {
  let s = `<path d="M0 0Q${f(len * 0.5)} ${f(-len * bend)} ${f(len)} 0" fill="none" stroke="${stroke}" stroke-width="1.1" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.7) / (n + 0.4);
    const x = len * u;
    const y = -len * bend * 2 * u * (1 - u) * 1.0;
    const size = leafL * (1 - u * 0.45);
    for (const side of [-1, 1]) {
      const rot = side * (round ? 62 : 42);
      s += round
        ? put(x, y, rot, 1, `<ellipse cx="${f(size * 0.5)}" cy="0" rx="${f(size * 0.5)}" ry="${f(size * 0.42)}" fill="${fill}" stroke="${stroke}" stroke-opacity=".55" stroke-width=".5"/>`)
        : put(x, y, rot, 1, `<path d="${leafD(size, size * 0.3)}" fill="${fill}" stroke="${stroke}" stroke-opacity=".6" stroke-width=".5"/><path d="M0 0L${f(size * 0.82)} 0" stroke="${stroke}" stroke-opacity=".4" stroke-width=".5"/>`);
    }
  }
  s += put(len, 0, 0, 1, `<path d="${leafD(leafL * 0.7, leafL * 0.22)}" fill="${fill}" stroke="${stroke}" stroke-opacity=".6" stroke-width=".5"/>`);
  return s;
}

// Baby's breath: cabang halus bercabang dengan titik-titik putih.
export function gypsophila(len: number, seed: number, dots = '#ffffff', stem = '#9bb7a2') {
  const rnd = rng(seed);
  let s = '';
  const branch = (x: number, y: number, ang: number, l: number, depth: number) => {
    const x2 = x + Math.cos(ang) * l;
    const y2 = y + Math.sin(ang) * l;
    s += `<path d="M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}" stroke="${stem}" stroke-width=".7" stroke-linecap="round"/>`;
    if (depth === 0) {
      s += `<circle cx="${f(x2)}" cy="${f(y2)}" r="${f(1.1 + rnd() * 0.8)}" fill="${dots}" stroke="#d6dde0" stroke-width=".4"/>`;
      return;
    }
    const k = 2 + (rnd() > 0.45 ? 1 : 0);
    for (let i = 0; i < k; i++) branch(x2, y2, ang + (i - (k - 1) / 2) * 0.66 + (rnd() - 0.5) * 0.2, l * 0.68, depth - 1);
  };
  branch(0, 0, 0, len * 0.4, 3);
  return s;
}

export { put, ring };

// Palet bunga bernilai hex semua (untuk data URI / mask, tempat var() CSS tidak tersedia). `heroHex` = warna sekunder tema.
export function makeGarden(heroHex: string): Garden {
  return { ...GARDEN_FIXED, hero: isHex(heroHex) ? tone(mixHex(heroHex, '#ffffff', 0.12)) : GARDEN_FIXED.hero };
}
export { isHex, mixHex };
