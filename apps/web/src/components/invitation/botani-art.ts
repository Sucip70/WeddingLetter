// Ilustrasi botani untuk desain "Taman Botani": daun teh/herba bergerigi, ranting, rumpun bunga liar kecil, dan sudut filigran
// (sulur berujung gulungan). Semuanya dibangkitkan secara prosedural menjadi potongan teks SVG (fungsi murni tanpa React), sama
// seperti flora-art.ts, jadi aman dipakai lewat dangerouslySetInnerHTML, data URI, dan di server. Warna daun diturunkan dari warna
// utama tema (--p) sehingga mengikuti palet; bunga liar putih keunguan tetap supaya terbaca di semua palet.
//
// Gambar ini dibuat sendiri dari bentuk botani umum (daun bergerigi, umbel), bukan salinan ilustrasi pihak lain.
import { put, rng } from './flora-art';

const f = (n: number) => (Math.round(n * 10) / 10).toString();

// Palet daun. `css` = turunan --p (untuk JSX); `fixed(hex)` = hex semua (untuk pratinjau lepas / data URI).
export interface Greens {
  dark: string;
  mid: string;
  light: string;
  pale: string;
  vein: string;
  flower: string;
  flowerEdge: string;
  bud: string;
  gold: string;
}
export const GREENS: Greens = {
  dark: 'color-mix(in srgb, var(--p, #4a6b2f) 92%, #000)',
  mid: 'color-mix(in srgb, var(--p, #4a6b2f) 74%, #fff)',
  light: 'color-mix(in srgb, var(--p, #4a6b2f) 50%, #fff)',
  pale: 'color-mix(in srgb, var(--p, #4a6b2f) 28%, #fff)',
  vein: 'color-mix(in srgb, var(--p, #4a6b2f) 70%, #000)',
  flower: '#fbf8ff',
  flowerEdge: '#b9a6d6',
  bud: '#cdbbe6',
  gold: '#c3a13c',
};
export function fixedGreens(primary: string): Greens {
  const mix = (a: string, b: string, t: number) => {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
  };
  return { ...GREENS, dark: mix(primary, '#000000', 0.08), mid: mix(primary, '#ffffff', 0.26), light: mix(primary, '#ffffff', 0.5), pale: mix(primary, '#ffffff', 0.72), vein: mix(primary, '#000000', 0.3) };
}

// Daun teh: lonjong runcing dengan tepi bergerigi halus (dipakai berulang pada ranting). Pangkal di (0,0), ujung di (L,0).
function teaLeafD(L: number, w: number, teeth = 9) {
  const top: string[] = [];
  const bottom: string[] = [];
  const n = teeth * 2;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const prof = w * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.85);
    const bump = i % 2 ? 0 : -prof * 0.14;
    const x = L * t;
    top.push(`${f(x)} ${f(-(prof + bump))}`);
    bottom.push(`${f(x)} ${f(prof + bump)}`);
  }
  return `M0 0L${top.join('L')}L${L} 0L${bottom.reverse().join('L')}Z`;
}
export function teaLeaf(L: number, w: number, c: Greens, fill = c.mid) {
  const veins = [0.25, 0.45, 0.65, 0.82]
    .map((t) => {
      const x = L * t;
      const y = w * 0.62 * Math.sin(Math.PI * t);
      return `M${f(x)} 0L${f(x + L * 0.13)} ${f(-y)}M${f(x)} 0L${f(x + L * 0.13)} ${f(y)}`;
    })
    .join('');
  return `<path d="${teaLeafD(L, w)}" fill="${fill}" stroke="${c.vein}" stroke-opacity=".55" stroke-width=".6" stroke-linejoin="round"/><path d="M0 0L${f(L * 0.96)} 0${veins}" fill="none" stroke="${c.vein}" stroke-opacity=".5" stroke-width=".55" stroke-linecap="round"/>`;
}

// Daun herba halus (lonjong tumpul), tanpa gerigi.
export function herbLeaf(L: number, w: number, c: Greens, fill = c.light) {
  const d = `M0 0C${f(L * 0.2)} ${f(-w)} ${f(L * 0.75)} ${f(-w)} ${f(L)} 0C${f(L * 0.75)} ${f(w)} ${f(L * 0.2)} ${f(w)} 0 0Z`;
  return `<path d="${d}" fill="${fill}" stroke="${c.vein}" stroke-opacity=".45" stroke-width=".5"/><path d="M0 0L${f(L * 0.9)} 0" stroke="${c.vein}" stroke-opacity=".4" stroke-width=".5" fill="none"/>`;
}

