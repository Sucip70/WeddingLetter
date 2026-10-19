// Registry desain (tema) template. Satu desain = palet warna + font + "motif" visual (ornamen, partikel,
// bingkai foto, gaya hitung mundur, efek sampul) yang dirender di web (apps/web/.../motifs.ts, kunci = id).
// Registry ini hanya memuat desain yang masih memiliki template published.

export type ThemeGroup = 'klasik' | 'suku' | 'film' | 'musim';
export type HeadingFont = 'script' | 'serif' | 'sans' | 'display' | 'cinzel' | 'pixel' | 'round' | 'libre';
export type BodyFont = 'serif' | 'sans' | 'round' | 'source';

export const GROUP_LABEL: Record<ThemeGroup, string> = {
  klasik: 'Klasik',
  suku: 'Suku & Budaya',
  film: 'Fantasi',
  musim: 'Musim',
};
export const GROUP_ORDER: ThemeGroup[] = ['klasik', 'suku', 'film', 'musim'];

// Gerbang pembuka undangan Premium: adegan animasi (pintu, amplop, tirai, ...) yang harus diketuk sebelum
// sampul terlihat. Dirender di web (apps/web/.../gates.tsx, kunci = id). 'none' = tanpa gerbang.
export const GATE_LABEL = {
  portal: 'Portal sihir',
  ring: 'Kotak cincin',
  leaves: 'Surat daun gugur',
  taman: 'Surat daun hijau',
  frost: 'Surat kristal es',
  sakura: 'Surat kelopak sakura',
  twine: 'Surat bertali goni',
  bouquet: 'Lempar buket',
  kayon: 'Kayon Sekar Keraton',
  gonjong: 'Gonjong Pusako Minang',
  ulos: 'Simpul ulos Horas Nauli',
  paras: 'Kembar Bentar Pawiwahan Agung',
  lentera: 'Lentera Hong Xi',
} as const;
export type GateKind = keyof typeof GATE_LABEL;
export const GATE_KINDS = Object.keys(GATE_LABEL) as GateKind[];
export type GateSetting = GateKind | 'none';

export interface Palette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface Design {
  id: string;
  name: string;
  group: ThemeGroup;
  blurb: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  headingFont: HeadingFont;
  bodyFont: BodyFont;
  // Warna tetap (mis. Merah Putih): tidak dibuatkan varian warna otomatis.
  fixedColors?: boolean;
  // Gerbang pembuka bawaan (dipakai template Premium; admin bisa menggantinya di builder).
  gate: GateKind;
}

const d = (
  id: string,
  name: string,
  group: ThemeGroup,
  blurb: string,
  colors: [string, string, string, string],
  fonts: [HeadingFont, BodyFont],
  fixedColors = false,
): Omit<Design, 'gate'> => ({ id, name, group, blurb, primary: colors[0], secondary: colors[1], background: colors[2], text: colors[3], headingFont: fonts[0], bodyFont: fonts[1], ...(fixedColors ? { fixedColors } : {}) });

