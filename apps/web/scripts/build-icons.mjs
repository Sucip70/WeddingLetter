// Membuat ikon aplikasi dari satu desain SVG: amplop terakota (sama dengan LogoMark di components/logo.tsx)
// dengan segel hati di ujung lipatannya. Jalankan: npm run icons --workspace apps/web
//
// Keluaran:
//   src/app/icon.svg          ikon tab browser (vektor, sudut membulat)
//   src/app/favicon.ico       16/32/48 px, cadangan browser lama
//   src/app/apple-icon.png    180 px, iOS "Add to Home Screen" (tanpa sudut transparan: iOS membulatkan sendiri)
//   public/icon-192.png, icon-512.png            ikon manifest (Android/PWA), sudut membulat
//   public/icon-maskable-512.png                 ikon maskable: penuh, isi di zona aman 80% tengah
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, ...p);

const TERRACOTTA = '#b4533c';
const TERRACOTTA_LIGHT = '#c8654b';
const TERRACOTTA_DARK = '#9a4530';
const IVORY = '#fbf7f1';

// Hati: ujung bawah (0,30), lekuk atas di (0,-16); diskalakan lewat transform.
const HEART = 'M0 30C-50 -4 -28 -40 0 -16C28 -40 50 -4 0 30Z';

// `radius` 0 = latar penuh (apple/maskable); `inset` mengecilkan isi (maskable butuh zona aman).
function svg({ radius = 112, inset = 1, simple = false } = {}) {
  const heart = simple ? 1.35 : 1.15;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${TERRACOTTA_LIGHT}"/>
      <stop offset="1" stop-color="${TERRACOTTA_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${inset}) translate(-256 -256)">
    <rect x="86" y="132" width="340" height="248" rx="34" fill="${IVORY}"/>
    ${simple ? '' : `<path d="M114 168L256 280L398 168" fill="none" stroke="${TERRACOTTA}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>`}
    <path d="${HEART}" transform="translate(256 ${simple ? 262 : 284}) scale(${heart})" fill="${TERRACOTTA}" stroke="${IVORY}" stroke-width="${simple ? 0 : 12}" stroke-linejoin="round" paint-order="stroke"/>
  </g>
</svg>
`;
}

const png = (source, size) => sharp(Buffer.from(source), { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// ICO berisi PNG apa adanya (didukung semua browser modern).
function ico(images) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([head, ...entries, ...images.map((i) => i.data)]);
}

mkdirSync(out('public'), { recursive: true });

const rounded = svg();
const full = svg({ radius: 0 });
const maskable = svg({ radius: 0, inset: 0.8 });
// Ukuran kecil: tanpa garis lipatan supaya hati tetap terbaca di 16 px.
const small = svg({ radius: 112, simple: true });

writeFileSync(out('src/app/icon.svg'), rounded);
writeFileSync(out('src/app/apple-icon.png'), await png(full, 180));
writeFileSync(out('public/icon-192.png'), await png(rounded, 192));
writeFileSync(out('public/icon-512.png'), await png(rounded, 512));
writeFileSync(out('public/icon-maskable-512.png'), await png(maskable, 512));
writeFileSync(
  out('src/app/favicon.ico'),
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size <= 32 ? small : rounded, size) })))),
);

console.log('ikon dibuat: icon.svg, favicon.ico, apple-icon.png, icon-192/512, icon-maskable-512');
