// Seni "taman mawar" Floral Romantis: bunga bergaya cat air — kelopak berlapis dengan gradasi (gelap di pangkal, terang di
// ujung), tanpa garis tepi tebal — mawar mekar, lily putih berbenang sari, daun hijau keabu-abuan berurat, kuncup, dan
// buah kecil. Prosedural (fungsi murni -> teks SVG, deterministik) seperti flora-art.ts. Gradasi memakai id yang diturunkan
// dari warnanya, jadi salinan ganda di satu halaman identik dan aman bila id-nya bentrok.

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const rad = (d: number) => (d * Math.PI) / 180;

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
const mix = (a: string, b: string, pct: number) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

// Gradasi linear sepanjang sumbu kelopak (y=0 ujung, y=1 pangkal; objectBoundingBox ikut berputar bersama kelopak).
function grad(id: string, stops: [number, string][]) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

const put = (x: number, y: number, rot: number, scale: number, inner: string) =>
  `<g transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${scale !== 1 ? ` scale(${f(scale)})` : ''}">${inner}</g>`;
const ring = (n: number, off: number, fn: (a: number, i: number) => string) => Array.from({ length: n }, (_, i) => fn(off + (i * 360) / n, i)).join('');

// Titik & arah singgung sepanjang kurva kuadratik.
function along(p0: [number, number], p1: [number, number], p2: [number, number], t: number) {
  const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
  const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI };
}

export interface Hues {
  /** Warna bunga utama (hex atau ekspresi CSS). */
  rose: string;
  leaf: string;
  leafDark: string;
  leafLight: string;
  wine: string;
}
export const ROMANTIC_HUES: Hues = {
  rose: 'color-mix(in srgb, var(--p, #c4587a) 78%, #fff)',
  leaf: '#8fae96',
  leafDark: '#5f8470',
  leafLight: '#cfe0ca',
  wine: '#a46a72',
};

// ----- daun -----
export function paintLeaf(L: number, w: number, h: Hues, tint: 'green' | 'wine' = 'green') {
  const base = tint === 'wine' ? h.wine : h.leaf;
  const dark = tint === 'wine' ? mix(h.wine, '#3a1a22', 70) : h.leafDark;
  const light = tint === 'wine' ? mix(h.wine, '#fff', 60) : h.leafLight;
  const id = `rl-${hash(base + dark + light)}`;
  const d = `M0 0C${f(L * 0.22)} ${f(-w)} ${f(L * 0.7)} ${f(-w * 1.02)} ${f(L)} 0C${f(L * 0.7)} ${f(w * 1.02)} ${f(L * 0.22)} ${f(w)} 0 0Z`;
  let veins = '';
  for (let i = 1; i <= 4; i++) {
    const x = L * (0.16 + i * 0.17);
    veins += `<path d="M${f(x)} 0L${f(x + L * 0.14)} ${f(-w * 0.62 * (1 - i * 0.1))}M${f(x)} 0L${f(x + L * 0.14)} ${f(w * 0.62 * (1 - i * 0.1))}" stroke="${light}" stroke-opacity=".5" stroke-width=".5" stroke-linecap="round"/>`;
  }
  return (
    `<defs>${grad(id, [[0, light], [0.45, base], [1, dark]]).replace('x1="0" y1="0" x2="0" y2="1"', 'x1="1" y1="0" x2="0" y2="0"')}</defs>` +
    `<path d="${d}" fill="url(#${id})"/>` +
    `<path d="M0 0Q${f(L * 0.5)} ${f(-w * 0.12)} ${f(L * 0.94)} 0" stroke="${light}" stroke-opacity=".7" stroke-width=".7" stroke-linecap="round" fill="none"/>` +
    veins
  );
}