const BASE_DESIGNS: Omit<Design, 'gate'>[] = [
  d('rustic', 'Rustic Klasik', 'klasik', 'Hangat dan bersahaja dengan nuansa kayu dan tanah.', ['#8a5a3c', '#c9a27e', '#fbf6ef', '#3b2a20'], ['serif', 'sans']),
  d('floral', 'Floral Romantis', 'klasik', 'Bunga-bunga lembut dengan tulisan tangan yang manis.', ['#c4587a', '#e9b7c6', '#fff7f9', '#4a2c38'], ['script', 'sans']),
  d('buket', 'Buket Pengantin', 'klasik', 'Putih bersih dihiasi mawar, peony, dan bunga warna-warni dalam satu buket.', ['#4f7a63', '#ef8fa8', '#ffffff', '#33423a'], ['script', 'serif']),
  d('garden', 'Taman Botani', 'klasik', 'Daun teh dan bunga liar di atas kertas gading, dengan bingkai berukir bersudut filigran.', ['#4a6b2f', '#b99a3a', '#f7f5ea', '#2a3722'], ['display', 'serif']),
  d('lavender', 'Ladang Lavender', 'klasik', 'Dahlia, anemon, dan hortensia ungu dengan ranting lavender yang berjalan rapi di tepi bingkai.', ['#6b3fa0', '#c4aef0', '#faf7ff', '#2d2147'], ['script', 'serif']),
  d('hortensia', 'Hortensia Turquoise', 'klasik', 'Hortensia biru tosca dan navy dengan ranting tipis berbunga mungil, di atas putih yang bersih.', ['#0f7a8c', '#6fd4e0', '#f4fbfc', '#0f2f3a'], ['serif', 'serif']),
  d('marigold', 'Marigold Senja', 'klasik', 'Marigold, dahlia, dan poppy oranye hangat dengan buah beri merah dan daun zaitun.', ['#b8500f', '#f6b83a', '#fffaf0', '#4a2410'], ['display', 'serif']),
  d('elegant', 'Elegan Emas', 'klasik', 'Mewah dan bersahaja dengan aksen emas.', ['#b08d3c', '#1f2a44', '#f7f5f0', '#1f2a44'], ['serif', 'serif']),
  d('wisteria', 'Wisteria Biru', 'klasik', 'Wisteria biru dan periwinkle yang lembut.', ['#3f5fb0', '#9fb4f0', '#f6f8ff', '#1a2547'], ['serif', 'serif']),
  d('jawa-sekar-keraton', 'Sekar Keraton', 'suku', 'Keanggunan pendopo Jawa dalam sogan, marun, dan emas.', ['#74401f', '#aa7d38', '#ead6ad', '#3a291e'], ['libre', 'source'], true),
  d('pusako-minang', 'Pusako Minang', 'suku', 'Gonjong, ukiran kayu, dan songket dalam marun, sogan, dan emas.', ['#681813', '#b9853f', '#efe1c4', '#211712'], ['libre', 'source'], true),
  d('horas-nauli', 'Horas Nauli', 'suku', 'Ulos Ragi Hotang merah dan hitam dengan simpul tenun dan gorga yang halus.', ['#8b211c', '#8c5a3d', '#e9ddc8', '#151313'], ['libre', 'source'], true),
  d('pawiwahan-agung', 'Pawiwahan Agung', 'suku', 'Candi bentar batu paras, prada tua, dan merah bata dalam upacara yang khidmat.', ['#873e32', '#a77a38', '#eee0c7', '#332923'], ['serif', 'source'], true),
  d('hong-xi', 'Hong Xi', 'suku', 'Merah dan emas yang meriah namun modern: lentera, awan emas, koi, dan medali kebahagiaan ganda.', ['#a3151f', '#d9a94c', '#9d1420', '#f7ebd0'], ['serif', 'source'], true),
  d('galaksi', 'Galaksi Cinta', 'film', 'Opera luar angkasa: bintang, nebula, dan cincin orbit.', ['#7c5cff', '#39c5ff', '#0a0e27', '#e6ecff'], ['cinzel', 'sans'], true),
  d('sihir', 'Akademi Sihir', 'film', 'Perkamen, lilin melayang, dan bintang keajaiban.', ['#d4a84b', '#9b5de5', '#2a1f3d', '#f0e6c8'], ['cinzel', 'serif'], true),
  d('semi', 'Musim Semi', 'musim', 'Sakura mekar dan kelopak yang berguguran lembut.', ['#e88fb0', '#9bc48f', '#fff8fa', '#4a3040'], ['script', 'sans']),
  d('panas', 'Musim Panas', 'musim', 'Pantai, matahari, dan gelembung ombak yang ceria.', ['#0d9488', '#f59e0b', '#f0fbfa', '#0f3d3a'], ['round', 'round']),
  d('gugur', 'Musim Gugur', 'musim', 'Daun maple keemasan yang jatuh perlahan.', ['#b45309', '#7c2d12', '#fdf3e4', '#3d2410'], ['display', 'serif']),
  d('salju', 'Musim Dingin', 'musim', 'Salju turun tenang dengan biru es dan lonceng.', ['#4b7bb5', '#8fb4de', '#f4f9ff', '#1c2f4a'], ['script', 'sans']),
];

