// Motif batik untuk desain "Batik Jawa" (kulit `keraton`): parang (tepi halaman), kawung (pemisah & latar), dan ikon gunungan.
// Semuanya ubin SVG kecil sebagai gambar CSS (data URI) yang dihitung dari warna tema (hex), bukan simpul DOM: murah di ponsel.
// Warna dipasang sebagai variabel CSS di akar undangan lewat keratonVars() (lihat invitation-view.tsx).
import { isHex, mixHex } from './flora-art';
import type { CSSProperties } from 'react';
import { GUNUNGAN_OUTLINE, GUNUNGAN_VIEWBOX } from './gunungan-art';

const uri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const f = (n: number) => (Math.round(n * 100) / 100).toString();

// Parang rusak: pita miring bergantian, satu bergelombang beraksen manik, satu bergaris dengan mata (mlinjon).
// Ubin 32 x 32 yang menyambung rapat: pola dasar diputar 45 derajat dan periodenya (u * akar 2) tepat 32.
export function parangTile(maroon: string, gold: string): string {
  const u = 32 / Math.SQRT2;
  const light = mixHex(maroon, gold, 0.16);
  const dark = mixHex(maroon, '#000000', 0.2);
  const wave = `M0 ${f(u * 0.27)}C${f(u * 0.2)} ${f(u * 0.02)} ${f(u * 0.3)} ${f(u * 0.02)} ${f(u * 0.5)} ${f(u * 0.27)}S${f(u * 0.8)} ${f(u * 0.52)} ${f(u)} ${f(u * 0.27)}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><pattern id="p" width="${f(u)}" height="${f(u)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="${f(u)}" height="${f(u * 0.55)}" fill="${light}"/><rect y="${f(u * 0.55)}" width="${f(u)}" height="${f(u * 0.45)}" fill="${dark}"/>` +
    `<path d="${wave}" fill="none" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<circle cx="${f(u * 0.25)}" cy="${f(u * 0.1)}" r="1.15" fill="${gold}"/><circle cx="${f(u * 0.75)}" cy="${f(u * 0.44)}" r="1.15" fill="${gold}"/>` +
    `<path d="M0 ${f(u * 0.55)}H${f(u)}M0 ${f(u * 0.99)}H${f(u)}" stroke="${gold}" stroke-width=".9"/>` +
    `<ellipse cx="${f(u * 0.5)}" cy="${f(u * 0.77)}" rx="3.3" ry="1.9" fill="none" stroke="${gold}" stroke-width=".9"/><circle cx="${f(u * 0.5)}" cy="${f(u * 0.77)}" r=".8" fill="${gold}"/>` +
    `</pattern></defs><rect width="32" height="32" fill="url(#p)"/></svg>`;
  return uri(svg);
}

// Kawung: empat bulatan lonjong mengelilingi satu titik (biji kolang-kaling). Ubin `s` x `s` berulang rapat.
export function kawungTile(line: string, fill: string | null, s = 28, opacity = 1): string {
  const c = s / 2;
  const a = s * 0.16; // jari-jari pendek
  const b = s * 0.26; // jari-jari panjang
  const e = (cx: number, cy: number, rx: number, ry: number) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"/>`;
  const petals = e(c, c - b, a, b) + e(c, c + b, a, b) + e(c - b, c, b, a) + e(c + b, c, b, a);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" opacity="${opacity}"><g fill="${fill ?? 'none'}" fill-opacity="${fill ? 0.55 : 0}" stroke="${line}" stroke-width=".9">${petals}</g>` +
    `<circle cx="${f(c)}" cy="${f(c)}" r="1.5" fill="${line}"/><path d="M${f(c)} ${f(c - 4)}l1.4 4-1.4 4-1.4-4zM${f(c - 4)} ${f(c)}l4-1.4 4 1.4-4 1.4z" fill="${line}" opacity=".8"/></svg>`;
  return uri(svg);
}

// Pita pemisah: kawung emas di atas maroon, diapit dua garis emas. Tinggi 24; diulang mendatar.
export function kawungBand(maroon: string, gold: string): string {
  const s = 24;
  const c = s / 2;
  const e = (cx: number, cy: number, rx: number, ry: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect width="${s}" height="${s}" fill="${maroon}"/>` +
    `<g fill="none" stroke="${gold}" stroke-width=".9">${e(c, c - 5, 2.8, 4.6)}${e(c, c + 5, 2.8, 4.6)}${e(c - 5, c, 4.6, 2.8)}${e(c + 5, c, 4.6, 2.8)}</g>` +
    `<circle cx="${c}" cy="${c}" r="1.6" fill="${gold}"/><path d="M0 .5H${s}M0 ${s - 0.5}H${s}" stroke="${gold}" stroke-width="1"/></svg>`;
  return uri(svg);
}

// Gunungan sebagai ikon garis satu warna (pengganti tanda kutip): badan, pohon hayat, dan umpak.
export function gunungIcon(color: string): string {
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${GUNUNGAN_VIEWBOX}" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"><path d="${GUNUNGAN_OUTLINE}" stroke-width="9"/><path d="M100 214V44M100 170C82 162 70 150 64 136M100 170C118 162 130 150 136 136M100 128C86 120 78 110 74 98M100 128C114 120 122 110 126 98M100 90C90 84 86 76 84 68M100 90C110 84 114 76 116 68" stroke-width="6"/><path d="M52 232H148V248H52Z" fill="${color}" stroke="none"/><circle cx="100" cy="36" r="8" fill="${color}" stroke="none"/></svg>`,
  );
}

// Latar Batik Jawa (keraton): pita parang 22px di kedua tepi halaman dengan garis emas tipis di sisi dalamnya, dan kawung samar di seluruh
// halaman. Gambarnya variabel CSS dari keratonVars (warna ikut tema). 'local' supaya ikut tergulir di dalam bingkai ponsel.
const KR_RAIL = 'linear-gradient(color-mix(in srgb, var(--s) 80%, #3d2a00), color-mix(in srgb, var(--s) 80%, #3d2a00))';
export const KERATON_BG: CSSProperties = {
  backgroundImage: 'var(--kr-parang), var(--kr-parang), ' + KR_RAIL + ', ' + KR_RAIL + ', var(--kr-kawung)',
  backgroundSize: '22px 22px, 22px 22px, 2px 100%, 2px 100%, 28px 28px',
  backgroundPosition: 'left top, right top, left 22px top, right 22px top, 0 0',
  backgroundRepeat: 'repeat-y, repeat-y, no-repeat, no-repeat, repeat',
  backgroundAttachment: 'local',
};

const hexOr = (h: string, d: string) => (isHex(h) ? h : d);

// Variabel CSS untuk akar undangan. primary = maroon, secondary = emas, background = krem.
export function keratonVars(primary: string, secondary: string, background: string): Record<string, string> {
  const p = hexOr(primary, '#6b1e23');
  const s = hexOr(secondary, '#d4af37');
  const bg = hexOr(background, '#f5e6c8');
  return {
    '--kr-parang': parangTile(p, s),
    '--kr-kawung': kawungTile(mixHex(p, bg, 0.55), null, 28, 0.3),
    '--kr-kawung-gold': kawungTile(s, null, 28, 0.9),
    '--kr-kawung-dark': kawungTile(s, null, 32, 0.2),
    '--kr-band': kawungBand(p, s),
    '--kr-icon': gunungIcon(s),
  };
}