// Bunga liar kecil: lima kelopak bulat putih keunguan dengan pusat kuning-hijau.
export function wildflower(r: number, c: Greens, rot = 0) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += `<ellipse cx="0" cy="${f(-r * 0.62)}" rx="${f(r * 0.42)}" ry="${f(r * 0.62)}" transform="rotate(${f(rot + i * 72)})" fill="${c.flower}" stroke="${c.flowerEdge}" stroke-width="${f(Math.max(0.4, r * 0.06))}"/>`;
  }
  return s + `<circle r="${f(r * 0.22)}" fill="${c.gold}"/>`;
}

// Rumpun (umbel): tangkai tipis memencar ke bunga-bunga kecil dan kuncup.
export function umbel(R: number, count: number, c: Greens, seed: number) {
  const rnd = rng(seed);
  let s = '';
  const heads: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (i / (count - 1) - 0.5) * 2.2 + (rnd() - 0.5) * 0.25;
    const len = R * (0.62 + rnd() * 0.38);
    const x = Math.cos(a) * len;
    const y = Math.sin(a) * len;
    s += `<path d="M0 0Q${f(x * 0.35)} ${f(y * 0.55)} ${f(x)} ${f(y)}" fill="none" stroke="${c.vein}" stroke-opacity=".5" stroke-width=".6" stroke-linecap="round"/>`;
    heads.push(put(x, y, rnd() * 72, 1, i % 3 === 2 ? `<circle r="${f(R * 0.045)}" fill="${c.bud}" stroke="${c.flowerEdge}" stroke-width=".4"/>` : wildflower(R * (0.1 + rnd() * 0.04), c)));
  }
  return s + heads.join('');
}

// Ranting berdaun: batang melengkung dari (0,0) ke arah +x sepanjang `len`, daun teh berselang-seling mengecil ke ujung.
export function branch(len: number, leaves: number, leafL: number, c: Greens, seed: number, bend = 0.12) {
  const rnd = rng(seed);
  const cy = -len * bend;
  let s = `<path d="M0 0Q${f(len * 0.5)} ${f(cy)} ${f(len)} ${f(cy * 0.2)}" fill="none" stroke="${c.vein}" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/>`;
  for (let i = 0; i < leaves; i++) {
    const t = (i + 0.7) / (leaves + 0.2);
    const x = len * t;
    const y = 2 * (1 - t) * t * cy + t * t * (cy * 0.2);
    const side = i % 2 ? 1 : -1;
    const L = leafL * (1.05 - t * 0.5) * (0.92 + rnd() * 0.16);
    const rot = side * (38 + rnd() * 14);
    s += put(x, y, rot, 1, teaLeaf(L, L * 0.34, c, i % 3 === 0 ? c.mid : i % 3 === 1 ? c.light : c.dark));
  }
  s += put(len, cy * 0.2, 0, 1, teaLeaf(leafL * 0.55, leafL * 0.2, c, c.light));
  return s;
}

// Karangan sudut kiri-atas, kotak 0 0 170 170: dua ranting menjalar sepanjang tepi atas & kiri, rumpun daun di sudut,
// dan umbel bunga liar.
export function botaniCorner(c: Greens = GREENS) {
  let s = '';
  // ranting panjang di sepanjang dua tepi
  s += put(8, 26, -3, 1, branch(152, 9, 21, c, 11, 0.06));
  s += put(26, 8, 87, 1, branch(152, 9, 21, c, 23, -0.06));
  // rumpun daun kecil di sudut
  s += put(12, 12, 20, 1, teaLeaf(34, 10, c, c.dark));
  s += put(12, 12, 70, 1, teaLeaf(34, 10, c, c.dark));
  s += put(12, 12, 45, 1, teaLeaf(44, 12, c, c.mid));
  s += put(12, 12, 8, 1, herbLeaf(26, 6, c, c.pale));
  s += put(12, 12, 82, 1, herbLeaf(26, 6, c, c.pale));
  // bunga liar
  s += put(92, 36, 0, 1, umbel(26, 7, c, 5));
  s += put(36, 94, 0, 1, umbel(24, 7, c, 9));
  s += put(58, 58, 0, 1, umbel(20, 6, c, 14));
  s += put(130, 22, 0, 1, umbel(14, 4, c, 17));
  s += put(22, 132, 0, 1, umbel(14, 4, c, 21));
  return s;
}

