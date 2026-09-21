// Registry desain (tema) template. Satu desain = palet warna + font + "motif" visual (ornamen, partikel,
// bingkai foto, gaya hitung mundur, efek sampul) yang dirender di web (apps/web/.../motifs.ts, kunci = id).
// Tema terinspirasi GAYA UMUM (suku, agama, perayaan, genre kartun/game/film, musim): tidak memakai
// karakter, logo, atau nama merek berhak cipta.

export type ThemeGroup = 'klasik' | 'suku' | 'agama' | 'perayaan' | 'kartun' | 'game' | 'film' | 'musim';
export type HeadingFont = 'script' | 'serif' | 'sans' | 'display' | 'cinzel' | 'pixel' | 'round';
export type BodyFont = 'serif' | 'sans' | 'round';

export const GROUP_LABEL: Record<ThemeGroup, string> = {
  klasik: 'Klasik',
  suku: 'Suku & Budaya',
  agama: 'Religi',
  perayaan: 'Perayaan',
  kartun: 'Kartun',
  game: 'Video Game',
  film: 'Film',
  musim: 'Musim',
};
export const GROUP_ORDER: ThemeGroup[] = ['klasik', 'suku', 'agama', 'perayaan', 'kartun', 'game', 'film', 'musim'];

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
}

const d = (
  id: string,
  name: string,
  group: ThemeGroup,
  blurb: string,
  colors: [string, string, string, string],
  fonts: [HeadingFont, BodyFont],
  fixedColors = false,
): Design => ({ id, name, group, blurb, primary: colors[0], secondary: colors[1], background: colors[2], text: colors[3], headingFont: fonts[0], bodyFont: fonts[1], ...(fixedColors ? { fixedColors } : {}) });

