import type { CSSProperties } from 'react';
import { DOVE_SILHOUETTE, DOVE_VIEWBOX } from './dove-art';

// Latar kulit "kraft" (Rustic) yang dipakai bersama oleh undangan sungguhan (invitation-view.tsx) dan miniatur kartu katalog
// (template-thumb.tsx), supaya keduanya tidak bisa berbeda. Modul ini sengaja kecil & tanpa dependensi agar kartu katalog
// tidak ikut menarik seluruh invitation-view.

// Tekstur kertas kraft: butiran halus + serat memanjang (SVG feTurbulence), dikalikan ke warna latar tema
// (backgroundColor = tema, backgroundImage = ini, backgroundBlendMode = 'multiply').
export const KRAFT_TEXTURE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .36 0 0 0 0 .25 0 0 0 0 .14 0 0 0 .36 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\"), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .5' numOctaves='2' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .32 0 0 0 0 .18 0 0 0 .2 -.03'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")";

// Sorotan cahaya di tengah sampul + vinyet di tepi (lapisan transparan di atas tekstur, tanpa multiply).
export const KRAFT_COVER = 'radial-gradient(ellipse at 50% 42%, color-mix(in srgb, var(--bg) 70%, #fff) 0, transparent 62%), radial-gradient(ellipse at 50% 50%, transparent 55%, color-mix(in srgb, var(--p) 22%, transparent) 130%)';

// Tekstur Elegan: urat marmer gading + butiran halus (SVG feTurbulence, dikalikan ke warna latar tema) dan dua pasang
// garis emas tipis di tepi halaman (rel) yang menyambung dengan bingkai sampul.
const MARBLE = "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'800'%20height%3D'800'%3E%3Cfilter%20id%3D'a'%20x%3D'0'%20y%3D'0'%20width%3D'100%25'%20height%3D'100%25'%20color-interpolation-filters%3D'sRGB'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.0032%20.0055'%20numOctaves%3D'4'%20seed%3D'3'%20stitchTiles%3D'stitch'%20result%3D'n'%2F%3E%3CfeColorMatrix%20in%3D'n'%20type%3D'matrix'%20values%3D'0%200%200%200%20.46%200%200%200%200%20.4%200%200%200%200%20.3%201%200%200%200%200'%20result%3D'c'%2F%3E%3CfeComponentTransfer%20in%3D'c'%20result%3D'd'%3E%3CfeFuncA%20type%3D'table'%20tableValues%3D'0%200%200%200%200%200%200%200%200%200%20.5%200%200%200%200%200%200%200%200%200%200'%2F%3E%3C%2FfeComponentTransfer%3E%3CfeGaussianBlur%20in%3D'd'%20stdDeviation%3D'.6'%2F%3E%3C%2Ffilter%3E%3Cfilter%20id%3D'b'%20x%3D'0'%20y%3D'0'%20width%3D'100%25'%20height%3D'100%25'%20color-interpolation-filters%3D'sRGB'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.007%20.011'%20numOctaves%3D'3'%20seed%3D'8'%20stitchTiles%3D'stitch'%20result%3D'n'%2F%3E%3CfeColorMatrix%20in%3D'n'%20type%3D'matrix'%20values%3D'0%200%200%200%20.55%200%200%200%200%20.48%200%200%200%200%20.36%201%200%200%200%200'%20result%3D'c'%2F%3E%3CfeComponentTransfer%20in%3D'c'%3E%3CfeFuncA%20type%3D'table'%20tableValues%3D'0%200%200%200%200%200%200%200%200%200%20.3%200%200%200%200%200%200%200%200%200%200'%2F%3E%3C%2FfeComponentTransfer%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23a)'%20opacity%3D'.22'%2F%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23b)'%20opacity%3D'.16'%2F%3E%3C%2Fsvg%3E\")";
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .28 0 0 0 .1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";
const RAIL = 'linear-gradient(color-mix(in srgb, var(--p) 46%, transparent), color-mix(in srgb, var(--p) 46%, transparent))';
const RAIL_SOFT = 'linear-gradient(color-mix(in srgb, var(--p) 24%, transparent), color-mix(in srgb, var(--p) 24%, transparent))';
export const GILDED_BG: CSSProperties = {
  backgroundImage: `${MARBLE}, ${GRAIN}, ${RAIL}, ${RAIL}, ${RAIL_SOFT}, ${RAIL_SOFT}`,
  backgroundSize: '800px 800px, 240px 240px, 1px 100%, 1px 100%, 1px 100%, 1px 100%',
  backgroundPosition: '0 0, 0 0, left 10px top 0, right 10px top 0, left 17px top 0, right 17px top 0',
  backgroundRepeat: 'repeat, repeat, no-repeat, no-repeat, no-repeat, no-repeat',
  backgroundBlendMode: 'multiply, multiply, normal, normal, normal, normal',
};
// Tekstur Sepasang Merpati: awan biru sangat tipis di atas warna latar (dikalikan), dan siluet merpati sebagai mask ikon.
const CLOUD_TEX = "url(\"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'700'%20height%3D'700'%3E%3Cfilter%20id%3D'c'%20x%3D'0'%20y%3D'0'%20width%3D'100%25'%20height%3D'100%25'%20color-interpolation-filters%3D'sRGB'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'.0035%20.0065'%20numOctaves%3D'4'%20seed%3D'5'%20stitchTiles%3D'stitch'%20result%3D'n'%2F%3E%3CfeColorMatrix%20in%3D'n'%20type%3D'matrix'%20values%3D'0%200%200%200%20.55%200%200%200%200%20.66%200%200%200%200%20.86%201.7%200%200%200%20-.62'%2F%3E%3CfeGaussianBlur%20stdDeviation%3D'6'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23c)'%20opacity%3D'.26'%2F%3E%3C%2Fsvg%3E\")";
const DOVE_ICON = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${DOVE_VIEWBOX}'><path d='${DOVE_SILHOUETTE}'/></svg>`)}")`;
export const DOVE_BG: CSSProperties = {
  backgroundImage: `radial-gradient(ellipse 120% 26% at 50% 0%, color-mix(in srgb, var(--p) 16%, transparent), transparent 80%), ${CLOUD_TEX}`,
  backgroundSize: '100% 100%, 700px 700px',
  backgroundRepeat: 'no-repeat, repeat',
  backgroundBlendMode: 'normal, multiply',
  ['--dove-icon' as string]: DOVE_ICON,
};
// Latar Buket Pengantin: putih bersih dengan semburat pastel yang sangat tipis (blush, lavender, biru langit, kuning mentega)
// berulang vertikal tiap 1800px, jadi di sepanjang halaman ada sentuhan warna lembut di sisi kiri dan kanan.
export const BLOOM_BG: CSSProperties = {
  backgroundImage: [
    'radial-gradient(ellipse 60% 220px at 0% 220px, rgba(246,179,195,.30), transparent 72%)',
    'radial-gradient(ellipse 58% 240px at 100% 760px, rgba(192,166,238,.26), transparent 72%)',
    'radial-gradient(ellipse 60% 220px at 0% 1260px, rgba(156,199,238,.26), transparent 72%)',
    'radial-gradient(ellipse 56% 200px at 100% 1640px, rgba(248,216,110,.24), transparent 72%)',
  ].join(', '),
  backgroundSize: '100% 1800px',
  backgroundRepeat: 'repeat-y',
};