// ----- mawar mekar -----
export function paintRose(r: number, h: Hues) {
  const base = h.rose;
  const light = mix(base, '#fff', 55);
  const mid = base;
  const dark = mix(base, '#4a1428', 78);
  const deep = mix(base, '#3a0f20', 56);
  const id = `rr-${hash(base)}`;
  const gOut = `${id}o`;
  const gIn = `${id}i`;
  const defs = grad(gOut, [[0, light], [0.5, mid], [1, dark]]) + grad(gIn, [[0, mid], [0.55, dark], [1, deep]]);
  // Kelopak bercawan: ujung membulat dengan sedikit lekuk, melebar di tengah.
  const petal = (w: number, hh: number) =>
    `M0 0C${f(-w * 0.9)} ${f(-hh * 0.08)} ${f(-w * 1.12)} ${f(-hh * 0.7)} ${f(-w * 0.55)} ${f(-hh * 0.94)}Q${f(-w * 0.18)} ${f(-hh * 1.03)} 0 ${f(-hh * 0.95)}Q${f(w * 0.18)} ${f(-hh * 1.03)} ${f(w * 0.55)} ${f(-hh * 0.94)}C${f(w * 1.12)} ${f(-hh * 0.7)} ${f(w * 0.9)} ${f(-hh * 0.08)} 0 0Z`;
  const rim = (w: number, hh: number) => `M${f(-w * 0.6)} ${f(-hh * 0.9)}Q${f(-w * 0.18)} ${f(-hh * 1.02)} 0 ${f(-hh * 0.95)}Q${f(w * 0.18)} ${f(-hh * 1.02)} ${f(w * 0.6)} ${f(-hh * 0.9)}`;
  const layers = [
    { n: 5, off: 0, w: 0.6, hh: 1, g: gOut },
    { n: 5, off: 36, w: 0.52, hh: 0.8, g: gOut },
    { n: 4, off: 14, w: 0.42, hh: 0.6, g: gIn },
    { n: 3, off: 50, w: 0.32, hh: 0.42, g: gIn },
  ];
  let s = `<defs>${defs}</defs>`;
  // bayangan lembut di bawah bunga supaya "duduk" di atas daun
  s += `<ellipse cx="0" cy="${f(r * 0.1)}" rx="${f(r * 0.98)}" ry="${f(r * 0.92)}" fill="${deep}" fill-opacity=".16"/>`;
  for (const L of layers) {
    const w = L.w * r;
    const hh = L.hh * r;
    s += ring(L.n, L.off, (a) => `<g transform="rotate(${f(a)})"><path d="${petal(w, hh)}" fill="url(#${L.g})"/><path d="${rim(w, hh)}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="${f(Math.max(0.5, r * 0.035))}" stroke-linecap="round"/></g>`);
  }
  // pusar kuncup di tengah: dua kelopak menggulung saling menutup
  s += `<path d="M${f(-r * 0.2)} ${f(r * 0.06)}C${f(-r * 0.24)} ${f(-r * 0.24)} ${f(r * 0.16)} ${f(-r * 0.3)} ${f(r * 0.2)} ${f(-r * 0.02)}C${f(r * 0.22)} ${f(r * 0.2)} ${f(-r * 0.1)} ${f(r * 0.22)} ${f(-r * 0.1)} ${f(r * 0.02)}C${f(-r * 0.1)} ${f(-r * 0.1)} ${f(r * 0.06)} ${f(-r * 0.12)} ${f(r * 0.06)} 0" fill="${dark}" stroke="${deep}" stroke-opacity=".6" stroke-width="${f(r * 0.03)}" stroke-linecap="round"/>`;
  s += `<path d="M${f(-r * 0.12)} ${f(-r * 0.06)}Q0 ${f(-r * 0.2)} ${f(r * 0.12)} ${f(-r * 0.08)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${f(r * 0.03)}" stroke-linecap="round"/>`;
  return s;
}

