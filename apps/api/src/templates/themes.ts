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

// Gerbang pembuka undangan Premium: adegan animasi (pintu, amplop, tirai, ...) yang harus diketuk sebelum
// sampul terlihat. Dirender di web (apps/web/.../gates.tsx, kunci = id). 'none' = tanpa gerbang.
export const GATE_LABEL = {
  door: 'Pintu',
  glass: 'Jendela kaca patri',
  curtain: 'Tirai',
  cloth: 'Kain ditarik',
  envelope: 'Amplop',
  portal: 'Portal sihir',
  ring: 'Kotak cincin',
  bloom: 'Bunga bermekaran',
  leaves: 'Surat daun gugur',
  balloons: 'Balon',
  waves: 'Ombak',
  gift: 'Kado',
  lantern: 'Lentera',
  fireworks: 'Kembang api',
  frost: 'Surat kristal es',
  book: 'Buku dongeng',
  pressstart: 'Press Start',
  loading: 'Loading',
  neon: 'Papan neon',
  sakura: 'Surat kelopak sakura',
  kayon: 'Kayon wayang',
  twine: 'Surat bertali goni',
  doves: 'Sepasang merpati',
  bouquet: 'Lempar buket',
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
  // ---- Klasik ----
  d('rustic', 'Rustic Klasik', 'klasik', 'Hangat dan bersahaja dengan nuansa kayu dan tanah.', ['#8a5a3c', '#c9a27e', '#fbf6ef', '#3b2a20'], ['serif', 'sans']),
  d('floral', 'Floral Romantis', 'klasik', 'Bunga-bunga lembut dengan tulisan tangan yang manis.', ['#c4587a', '#e9b7c6', '#fff7f9', '#4a2c38'], ['script', 'sans']),
  d('buket', 'Buket Pengantin', 'klasik', 'Putih bersih dihiasi mawar, peony, dan bunga warna-warni dalam satu buket.', ['#4f7a63', '#ef8fa8', '#ffffff', '#33423a'], ['script', 'serif']),
  d('elegant', 'Elegan Emas', 'klasik', 'Mewah dan bersahaja dengan aksen emas.', ['#b08d3c', '#1f2a44', '#f7f5f0', '#1f2a44'], ['serif', 'serif']),

  // id 'kristiani' dipertahankan (dipakai theme.preset/motif pada template yang sudah tersimpan); nama tampilan sudah umum.
  d('kristiani', 'Sepasang Merpati', 'klasik', 'Sepasang merpati putih, lily, dan langit pagi yang tenang.', ['#6b7fa3', '#d7c48a', '#fbfaf6', '#2b3350'], ['script', 'serif']),

  // ---- Suku & Budaya ----
  d('jawa', 'Batik Jawa', 'suku', 'Keraton klasik: gunungan wayang, parang, dan kawung dalam maroon, emas, dan krem.', ['#6b1e23', '#d4af37', '#f5e6c8', '#3a1518'], ['display', 'serif']),
  d('sunda', 'Tatar Sunda', 'suku', 'Hijau bambu dan daun yang sejuk, ringan seperti angklung.', ['#3f7a4e', '#c9b26a', '#f4f8ee', '#20321f'], ['display', 'sans']),
  d('minang', 'Songket Minang', 'suku', 'Merah-emas songket dengan pola pucuk rebung.', ['#a3192a', '#d9a520', '#fdf3e3', '#3a1216'], ['display', 'sans']),
  d('batak', 'Ulos Batak', 'suku', 'Garis dan zigzag ulos dalam merah, hitam, dan putih.', ['#8e1b1b', '#2b2b2b', '#f7f1e8', '#221a17'], ['cinzel', 'sans']),
  d('bali', 'Pesona Bali', 'suku', 'Emas, teratai, dan kamboja yang berguguran.', ['#c8871a', '#2f6d5a', '#fff8e8', '#33240f'], ['display', 'serif']),

  // ---- Religi ----
  d('islami', 'Islami Arabesque', 'agama', 'Pola geometris arabesque dengan hijau zamrud dan emas.', ['#1f6f5c', '#c9a84a', '#f4f9f6', '#17352d'], ['display', 'serif']),
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

// Gerbang bawaan per desain (alasan pemilihan ada di riwayat diskusi: sesuaikan dengan adegan tema).
const DESIGN_GATES: Record<string, GateKind> = {
  rustic: 'twine', floral: 'bloom', elegant: 'ring',
  jawa: 'kayon', sunda: 'leaves', minang: 'curtain', batak: 'cloth', bali: 'door',
  islami: 'door', kristiani: 'doves', buddha: 'bloom',
  natal: 'gift', imlek: 'lantern', valentine: 'envelope', kemerdekaan: 'curtain', lebaran: 'envelope', tahunbaru: 'fireworks', halloween: 'door',
  'kerajaan-es': 'frost', ceria: 'balloons', 'sakura-anime': 'sakura', dongeng: 'book',
  pixel: 'pressstart', 'player-one': 'loading', rpg: 'door', neon: 'neon',
  hollywood: 'curtain', galaksi: 'portal', sihir: 'portal', paris: 'envelope',
  buket: 'bouquet', semi: 'bloom', panas: 'waves', gugur: 'leaves', salju: 'frost',
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
export const BASIC_DESIGN_IDS: readonly string[] = ['rustic', 'floral', 'elegant', 'buket'];

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

// Palet khusus paket Basic per desain; desain yang tidak tercantum memakai 8 warna siap pakai (BASIC_PALETTES).
export const basicPalettes = (designId: string): Palette[] => (designId === 'buket' ? BUKET_PALETTES : BASIC_PALETTES);

// Batik Jawa: warna utama = warna kain (maroon, sogan, zamrud, indigo), sekunder = emas, latar krem; teks gelap sewarna kain.
// Warna utama harus pekat: dipakai untuk judul, tombol, dan latar gerbang & hitung mundur (teks krem di atasnya).
const JAWA_PALETTES: Palette[] = [
  { id: 'maroon', name: 'Maroon & Emas', primary: '#6b1e23', secondary: '#d4af37', background: '#f5e6c8', text: '#3a1518' },
  { id: 'sogan', name: 'Sogan Cokelat', primary: '#5c3a1c', secondary: '#c9a24a', background: '#f3e6cc', text: '#33200f' },
  { id: 'zamrud', name: 'Hijau Zamrud', primary: '#1f4a3a', secondary: '#d4af37', background: '#f2ead2', text: '#152b22' },
  { id: 'indigo', name: 'Biru Indigo', primary: '#1f2f5c', secondary: '#d4af37', background: '#f1eadb', text: '#161f3d' },
  { id: 'anggur', name: 'Ungu Anggur', primary: '#4d1f4a', secondary: '#d4af37', background: '#f4e8d6', text: '#2e112c' },
];

const CURATED_PALETTES: Record<string, Palette[]> = {
  buket: BUKET_PALETTES,
  jawa: JAWA_PALETTES,
  kristiani: [
    { id: "sage", name: "Hijau Sage", primary: "#6f8f82", secondary: "#d9c9a0", background: "#f8faf6", text: "#25352e" },
    { id: "blush", name: "Merah Muda Lembut", primary: "#b07f8d", secondary: "#e3cfa6", background: "#fcf8f7", text: "#432f37" },
    { id: "lavender", name: "Lavender", primary: "#8577b0", secondary: "#d8c9a2", background: "#faf8fc", text: "#302a4a" },
  ],
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