// Pemisah horizontal, kotak 0 0 240 40: ranting mungil bercabang dua dari pusat dengan bunga di tengah.
export function botaniDivider(c: Greens = GREENS) {
  let s = `<path d="M6 20H66M174 20H234" stroke="${c.vein}" stroke-opacity=".45" stroke-width=".8" stroke-linecap="round"/>`;
  for (const side of [1, -1]) {
    s += put(120 + side * 14, 20, side === 1 ? 0 : 180, 1, branch(52, 4, 16, c, 31 + side, 0.1));
    s += put(120 + side * 76, 20, side === 1 ? 0 : 180, 1, herbLeaf(16, 4.5, c, c.pale));
  }
  s += put(120, 20, 0, 1, wildflower(8, c));
  s += put(104, 14, 0, 1, `<circle r="2" fill="${c.bud}" stroke="${c.flowerEdge}" stroke-width=".4"/>`);
  s += put(136, 26, 0, 1, `<circle r="2" fill="${c.bud}" stroke="${c.flowerEdge}" stroke-width=".4"/>`);
  return s;
}

// Ranting kecil (di bawah foto / footer), kotak 0 0 130 70.
export function botaniSprig(c: Greens = GREENS) {
  let s = put(4, 58, -20, 1, branch(112, 6, 22, c, 41, 0.1));
  s += put(100, 24, 0, 1, umbel(18, 5, c, 7));
  s += put(78, 40, 0, 1, wildflower(6, c, 20));
  return s;
}

// Gulungan (volute) halus: spiral yang menyusut dari jari-jari r ke ~r/5, dihaluskan lewat kurva kuadrat antar titik tengah.
function curl(cx: number, cy: number, r: number, turns: number, start: number, dir: 1 | -1) {
  const steps = Math.round(turns * 16);
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = start + dir * t * turns * 2 * Math.PI;
    const rr = r * (1 - 0.82 * t);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = '';
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]!;
    const [nx, ny] = pts[i + 1]!;
    d += `Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  return d;
}

// Sudut bingkai filigran kiri-atas, kotak 0 0 64 64: garis rangkap yang menekuk di sudut dan dua gulungan setangkup
// (ke kanan & ke bawah) yang tumbuh dari rumpun daun kecil di sudut.
export function filigreeCorner(stroke = 'currentColor', lines = true) {
  const line = (d: string, w = 1, o = 1) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let s = '';
  // `lines` = garis tepi rangkap ikut digambar; false bila bingkainya digambar CSS dan hanya hiasan sudutnya yang dibutuhkan.
  if (lines) {
    s += line('M2 62V16Q2 2 16 2H62', 1.4);
    s += line('M8 62V20Q8 8 20 8H62', 0.8, 0.7);
  }
  // gulungan sepanjang tepi atas: ekor melengkung lalu spiral searah jarum jam (menyusut ke dalam)
  s += line(`M17 15C25 7 35 10 43 9${curl(43, 16, 7, 1.15, -Math.PI / 2, 1)}`, 1.1);
  // setangkup terhadap diagonal untuk tepi kiri
  s += line(`M15 17C7 25 10 35 9 43${curl(16, 43, 7, 1.15, Math.PI, -1)}`, 1.1);
  // rumpun kecil di sudut: tiga daun menjari ke dalam + titik
  const leaf = 'M0 0C4 -4.5 10 -4.5 15 0C10 4.5 4 4.5 0 0Z';
  for (const rot of [20, 45, 70]) s += `<path d="${leaf}" transform="translate(13 13) rotate(${rot})" fill="${stroke}" fill-opacity="${rot === 45 ? 0.9 : 0.6}" stroke="${stroke}" stroke-width=".4"/>`;
  s += `<circle cx="13" cy="13" r="2.2" fill="${stroke}"/><circle cx="52" cy="6" r="1.1" fill="${stroke}"/><circle cx="6" cy="52" r="1.1" fill="${stroke}"/>`;
  return s;
}

// Hiasan tengah di atas kartu (flourish), kotak 0 0 120 16: sulur simetris dengan daun dan titik di tengah.
export function filigreeFlourish(stroke = 'currentColor') {
  const half = 'M60 8C54 8 50 4 44 4C38 4 36 9 40 10C44 11 45 6 41 6M44 4C34 0 22 3 14 8C10 10 6 10 2 8';
  const mirror = half.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${120 - Number(x)} ${y}`);
  const p = (d: string) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `${p(half)}${p(mirror)}<path d="M60 3L63 8L60 13L57 8Z" fill="${stroke}"/><circle cx="52" cy="8" r="1.2" fill="${stroke}"/><circle cx="68" cy="8" r="1.2" fill="${stroke}"/>`;
}