// ----- lily putih -----
export function paintLily(r: number, h: Hues) {
  const white = '#ffffff';
  const cream = '#f3eee3';
  const shade = mix(h.leafLight, '#b9c5a8', 60);
  const blush = mix(h.rose, '#fff', 14);
  const id = `rn-${hash(h.rose)}`;
  const g = `${id}p`;
  let s = `<defs>${grad(g, [[0, white], [0.55, cream], [1, shade]])}</defs>`;
  const petal = (w: number, hh: number) =>
    `M0 0C${f(-w * 0.9)} ${f(-hh * 0.18)} ${f(-w * 0.9)} ${f(-hh * 0.7)} ${f(-w * 0.12)} ${f(-hh * 0.97)}Q0 ${f(-hh * 1.08)} ${f(w * 0.12)} ${f(-hh * 0.97)}C${f(w * 0.9)} ${f(-hh * 0.7)} ${f(w * 0.9)} ${f(-hh * 0.18)} 0 0Z`;
  // tiga kelopak luar lebar, tiga kelopak dalam sedikit lebih sempit & terang
  for (const [off, w, hh, op] of [[0, 0.5, 1, 1], [60, 0.46, 0.94, 1]] as const) {
    s += ring(3, off, (a) => `<g transform="rotate(${f(a)})"><path d="${petal(w * r, hh * r)}" fill="url(#${g})" stroke="${shade}" stroke-opacity="${op * 0.55}" stroke-width=".5"/><path d="M0 ${f(-r * 0.12)}L0 ${f(-hh * r * 0.84)}" stroke="${shade}" stroke-opacity=".7" stroke-width=".6" stroke-linecap="round"/><path d="M0 ${f(-hh * r * 0.5)}Q${f(-w * r * 0.4)} ${f(-hh * r * 0.62)} ${f(-w * r * 0.55)} ${f(-hh * r * 0.5)}" stroke="${blush}" stroke-opacity=".5" stroke-width=".5" fill="none"/></g>`);
  }
  // kerongkongan hijau muda + bintik halus
  s += `<circle r="${f(r * 0.14)}" fill="#c9d89a" fill-opacity=".85"/>`;
  s += ring(6, 10, (a) => `<circle cx="0" cy="${f(-r * 0.3)}" r="${f(r * 0.016)}" transform="rotate(${f(a)})" fill="${mix(h.rose, '#7a2a40', 70)}" fill-opacity=".5"/>`);
  // benang sari: tangkai + kepala sari oranye
  s += ring(6, 25, (a) => {
    const len = r * (0.5 + 0.04 * Math.sin(a));
    const tx = Math.sin(rad(a)) * len;
    const ty = -Math.cos(rad(a)) * len;
    return `<path d="M0 0L${f(tx)} ${f(ty)}" stroke="#d8d3b4" stroke-width="${f(r * 0.022)}" stroke-linecap="round"/><ellipse cx="${f(tx)}" cy="${f(ty)}" rx="${f(r * 0.034)}" ry="${f(r * 0.085)}" transform="rotate(${f(a + 90 - 90)} ${f(tx)} ${f(ty)})" fill="#dd9b3a"/>`;
  });
  return s;
}

// ----- kuncup & buah -----
export function paintBud(r: number, h: Hues) {
  const id = `rb-${hash(h.rose)}`;
  let s = `<defs>${grad(id, [[0, mix(h.rose, '#fff', 50)], [1, mix(h.rose, '#4a1428', 80)]])}</defs>`;
  s += `<path d="M0 0C${f(-r * 0.7)} ${f(-r * 0.3)} ${f(-r * 0.6)} ${f(-r * 1.3)} 0 ${f(-r * 1.7)}C${f(r * 0.6)} ${f(-r * 1.3)} ${f(r * 0.7)} ${f(-r * 0.3)} 0 0Z" fill="url(#${id})"/>`;
  s += `<path d="M${f(-r * 0.12)} ${f(-r * 0.4)}Q${f(r * 0.1)} ${f(-r * 1)} 0 ${f(-r * 1.55)}" stroke="#fff" stroke-opacity=".4" stroke-width=".6" fill="none" stroke-linecap="round"/>`;
  // kelopak hijau penyangga
  for (const sx of [-1, 1]) s += `<path d="M0 0C${f(sx * r * 0.9)} ${f(-r * 0.1)} ${f(sx * r * 0.7)} ${f(-r * 0.75)} ${f(sx * r * 0.18)} ${f(-r * 0.85)}C${f(sx * r * 0.3)} ${f(-r * 0.5)} ${f(sx * r * 0.2)} ${f(-r * 0.2)} 0 0Z" fill="${h.leaf}" stroke="${h.leafDark}" stroke-opacity=".5" stroke-width=".4"/>`;
  return s;
}

