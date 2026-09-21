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
  // Trek rekomendasi (urutan = prioritas). Standard mendapat 4 pertama, Premium seluruh pustaka.
  music: string[];
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
  music: string[],
  fixedColors = false,
): Design => ({ id, name, group, blurb, primary: colors[0], secondary: colors[1], background: colors[2], text: colors[3], headingFont: fonts[0], bodyFont: fonts[1], music, ...(fixedColors ? { fixedColors } : {}) });

export const DESIGNS: Design[] = [
  // ---- Klasik ----
  d('rustic', 'Rustic Klasik', 'klasik', 'Hangat dan bersahaja dengan nuansa kayu dan tanah.', ['#8a5a3c', '#c9a27e', '#fbf6ef', '#3b2a20'], ['serif', 'sans'], ['piano-romantis', 'gitar-akustik', 'kalimba-taman', 'waltz-paris']),
  d('floral', 'Floral Romantis', 'klasik', 'Bunga-bunga lembut dengan tulisan tangan yang manis.', ['#c4587a', '#e9b7c6', '#fff7f9', '#4a2c38'], ['script', 'sans'], ['kotak-musik', 'piano-romantis', 'harpa-nusantara', 'waltz-paris']),
  d('elegant', 'Elegan Emas', 'klasik', 'Mewah dan bersahaja dengan aksen emas.', ['#b08d3c', '#1f2a44', '#f7f5f0', '#1f2a44'], ['serif', 'serif'], ['piano-romantis', 'sinema-string', 'jazz-klasik', 'waltz-paris']),

  // ---- Suku & Budaya ----
  d('jawa', 'Batik Jawa', 'suku', 'Motif kawung dan warna sogan khas keraton Jawa.', ['#8b5a2b', '#d4a94f', '#f6ecd9', '#3a2412'], ['display', 'serif'], ['gamelan-slendro', 'harpa-nusantara', 'piano-romantis', 'kalimba-taman']),
  d('sunda', 'Tatar Sunda', 'suku', 'Hijau bambu dan daun yang sejuk, ringan seperti angklung.', ['#3f7a4e', '#c9b26a', '#f4f8ee', '#20321f'], ['display', 'sans'], ['kalimba-taman', 'gamelan-slendro', 'gitar-akustik', 'harpa-nusantara']),
  d('minang', 'Songket Minang', 'suku', 'Merah-emas songket dengan pola pucuk rebung.', ['#a3192a', '#d9a520', '#fdf3e3', '#3a1216'], ['display', 'sans'], ['harpa-nusantara', 'gitar-akustik', 'piano-romantis', 'gamelan-slendro']),
  d('batak', 'Ulos Batak', 'suku', 'Garis dan zigzag ulos dalam merah, hitam, dan putih.', ['#8e1b1b', '#2b2b2b', '#f7f1e8', '#221a17'], ['cinzel', 'sans'], ['harpa-nusantara', 'gitar-akustik', 'piano-romantis', 'sinema-string']),
  d('bali', 'Pesona Bali', 'suku', 'Emas, teratai, dan kamboja yang berguguran.', ['#c8871a', '#2f6d5a', '#fff8e8', '#33240f'], ['display', 'serif'], ['gamelan-bali', 'gamelan-slendro', 'kalimba-taman', 'harpa-nusantara']),

  // ---- Religi ----
  d('islami', 'Islami Arabesque', 'agama', 'Pola geometris arabesque dengan hijau zamrud dan emas.', ['#1f6f5c', '#c9a84a', '#f4f9f6', '#17352d'], ['display', 'serif'], ['oud-hijaz', 'piano-romantis', 'harpa-nusantara', 'paduan-suci']),
  d('kristiani', 'Kristiani Lily', 'agama', 'Putih lembut, lily, dan merpati damai.', ['#6b7fa3', '#d7c48a', '#fbfaf6', '#2b3350'], ['script', 'serif'], ['paduan-suci', 'piano-romantis', 'harpa-nusantara', 'lonceng-salju']),
  d('buddha', 'Buddha Teratai', 'agama', 'Teratai dan lentera dengan warna safron yang tenteram.', ['#c46a1a', '#e8b04a', '#fff8ec', '#402a10'], ['display', 'serif'], ['paduan-suci', 'kalimba-taman', 'gamelan-slendro', 'ambient-galaksi']),

  // ---- Perayaan ----
  d('natal', 'Natal Salju', 'perayaan', 'Merah-hijau Natal, bintang, dan salju yang turun.', ['#b3202a', '#2f6b45', '#fbf6ee', '#2a1a17'], ['script', 'serif'], ['lonceng-salju', 'kotak-musik', 'piano-romantis', 'perayaan-ceria'], true),
  d('imlek', 'Imlek Lentera', 'perayaan', 'Merah-emas meriah dengan lentera yang terbang.', ['#c1121f', '#f0b429', '#fff4e0', '#3a0d0d'], ['display', 'serif'], ['guzheng-tionghoa', 'perayaan-ceria', 'harpa-nusantara', 'piano-romantis'], true),
  d('valentine', 'Valentine Hati', 'perayaan', 'Merah muda manis dengan hati yang melayang naik.', ['#d6336c', '#f7a8c4', '#fff5f8', '#4a1a2c'], ['script', 'sans'], ['piano-romantis', 'kotak-musik', 'waltz-paris', 'ukulele-pantai']),
  d('kemerdekaan', 'Merah Putih 17 Agustus', 'perayaan', 'Semangat kemerdekaan dengan bendera dan konfeti.', ['#d62828', '#1d3557', '#fff9f5', '#1d1d1d'], ['display', 'sans'], ['perayaan-ceria', 'gitar-akustik', 'piano-romantis', 'kalimba-taman'], true),
  d('lebaran', 'Lebaran Syawal', 'perayaan', 'Ketupat, bulan sabit, dan lampion syawal.', ['#1b7f5f', '#e0b050', '#f3faf4', '#173a2e'], ['display', 'serif'], ['oud-hijaz', 'perayaan-ceria', 'harpa-nusantara', 'piano-romantis']),
  d('tahunbaru', 'Malam Tahun Baru', 'perayaan', 'Kembang api emas di langit malam biru tua.', ['#e5b84a', '#8fa6ff', '#0d1430', '#f4ecd0'], ['cinzel', 'sans'], ['jazz-klasik', 'perayaan-ceria', 'sinema-string', 'synthwave-malam'], true),
  d('halloween', 'Halloween Misteri', 'perayaan', 'Ungu-oranye misterius dengan kelelawar melintas.', ['#e8590c', '#7c5cd6', '#1a1325', '#f1e6ff'], ['display', 'sans'], ['sinema-string', 'ambient-galaksi', 'kotak-musik', 'synthwave-malam'], true),

  // ---- Kartun ----
  d('kerajaan-es', 'Kerajaan Es', 'kartun', 'Putri negeri es: kristal salju dan kilau biru muda.', ['#3a8fd1', '#bfe3f7', '#eef8ff', '#16364f'], ['script', 'sans'], ['kotak-musik', 'lonceng-salju', 'piano-romantis', 'harpa-nusantara']),
  d('ceria', 'Petualangan Ceria', 'kartun', 'Warna cerah, awan bergoyang, dan huruf membulat.', ['#ff6b35', '#ffd23f', '#fff9e6', '#2a2a4a'], ['round', 'round'], ['perayaan-ceria', 'ukulele-pantai', 'chiptune-petualangan', 'kalimba-taman']),
  d('sakura-anime', 'Sakura Pastel', 'kartun', 'Gaya anime pastel dengan kelopak sakura dan kilauan.', ['#e75a97', '#b8a1ff', '#fff5fb', '#3b2a4d'], ['round', 'round'], ['kotak-musik', 'piano-romantis', 'kalimba-taman', 'harpa-nusantara']),
  d('dongeng', 'Negeri Dongeng', 'kartun', 'Buku cerita dengan kastil, bulan, dan bintang berkelip.', ['#7b5ea7', '#f2c96b', '#f7f2ff', '#33274d'], ['script', 'serif'], ['kotak-musik', 'harpa-nusantara', 'waltz-paris', 'piano-romantis']),

  // ---- Video Game ----
  d('pixel', 'Pixel Adventure', 'game', 'Retro 8-bit: nyawa hati, koin, dan tulisan piksel.', ['#e63946', '#2a9d8f', '#fdf0d5', '#1d1d2e'], ['pixel', 'sans'], ['chiptune-petualangan', 'perayaan-ceria', 'kalimba-taman', 'synthwave-malam']),
  d('player-one', 'Player One', 'game', 'Antarmuka HUD: bar XP, level up, dan neon di layar gelap.', ['#00e5ff', '#ff2d95', '#0b0f1e', '#e8f0ff'], ['cinzel', 'sans'], ['chiptune-petualangan', 'synthwave-malam', 'sinema-string', 'ambient-galaksi'], true),
  d('rpg', 'Quest Kerajaan', 'game', 'Perkamen, rune, dan bara api dalam kisah RPG fantasi.', ['#8b5e34', '#c9a227', '#efe0c0', '#3a2a14'], ['cinzel', 'serif'], ['sinema-string', 'harpa-nusantara', 'kotak-musik', 'chiptune-petualangan']),
  d('neon', 'Neon Arcade', 'game', 'Synthwave neon merah muda dan cyan dengan garis pemindai.', ['#ff2e97', '#2ee6ff', '#120a24', '#f5e9ff'], ['display', 'sans'], ['synthwave-malam', 'chiptune-petualangan', 'ambient-galaksi', 'sinema-string'], true),

  // ---- Film ----
  d('hollywood', 'Hollywood Klasik', 'film', 'Art deco hitam-emas, gulungan film, dan lampu sorot.', ['#c9a227', '#f2e8cf', '#141414', '#f2e8cf'], ['cinzel', 'serif'], ['jazz-klasik', 'sinema-string', 'waltz-paris', 'piano-romantis'], true),
  d('galaksi', 'Galaksi Cinta', 'film', 'Opera luar angkasa: bintang, nebula, dan cincin orbit.', ['#7c5cff', '#39c5ff', '#0a0e27', '#e6ecff'], ['cinzel', 'sans'], ['ambient-galaksi', 'sinema-string', 'synthwave-malam', 'piano-romantis'], true),
  d('sihir', 'Akademi Sihir', 'film', 'Perkamen, lilin melayang, dan bintang keajaiban.', ['#d4a84b', '#9b5de5', '#2a1f3d', '#f0e6c8'], ['cinzel', 'serif'], ['kotak-musik', 'ambient-galaksi', 'harpa-nusantara', 'sinema-string'], true),
  d('paris', 'Paris Romantis', 'film', 'Komedi romantis: mawar pudar, kelopak, dan waltz.', ['#d4778a', '#b9a06a', '#fdf6f0', '#3a2a2e'], ['script', 'serif'], ['waltz-paris', 'piano-romantis', 'jazz-klasik', 'gitar-akustik']),

  // ---- Musim ----
  d('semi', 'Musim Semi', 'musim', 'Sakura mekar dan kelopak yang berguguran lembut.', ['#e88fb0', '#9bc48f', '#fff8fa', '#4a3040'], ['script', 'sans'], ['kalimba-taman', 'piano-romantis', 'harpa-nusantara', 'gitar-akustik']),
  d('panas', 'Musim Panas', 'musim', 'Pantai, matahari, dan gelembung ombak yang ceria.', ['#0d9488', '#f59e0b', '#f0fbfa', '#0f3d3a'], ['round', 'round'], ['ukulele-pantai', 'gitar-akustik', 'perayaan-ceria', 'kalimba-taman']),
  d('gugur', 'Musim Gugur', 'musim', 'Daun maple keemasan yang jatuh perlahan.', ['#b45309', '#7c2d12', '#fdf3e4', '#3d2410'], ['display', 'serif'], ['cello-gugur', 'gitar-akustik', 'piano-romantis', 'waltz-paris']),
  d('salju', 'Musim Dingin', 'musim', 'Salju turun tenang dengan biru es dan lonceng.', ['#4b7bb5', '#dbe9f7', '#f4f9ff', '#1c2f4a'], ['script', 'sans'], ['lonceng-salju', 'piano-romantis', 'kotak-musik', 'cello-gugur']),
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