// Gerbang bawaan per desain (alasan pemilihan ada di riwayat diskusi: sesuaikan dengan adegan tema).
const DESIGN_GATES: Record<string, GateKind> = {
  rustic: 'twine', floral: 'sakura', elegant: 'ring',
  buket: 'bouquet', garden: 'taman', lavender: 'sakura', hortensia: 'sakura', marigold: 'leaves', wisteria: 'sakura',
  galaksi: 'portal', sihir: 'portal', semi: 'sakura', panas: 'sakura', gugur: 'leaves', salju: 'frost',
  'jawa-sekar-keraton': 'kayon', 'pusako-minang': 'gonjong', 'horas-nauli': 'ulos', 'pawiwahan-agung': 'paras', 'hong-xi': 'lentera',
};

export const DESIGNS: Design[] = BASE_DESIGNS.map((x) => ({ ...x, gate: DESIGN_GATES[x.id]! }));

export const DESIGN_IDS = DESIGNS.map((x) => x.id);
export const designById = (id: string | undefined) => DESIGNS.find((x) => x.id === id);

// ---- Palet warna ----

// Delapan warna untuk template Basic (dan desain klasik yang sama di paket lebih tinggi).
export const BASIC_PALETTES: Palette[] = [
  { id: 'coklat-rustic', name: 'Coklat Rustic', primary: '#8a5a3c', secondary: '#c9a27e', background: '#fbf6ef', text: '#3b2a20' },
  { id: 'mawar-pudar', name: 'Mawar Pudar', primary: '#b76e79', secondary: '#e8c4c4', background: '#fdf5f3', text: '#4a2c30' },
  { id: 'hijau-sage', name: 'Hijau Sage', primary: '#5f7a63', secondary: '#b7c9b0', background: '#f4f8f1', text: '#243428' },
  { id: 'biru-laut', name: 'Biru Laut', primary: '#2f6f8f', secondary: '#a9d1e3', background: '#f2f9fc', text: '#173548' },
  { id: 'lavender', name: 'Lavender', primary: '#7b6aa8', secondary: '#cfc2ec', background: '#f8f5fd', text: '#2d2547' },
  { id: 'terakota', name: 'Terakota', primary: '#c0553a', secondary: '#e6a98f', background: '#fdf3ee', text: '#4a2016' },
  { id: 'merah-marun', name: 'Merah Marun', primary: '#7a2233', secondary: '#d9a5ae', background: '#fdf4f5', text: '#3b1119' },
  { id: 'hitam-putih', name: 'Hitam Putih', primary: '#222222', secondary: '#9a9a9a', background: '#ffffff', text: '#222222' },
];

// Desain klasik yang punya paket Basic (Rp20.000, 8 warna siap pakai). Sisanya hanya Standard & Premium.
export const BASIC_DESIGN_IDS: readonly string[] = ['rustic', 'floral', 'elegant', 'buket', 'garden'];

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  const h = max === r ? (g - b) / (max - min) + (g < b ? 6 : 0) : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

export function shiftHue(hex: string, degrees: number) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex((h + degrees + 360) % 360, s, l);
}

// Palet pilihan tangan untuk desain yang warnanya tidak cocok digeser rona (Elegan: emas bila digeser jadi hijau limau / merah).
// Emas/logam tetap jadi aksen; warna gelap (teks) dipakai juga untuk gerbang & hitung mundur, jadi harus pekat.
// Buket Pengantin: latar tetap putih; warna sekunder = warna bunga utama (mawar), jadi tiap palet mengganti "suasana" buketnya.
// Palet pertama sama dengan warna bawaan desain. Warna utama cukup gelap (≥ 4:1 di atas putih) karena dipakai untuk judul & tombol.
const BUKET_PALETTES: Palette[] = [
  { id: 'blush', name: 'Blush & Sage', primary: '#4f7a63', secondary: '#ef8fa8', background: '#ffffff', text: '#33423a' },
  { id: 'persik', name: 'Persik & Zaitun', primary: '#657a3d', secondary: '#f4a06f', background: '#ffffff', text: '#3b3f2a' },
  { id: 'lavender', name: 'Lavender', primary: '#7a64a8', secondary: '#b79fe2', background: '#ffffff', text: '#35304f' },
  { id: 'langit', name: 'Biru Langit', primary: '#476f9a', secondary: '#8fbbe8', background: '#ffffff', text: '#2f3b4d' },
  { id: 'mentega', name: 'Kuning Mentega', primary: '#8d6f21', secondary: '#f6cf5f', background: '#ffffff', text: '#4a3d1e' },
  { id: 'mawar', name: 'Mawar', primary: '#a8506b', secondary: '#e8789a', background: '#ffffff', text: '#4a2c38' },
  { id: 'koral', name: 'Koral', primary: '#ad5642', secondary: '#f4806f', background: '#ffffff', text: '#4a2b24' },
];