function berries(h: Hues, pts: [number, number, number][]) {
  return pts.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${mix(h.rose, '#fff', 36)}" stroke="${mix(h.rose, '#5a1c34', 70)}" stroke-opacity=".5" stroke-width=".4"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.3)}" fill="#fff" fill-opacity=".7"/>`).join('');
}

// Tangkai bercabang dengan daun berselang-seling sepanjang kurva.
function branch(p0: [number, number], p1: [number, number], p2: [number, number], n: number, L: number, h: Hues, wineEvery = 0) {
  let s = `<path d="M${f(p0[0])} ${f(p0[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}" fill="none" stroke="${h.leafDark}" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.6) / (n + 0.2);
    const pt = along(p0, p1, p2, t);
    const side = i % 2 ? 1 : -1;
    const size = L * (1 - t * 0.35);
    const tint = wineEvery && i % wineEvery === wineEvery - 1 ? 'wine' : 'green';
    s += put(pt.x, pt.y, pt.ang + side * 48, 1, paintLeaf(size, size * 0.3, h, tint));
  }
  const end = along(p0, p1, p2, 1);
  s += put(end.x, end.y, end.ang, 1, paintLeaf(L * 0.7, L * 0.2, h));
  return s;
}

// ----- rangkaian -----
// Sudut kiri-atas, kotak 0 0 170 170: dua lengan (menyusuri tepi atas & kiri) dengan kelompok bunga lebat di sudut.
export function romanticCorner(h: Hues = ROMANTIC_HUES) {
  let s = '';
  // lengan atas & kiri (daun dulu, di belakang)
  s += branch([34, 18], [90, 2], [158, 14], 7, 24, h, 3);
  s += branch([16, 34], [2, 90], [14, 156], 7, 24, h, 3);
  s += branch([30, 40], [70, 70], [130, 110], 6, 26, h, 3); // diagonal ke dalam
  s += berries(h, [[118, 8, 2.4], [126, 12, 2], [111, 13, 1.8], [12, 118, 2.4], [8, 126, 2], [14, 132, 1.8]]);
  // lily besar di belakang, mawar utama menumpuk di depannya
  s += put(70, 50, 24, 1, paintLily(36, h));
  s += put(34, 76, -20, 1, paintLily(24, h));
  s += put(104, 22, 14, 1, paintRose(15, h));
  s += put(20, 108, -8, 1, paintRose(14, h));
  s += put(46, 44, 8, 1, paintRose(31, h));
  s += put(88, 82, -10, 1, paintRose(18, h));
  // kuncup di ujung lengan
  s += put(138, 24, 78, 1, paintBud(6, h));
  s += put(24, 138, 168, 1, paintBud(6, h));
  s += put(118, 104, 118, 1, paintBud(5.5, h));
  return s;
}

// Pemisah horizontal, kotak 0 0 240 40: kelompok mawar + lily di tengah, ranting berdaun meruncing ke kedua sisi.
export function romanticDivider(h: Hues = ROMANTIC_HUES) {
  let s = '';
  s += branch([120, 22], [70, 34], [6, 24], 6, 15, h, 3);
  s += branch([120, 22], [170, 34], [234, 24], 6, 15, h, 3);
  s += put(150, 20, 20, 1, paintLily(15, h));
  s += put(92, 22, -18, 1, paintLily(12, h));
  s += put(122, 20, 4, 1, paintRose(14, h));
  s += put(66, 24, 0, 1, paintRose(8, h));
  s += put(176, 24, 0, 1, paintRose(8.5, h));
  s += put(40, 22, -90, 1, paintBud(4, h));
  s += put(202, 22, 90, 1, paintBud(4, h));
  s += berries(h, [[18, 20, 1.6], [24, 24, 1.3], [220, 21, 1.6], [214, 25, 1.3]]);
  return s;
}

// Ranting kecil, kotak 0 0 130 70.
export function romanticSprig(h: Hues = ROMANTIC_HUES) {
  let s = branch([6, 56], [50, 62], [118, 22], 6, 16, h, 3);
  s += put(94, 34, 10, 1, paintRose(12, h));
  s += put(70, 44, -20, 1, paintLily(10, h));
  s += put(112, 18, 60, 1, paintBud(4.5, h));
  s += berries(h, [[24, 52, 1.6], [30, 56, 1.3]]);
  return s;
}
