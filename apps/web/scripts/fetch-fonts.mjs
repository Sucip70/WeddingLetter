// Mengunduh font Google yang dipakai layout.tsx ke src/app/fonts/ (woff2, subset latin / javanese) dan mencetak
// daftar berkasnya (salin ke layout.tsx). Font dipasang lewat next/font/local supaya build tidak lagi mengunduh dari Google
// (build Docker staging gagal: "next/font/google queries have exactly one entry" saat mengambil Source Sans 3).
// Jalankan ulang hanya bila daftar font/ketebalan berubah:  node apps/web/scripts/fetch-fonts.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/app/fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// [id file, family Google, ketebalan, gaya, subset]
const FONTS = [
  ['jakarta', 'Plus Jakarta Sans', [200, 300, 400, 500, 600, 700, 800], ['normal'], 'latin'],
  ['fraunces', 'Fraunces', [100, 200, 300, 400, 500, 600, 700, 800, 900], ['normal'], 'latin'],
  ['script', 'Great Vibes', [400], ['normal'], 'latin'],
  ['cormorant', 'Cormorant Garamond', [400, 500, 600, 700], ['normal'], 'latin'],
  ['cinzel', 'Cinzel', [500, 700], ['normal'], 'latin'],
  ['pixel', 'Press Start 2P', [400], ['normal'], 'latin'],
  ['fredoka', 'Fredoka', [400, 500, 600], ['normal'], 'latin'],
  ['playfair', 'Playfair Display', [400, 500, 600, 700], ['normal', 'italic'], 'latin'],
  ['montserrat', 'Montserrat', [400, 500, 600], ['normal'], 'latin'],
  ['javanese', 'Noto Sans Javanese', [400, 700], ['normal'], 'javanese'],
  ['libre', 'Libre Baskerville', [400, 700], ['normal', 'italic'], 'latin'],
  ['source', 'Source Sans 3', [400, 500, 600], ['normal'], 'latin'],
];

mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const [id, family, weights, styles, subset] of FONTS) {
  const ital = styles.includes('italic');
  const axis = ital ? `ital,wght@${styles.flatMap((s) => weights.map((w) => `${s === 'italic' ? 1 : 0},${w}`)).join(';')}` : `wght@${weights.join(';')}`;
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axis}&display=swap`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  // Blok @font-face diawali komentar subset, mis. "/* latin */".
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g)].filter((m) => m[1] === subset);
  if (!blocks.length) throw new Error(`${family}: subset ${subset} tidak ditemukan`);
  const byUrl = new Map();
  for (const [, , body] of blocks) {
    const src = body.match(/src:\s*url\(([^)]+)\)/)[1];
    const weight = Number(body.match(/font-weight:\s*(\d+)/)[1]);
    const style = body.match(/font-style:\s*(\w+)/)[1];
    const e = byUrl.get(src) ?? { style, weights: [] };
    e.weights.push(weight);
    byUrl.set(src, e);
  }
  manifest[id] = [];
  let n = 0;
  for (const [src, { style, weights: ws }] of byUrl) {
    const file = `${id}-${style}-${n++}.woff2`;
    writeFileSync(join(OUT, file), Buffer.from(await (await fetch(src)).arrayBuffer()));
    const lo = Math.min(...ws), hi = Math.max(...ws);
    manifest[id].push({ path: `./fonts/${file}`, weight: lo === hi ? String(lo) : `${lo} ${hi}`, style });
  }
  console.log(id, manifest[id].map((f) => `${f.weight}/${f.style}`).join(', '));
}
// next/font/local hanya menerima literal, jadi daftar ini disalin manual ke layout.tsx.
console.log(JSON.stringify(manifest, null, 2));