// Taman Botani: warna utama = hijau daun (judul, tombol, garis bingkai, dan warna daun pada ornamen), sekunder = emas kekuningan
// (aksen tanggal), latar gading kehijauan. Warna utama cukup gelap (≥ 4,5:1 di atas latar) karena dipakai untuk judul & tombol.
const GARDEN_PALETTES: Palette[] = [
  { id: 'olive', name: 'Hijau Olive', primary: '#4a6b2f', secondary: '#b99a3a', background: '#f7f5ea', text: '#2a3722' },
  { id: 'hutan', name: 'Hijau Hutan', primary: '#2f5a3a', secondary: '#b99a3a', background: '#f3f6ec', text: '#1f3025' },
  { id: 'eukaliptus', name: 'Eukaliptus', primary: '#3f6b5f', secondary: '#b8995a', background: '#f2f7f4', text: '#1e3430' },
  { id: 'zaitun-terakota', name: 'Zaitun & Terakota', primary: '#5d6b2c', secondary: '#c0714a', background: '#f8f4e9', text: '#33351e' },
  { id: 'sage', name: 'Sage Lembut', primary: '#52735a', secondary: '#c9aa55', background: '#f6f8f1', text: '#26362a' },
  { id: 'lumut-rose', name: 'Lumut & Rose', primary: '#46603a', secondary: '#c28b7c', background: '#f9f5ee', text: '#2e3a28' },
];

// Palet khusus paket Basic per desain; desain yang tidak tercantum memakai 8 warna siap pakai (BASIC_PALETTES).
export const basicPalettes = (designId: string): Palette[] => (designId === 'buket' ? BUKET_PALETTES : designId === 'garden' ? GARDEN_PALETTES : BASIC_PALETTES);