export const DESIGNS: Design[] = [
  // ---- Klasik ----
  d('rustic', 'Rustic Klasik', 'klasik', 'Hangat dan bersahaja dengan nuansa kayu dan tanah.', ['#8a5a3c', '#c9a27e', '#fbf6ef', '#3b2a20'], ['serif', 'sans']),
  d('floral', 'Floral Romantis', 'klasik', 'Bunga-bunga lembut dengan tulisan tangan yang manis.', ['#c4587a', '#e9b7c6', '#fff7f9', '#4a2c38'], ['script', 'sans']),
  d('elegant', 'Elegan Emas', 'klasik', 'Mewah dan bersahaja dengan aksen emas.', ['#b08d3c', '#1f2a44', '#f7f5f0', '#1f2a44'], ['serif', 'serif']),

  // ---- Suku & Budaya ----
  d('jawa', 'Batik Jawa', 'suku', 'Motif kawung dan warna sogan khas keraton Jawa.', ['#8b5a2b', '#d4a94f', '#f6ecd9', '#3a2412'], ['display', 'serif']),
  d('sunda', 'Tatar Sunda', 'suku', 'Hijau bambu dan daun yang sejuk, ringan seperti angklung.', ['#3f7a4e', '#c9b26a', '#f4f8ee', '#20321f'], ['display', 'sans']),
  d('minang', 'Songket Minang', 'suku', 'Merah-emas songket dengan pola pucuk rebung.', ['#a3192a', '#d9a520', '#fdf3e3', '#3a1216'], ['display', 'sans']),
  d('batak', 'Ulos Batak', 'suku', 'Garis dan zigzag ulos dalam merah, hitam, dan putih.', ['#8e1b1b', '#2b2b2b', '#f7f1e8', '#221a17'], ['cinzel', 'sans']),
  d('bali', 'Pesona Bali', 'suku', 'Emas, teratai, dan kamboja yang berguguran.', ['#c8871a', '#2f6d5a', '#fff8e8', '#33240f'], ['display', 'serif']),

  // ---- Religi ----
  d('islami', 'Islami Arabesque', 'agama', 'Pola geometris arabesque dengan hijau zamrud dan emas.', ['#1f6f5c', '#c9a84a', '#f4f9f6', '#17352d'], ['display', 'serif']),
  d('kristiani', 'Kristiani Lily', 'agama', 'Putih lembut, lily, dan merpati damai.', ['#6b7fa3', '#d7c48a', '#fbfaf6', '#2b3350'], ['script', 'serif']),
  d('buddha', 'Buddha Teratai', 'agama', 'Teratai dan lentera dengan warna safron yang tenteram.', ['#c46a1a', '#e8b04a', '#fff8ec', '#402a10'], ['display', 'serif']),

  // ---- Perayaan ----
  d('natal', 'Natal Salju', 'perayaan', 'Merah-hijau Natal, bintang, dan salju yang turun.', ['#b3202a', '#2f6b45', '#fbf6ee', '#2a1a17'], ['script', 'serif'], true),
  d('imlek', 'Imlek Lentera', 'perayaan', 'Merah-emas meriah dengan lentera yang terbang.', ['#c1121f', '#f0b429', '#fff4e0', '#3a0d0d'], ['display', 'serif'], true),
  d('valentine', 'Valentine Hati', 'perayaan', 'Merah muda manis dengan hati yang melayang naik.', ['#d6336c', '#f7a8c4', '#fff5f8', '#4a1a2c'], ['script', 'sans']),
  d('kemerdekaan', 'Merah Putih 17 Agustus', 'perayaan', 'Semangat kemerdekaan dengan bendera dan konfeti.', ['#d62828', '#1d3557', '#fff9f5', '#1d1d1d'], ['display', 'sans'], true),
  d('lebaran', 'Lebaran Syawal', 'perayaan', 'Ketupat, bulan sabit, dan lampion syawal.', ['#1b7f5f', '#e0b050', '#f3faf4', '#173a2e'], ['display', 'serif']),
  d('tahunbaru', 'Malam Tahun Baru', 'perayaan', 'Kembang api emas di langit malam biru tua.', ['#e5b84a', '#8fa6ff', '#0d1430', '#f4ecd0'], ['cinzel', 'sans'], true),
  d('halloween', 'Halloween Misteri', 'perayaan', 'Ungu-oranye misterius dengan kelelawar melintas.', ['#e8590c', '#7c5cd6', '#1a1325', '#f1e6ff'], ['display', 'sans'], true),

  // ---- Kartun ----
  d('kerajaan-es', 'Kerajaan Es', 'kartun', 'Putri negeri es: kristal salju dan kilau biru muda.', ['#3a8fd1', '#bfe3f7', '#eef8ff', '#16364f'], ['script', 'sans']),
  d('ceria', 'Petualangan Ceria', 'kartun', 'Warna cerah, awan bergoyang, dan huruf membulat.', ['#ff6b35', '#ffd23f', '#fff9e6', '#2a2a4a'], ['round', 'round']),
  d('sakura-anime', 'Sakura Pastel', 'kartun', 'Gaya anime pastel dengan kelopak sakura dan kilauan.', ['#e75a97', '#b8a1ff', '#fff5fb', '#3b2a4d'], ['round', 'round']),
  d('dongeng', 'Negeri Dongeng', 'kartun', 'Buku cerita dengan kastil, bulan, dan bintang berkelip.', ['#7b5ea7', '#f2c96b', '#f7f2ff', '#33274d'], ['script', 'serif']),

  // ---- Video Game ----
  d('pixel', 'Pixel Adventure', 'game', 'Retro 8-bit: nyawa hati, koin, dan tulisan piksel.', ['#e63946', '#2a9d8f', '#fdf0d5', '#1d1d2e'], ['pixel', 'sans']),
  d('player-one', 'Player One', 'game', 'Antarmuka HUD: bar XP, level up, dan neon di layar gelap.', ['#00e5ff', '#ff2d95', '#0b0f1e', '#e8f0ff'], ['cinzel', 'sans'], true),
  d('rpg', 'Quest Kerajaan', 'game', 'Perkamen, rune, dan bara api dalam kisah RPG fantasi.', ['#8b5e34', '#c9a227', '#efe0c0', '#3a2a14'], ['cinzel', 'serif']),
  d('neon', 'Neon Arcade', 'game', 'Synthwave neon merah muda dan cyan dengan garis pemindai.', ['#ff2e97', '#2ee6ff', '#120a24', '#f5e9ff'], ['display', 'sans'], true),

  // ---- Film ----
  d('hollywood', 'Hollywood Klasik', 'film', 'Art deco hitam-emas, gulungan film, dan lampu sorot.', ['#c9a227', '#f2e8cf', '#141414', '#f2e8cf'], ['cinzel', 'serif'], true),
  d('galaksi', 'Galaksi Cinta', 'film', 'Opera luar angkasa: bintang, nebula, dan cincin orbit.', ['#7c5cff', '#39c5ff', '#0a0e27', '#e6ecff'], ['cinzel', 'sans'], true),
  d('sihir', 'Akademi Sihir', 'film', 'Perkamen, lilin melayang, dan bintang keajaiban.', ['#d4a84b', '#9b5de5', '#2a1f3d', '#f0e6c8'], ['cinzel', 'serif'], true),
  d('paris', 'Paris Romantis', 'film', 'Komedi romantis: mawar pudar, kelopak, dan waltz.', ['#d4778a', '#b9a06a', '#fdf6f0', '#3a2a2e'], ['script', 'serif']),

  // ---- Musim ----
  d('semi', 'Musim Semi', 'musim', 'Sakura mekar dan kelopak yang berguguran lembut.', ['#e88fb0', '#9bc48f', '#fff8fa', '#4a3040'], ['script', 'sans']),
  d('panas', 'Musim Panas', 'musim', 'Pantai, matahari, dan gelembung ombak yang ceria.', ['#0d9488', '#f59e0b', '#f0fbfa', '#0f3d3a'], ['round', 'round']),
  d('gugur', 'Musim Gugur', 'musim', 'Daun maple keemasan yang jatuh perlahan.', ['#b45309', '#7c2d12', '#fdf3e4', '#3d2410'], ['display', 'serif']),
  d('salju', 'Musim Dingin', 'musim', 'Salju turun tenang dengan biru es dan lonceng.', ['#4b7bb5', '#dbe9f7', '#f4f9ff', '#1c2f4a'], ['script', 'sans']),
];

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

// Dua varian warna otomatis (hangat/sejuk) dengan menggeser rona aksen; latar & teks tetap agar keterbacaan terjaga.
export function autoPalettes(design: Design): Palette[] {
  if (design.fixedColors) return [];
  return [
    { id: 'hangat', name: 'Varian hangat', primary: shiftHue(design.primary, 28), secondary: shiftHue(design.secondary, 28), background: design.background, text: design.text },
    { id: 'sejuk', name: 'Varian sejuk', primary: shiftHue(design.primary, -42), secondary: shiftHue(design.secondary, -42), background: design.background, text: design.text },
  ];
}

export const baseColors = (design: Design) => ({ primary: design.primary, secondary: design.secondary, background: design.background, text: design.text });