// Gradasi/sorotan di atas latar sampul tiap kulit (lapisan transparan di atas latar kulit di atas, bukan bagian dari multiply).
export function coverBackgroundFor(skin: string | undefined) {
  const kraft = skin === 'kraft';
  const keraton = skin === 'keraton';
  const bloom = skin === 'bloom';
  const airy = skin === 'dove';
  const gilded = skin === 'gilded';
  return kraft
      ? KRAFT_COVER
      : keraton
        ? 'radial-gradient(ellipse 78% 36% at 50% 36%, color-mix(in srgb, #fff 62%, var(--bg)) 0, transparent 72%), radial-gradient(ellipse 120% 40% at 50% 108%, color-mix(in srgb, var(--p) 16%, transparent), transparent 74%)'
      : bloom
        ? 'radial-gradient(ellipse 80% 40% at 50% 40%, #fff 0, rgba(255,255,255,0) 72%), linear-gradient(180deg, color-mix(in srgb, var(--s) 9%, #fff) 0%, #fff 32%, #fff 68%, color-mix(in srgb, var(--p) 9%, #fff) 100%)'
        : airy
        ? 'radial-gradient(ellipse 100% 36% at 50% 104%, color-mix(in srgb, var(--s) 38%, transparent), transparent 74%), linear-gradient(180deg, color-mix(in oklch, var(--p) 56%, white) 0%, color-mix(in oklch, var(--p) 34%, white) 34%, color-mix(in oklch, var(--p) 12%, white) 62%, #fffdf9 82%, color-mix(in srgb, var(--s) 22%, #fffdf9) 100%)'
        : gilded
        ? 'radial-gradient(ellipse 90% 52% at 50% 33%, color-mix(in srgb, #fff 60%, var(--bg)) 0, transparent 72%), radial-gradient(ellipse 80% 40% at 50% 104%, color-mix(in srgb, var(--p) 22%, transparent), transparent 72%), linear-gradient(180deg, color-mix(in srgb, var(--p) 9%, var(--bg)), var(--bg) 42%, color-mix(in srgb, var(--p) 13%, var(--bg)))'
        : 'linear-gradient(165deg, color-mix(in srgb, var(--p) 20%, var(--bg)), var(--bg) 52%, color-mix(in srgb, var(--p) 10%, color-mix(in srgb, var(--s) 12%, var(--bg))))';
}