// Tiga desain berwarna dominan. Warna utama = warna bunga utama (dilunakkan jadi nada pastel di ornamen) sekaligus judul & tombol,
// jadi harus cukup gelap (≥ 4,5:1 di atas latar); sekunder = bunga pendamping & aksen tanggal.
const LAVENDER_PALETTES: Palette[] = [
  { id: 'ungu-lilac', name: 'Ungu Lilac', primary: '#6b3fa0', secondary: '#c4aef0', background: '#faf7ff', text: '#2d2147' },
  { id: 'amethyst', name: 'Amethyst', primary: '#5b2f8f', secondary: '#b48be0', background: '#f8f4fd', text: '#281a3d' },
  { id: 'anggrek', name: 'Ungu Anggrek', primary: '#8a3f93', secondary: '#e3a7e8', background: '#fcf6fd', text: '#34163a' },
  { id: 'lavender-sage', name: 'Lavender & Sage', primary: '#6f5a9e', secondary: '#a9c2a0', background: '#f8f8fb', text: '#2b2745' },
  { id: 'plum-rose', name: 'Plum & Mawar', primary: '#7f3a8a', secondary: '#e8a0c0', background: '#fdf6f9', text: '#3a1a2c' },
  { id: 'indigo-ungu', name: 'Indigo Ungu', primary: '#5a3f9a', secondary: '#9a8fe0', background: '#f6f5fd', text: '#221d4a' },
];
const HORTENSIA_PALETTES: Palette[] = [
  { id: 'turquoise', name: 'Turquoise', primary: '#0f7a8c', secondary: '#6fd4e0', background: '#f4fbfc', text: '#0f2f3a' },
  { id: 'tosca-navy', name: 'Tosca & Navy', primary: '#1f5f8f', secondary: '#55c8d6', background: '#f3f9fc', text: '#10283d' },
  { id: 'biru-laut', name: 'Biru Laut', primary: '#14608a', secondary: '#7ad0e8', background: '#f2f9fd', text: '#0f2c40' },
  { id: 'teal-mint', name: 'Teal & Mint', primary: '#0f6f78', secondary: '#8fe0d6', background: '#f2fbf9', text: '#0f3036' },
  { id: 'navy-tosca', name: 'Navy & Tosca', primary: '#1f3f7a', secondary: '#3ec3cf', background: '#f5f8fc', text: '#14203d' },
];
const MARIGOLD_PALETTES: Palette[] = [
  { id: 'jingga', name: 'Jingga Hangat', primary: '#b8500f', secondary: '#f6b83a', background: '#fffaf0', text: '#4a2410' },
  { id: 'terakota-senja', name: 'Terakota Senja', primary: '#a8461f', secondary: '#f0a55a', background: '#fff6ec', text: '#47200f' },
  { id: 'kunyit', name: 'Kunyit', primary: '#9a5a0c', secondary: '#f4c542', background: '#fffbea', text: '#45290a' },
  { id: 'koral-oranye', name: 'Koral Oranye', primary: '#b5472f', secondary: '#f59a7a', background: '#fff5f0', text: '#4a1d12' },
  { id: 'persik-jingga', name: 'Persik', primary: '#a85624', secondary: '#f7c59a', background: '#fff8f2', text: '#4a2a14' },
];
const WISTERIA_PALETTES: Palette[] = [
  { id: 'wisteria-biru', name: 'Wisteria Biru', primary: '#3f5fb0', secondary: '#9fb4f0', background: '#f6f8ff', text: '#1a2547' },
  { id: 'periwinkle', name: 'Periwinkle', primary: '#4a55a8', secondary: '#a9b0ee', background: '#f6f6fd', text: '#1f2347' },
  { id: 'biru-safir', name: 'Biru Safir', primary: '#2a4f9a', secondary: '#8fb0e8', background: '#f4f8fd', text: '#10234a' },
  { id: 'biru-langit', name: 'Biru Langit', primary: '#34689e', secondary: '#9cc8ec', background: '#f5faff', text: '#162c44' },
  { id: 'biru-lilac', name: 'Biru Lilac', primary: '#4f4fb0', secondary: '#c0b4f0', background: '#f8f6ff', text: '#25214d' },
];

const CURATED_PALETTES: Record<string, Palette[]> = {
  buket: BUKET_PALETTES,
  garden: GARDEN_PALETTES,
  lavender: LAVENDER_PALETTES,
  hortensia: HORTENSIA_PALETTES,
  marigold: MARIGOLD_PALETTES,
  wisteria: WISTERIA_PALETTES,
  elegant: [
    { id: "zamrud", name: "Emas & Zamrud", primary: "#b08d3c", secondary: "#0f3d33", background: "#f4f7f3", text: "#12352c" },
    { id: "anggur", name: "Emas & Anggur", primary: "#b08d3c", secondary: "#5a1a2a", background: "#faf5f3", text: "#3a1420" },
    { id: "mawar-emas", name: "Rose Gold", primary: "#b4756b", secondary: "#3a2a30", background: "#faf4f2", text: "#2f2429" },
  ],
};

// Dua varian warna otomatis (hangat/sejuk) dengan menggeser rona aksen; latar & teks tetap agar keterbacaan terjaga.
export function autoPalettes(design: Design): Palette[] {
  if (design.fixedColors) return [];
  const curated = CURATED_PALETTES[design.id];
  if (curated) return curated;
  return [
    { id: 'hangat', name: 'Varian hangat', primary: shiftHue(design.primary, 28), secondary: shiftHue(design.secondary, 28), background: design.background, text: design.text },
    { id: 'sejuk', name: 'Varian sejuk', primary: shiftHue(design.primary, -42), secondary: shiftHue(design.secondary, -42), background: design.background, text: design.text },
  ];
}

export const baseColors = (design: Design) => ({ primary: design.primary, secondary: design.secondary, background: design.background, text: design.text });
