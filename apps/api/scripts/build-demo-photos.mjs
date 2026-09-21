// Membuat ilustrasi placeholder foto demo (apps/api/assets/demo/*.svg): potret mempelai dan 8 adegan galeri.
// Ini GAMBAR VEKTOR buatan kode, bukan foto: gantilah dengan foto asli di Admin -> Foto demo.
// Jalankan ulang: node scripts/build-demo-photos.mjs   (hasilnya di-commit)
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../assets/demo/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const W = 800;
const H = 1000;
const rand = (i, s) => {
  const x = Math.sin((i + 1) * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const f = (n) => Number(n.toFixed(1));

const wrap = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<defs><filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>` +
  `<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5"/></filter>${defs}</defs>${body}</svg>\n`;

const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
const radial = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</radialGradient>`;

const bokeh = (n, colors, seed, { y0 = 0, y1 = H, rmin = 30, rmax = 90, op = 0.5 } = {}) =>
  `<g filter="url(#blur)" opacity="${op}">` +
  Array.from({ length: n }, (_, i) => `<circle cx="${f(rand(i, seed) * W)}" cy="${f(y0 + rand(i, seed + 1) * (y1 - y0))}" r="${f(rmin + rand(i, seed + 2) * (rmax - rmin))}" fill="${colors[i % colors.length]}"/>`).join('') +
  `</g>`;

const sparkle = (cx, cy, r, fill = '#fff', op = 1) => `<path d="M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z" fill="${fill}" opacity="${op}"/>`;
const petal = (cx, cy, rx, ry, rot, fill, op = 0.9) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill}" opacity="${op}"/>`;
const leaf = (cx, cy, len, rot, fill = '#5f7f58') => `<path d="M0 0C${len * 0.3} ${-len * 0.28} ${len * 0.75} ${-len * 0.22} ${len} 0C${len * 0.75} ${len * 0.22} ${len * 0.3} ${len * 0.28} 0 0Z" transform="translate(${cx} ${cy}) rotate(${rot})" fill="${fill}"/>`;
const rose = (cx, cy, r, c1, c2, c3) =>
  `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c1}"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.74)}" fill="${c2}"/><circle cx="${cx + r * 0.05}" cy="${cy - r * 0.04}" r="${f(r * 0.5)}" fill="${c1}"/><circle cx="${cx}" cy="${cy}" r="${f(r * 0.3)}" fill="${c3}"/>` +
  `<path d="M${cx - r * 0.6} ${cy + r * 0.1}Q${cx} ${cy + r * 0.6} ${cx + r * 0.6} ${cy + r * 0.1}" stroke="${c3}" stroke-width="${f(r * 0.06)}" fill="none" opacity=".5"/></g>`;

// ---------- potret ----------

function groom() {
  const defs = grad('bg', [[0, '#cfdbe8'], [1, '#f5ebe0']]) + grad('suit', [[0, '#2b3a63'], [1, '#161f3a']]) + grad('skin', [[0, '#eac3a3'], [1, '#d9a785']]);
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(9, ['#ffffff', '#f0d9c4', '#b9cbe0', '#e8c9c9'], 3, { rmin: 40, rmax: 110, op: 0.55 }) +
    `<path d="M90 1000C90 800 230 735 400 735C570 735 710 800 710 1000Z" fill="url(#suit)"/>` +
    `<rect x="352" y="640" width="96" height="120" rx="34" fill="url(#skin)"/>` +
    `<path d="M322 748L400 905L478 748Q400 800 322 748Z" fill="#f8f4ec"/>` +
    `<path d="M322 748L400 905L282 1000L180 830L250 790Z" fill="#26345a"/><path d="M478 748L400 905L518 1000L620 830L550 790Z" fill="#26345a"/>` +
    `<path d="M388 800h24l12 96-24 30-24-30z" fill="#8a3a4a"/><path d="M380 782h40l-6 26h-28z" fill="#8a3a4a"/>` +
    `<ellipse cx="400" cy="520" rx="120" ry="146" fill="url(#skin)"/>` +
    `<ellipse cx="282" cy="530" rx="18" ry="30" fill="#d9a785"/><ellipse cx="518" cy="530" rx="18" ry="30" fill="#d9a785"/>` +
    `<path d="M280 505C262 340 400 312 486 346C540 368 544 440 520 505C508 436 470 414 400 414C336 414 300 448 280 505Z" fill="#2a1c16"/>` +
    `<path d="M556 838l-30-10 8-28 30 10z" fill="#f4d6d2"/><circle cx="556" cy="812" r="17" fill="#f2c4c4"/><circle cx="556" cy="812" r="9" fill="#fff"/><path d="M548 828l-10 34" stroke="#5f7f58" stroke-width="5"/>` +
    `<path d="M356 560Q400 600 444 560" stroke="#b9836a" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return wrap(defs, body);
}

function bride() {
  const defs = grad('bg', [[0, '#f7dcd7'], [1, '#fbf3ea']]) + grad('skin', [[0, '#f0c9ab'], [1, '#deae8c']]) + grad('veil', [[0, '#ffffff', 0.85], [1, '#ffffff', 0.15]]) + grad('hair', [[0, '#5a3a2b'], [1, '#2f1e17']]);
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(9, ['#ffffff', '#f7c9c9', '#f3e2c7', '#e5b9c9'], 8, { rmin: 40, rmax: 110, op: 0.6 }) +
    `<path d="M180 330C120 560 110 760 100 1000L700 1000C690 760 680 560 620 330C560 270 240 270 180 330Z" fill="url(#veil)"/>` +
    `<path d="M120 1000C120 820 250 760 400 760C550 760 680 820 680 1000Z" fill="#fbfaf6"/>` +
    `<path d="M262 800C300 840 500 840 538 800L560 1000L240 1000Z" fill="#efe9de"/>` +
    `<path d="M220 800C250 760 330 750 400 850C470 750 550 760 580 800" fill="url(#skin)"/>` +
    `<rect x="356" y="650" width="88" height="130" rx="34" fill="url(#skin)"/>` +
    `<path d="M300 800C330 830 370 850 400 860C430 850 470 830 500 800L520 830C470 880 330 880 280 830Z" fill="#ffffff"/>` +
    `<ellipse cx="400" cy="522" rx="112" ry="140" fill="url(#skin)"/>` +
    `<path d="M284 520C262 370 340 300 420 302C500 304 546 380 520 520C508 440 470 420 400 424C330 428 298 450 284 520Z" fill="url(#hair)"/>` +
    `<circle cx="400" cy="296" r="58" fill="url(#hair)"/><circle cx="400" cy="296" r="30" fill="#4a3024"/>` +
    [[330, 336, 18], [400, 322, 20], [470, 338, 17]].map(([x, y, r]) => rose(x, y, r, '#ffffff', '#f7d6d6', '#f2c4c4')).join('') +
    `<path d="M358 570Q400 606 442 570" stroke="#c58f78" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    // buket
    `<path d="M400 990L360 880M400 990L440 880M400 990L400 870" stroke="#5f7f58" stroke-width="10" stroke-linecap="round"/>` +
    [[350, 860, 34, '#f2c1c4'], [430, 858, 36, '#ffffff'], [392, 838, 32, '#f7d6d6'], [470, 890, 26, '#f2c1c4'], [320, 895, 26, '#ffffff']].map(([x, y, r, c]) => rose(x, y, r, c, '#fff5f3', '#eeb4b9')).join('') +
    [[300, 900, 40, 200], [500, 905, 40, -20], [400, 800, 36, -90]].map(([x, y, l, r]) => leaf(x, y, l, r)).join('');
  return wrap(defs, body);
}

// ---------- galeri ----------

function sunset() {
  const defs = grad('sky', [[0, '#5d4b93'], [0.45, '#e58fa0'], [0.75, '#ffc48a'], [1, '#ffe6b0']]) + radial('glow', [[0, '#fff3c9', 0.95], [1, '#fff3c9', 0]]);
  const fig = (x, dress) =>
    dress
      ? `<circle cx="${x}" cy="-132" r="11"/><path d="M${x - 16} -112h32l14 112h-60z"/><path d="M${x - 8} -140c-6 12-6 30 2 42" stroke="#150d2a" stroke-width="5" fill="none"/>`
      : `<circle cx="${x}" cy="-134" r="11"/><rect x="${x - 15}" y="-121" width="30" height="58" rx="9"/><rect x="${x - 13}" y="-66" width="11" height="66" rx="3"/><rect x="${x + 2}" y="-66" width="11" height="66" rx="3"/>`;
  const body =
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
    `<circle cx="400" cy="560" r="260" fill="url(#glow)"/><circle cx="400" cy="575" r="82" fill="#fff6d8"/>` +
    `<path d="M0 640C120 590 220 610 330 650C470 600 620 610 800 660L800 1000L0 1000Z" fill="#8a5f8f" opacity=".7"/>` +
    `<path d="M0 700C160 660 300 700 420 730C560 690 700 700 800 730L800 1000L0 1000Z" fill="#4d3a6a"/>` +
    `<path d="M0 780C200 745 380 790 520 800C640 780 720 780 800 800L800 1000L0 1000Z" fill="#241a3c"/>` +
    `<g transform="translate(400 780) scale(1.9)" fill="#120a24">${fig(-26, false)}${fig(30, true)}<path d="M-12 -104L18 -100" stroke="#120a24" stroke-width="5"/></g>` +
    `<g fill="none" stroke="#3a2a55" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M170 300q14-16 28 0q14-16 28 0"/><path d="M560 250q10-12 20 0q10-12 20 0"/><path d="M640 350q8-10 16 0q8-10 16 0"/></g>`;
  return wrap(defs, body);
}

function rings() {
  const defs = grad('bg', [[0, '#1d3128'], [1, '#3f5c49']]) + grad('gold', [[0, '#fff0c4'], [0.5, '#d9b26a'], [1, '#9c7a3c']], 1, 1) + radial('glow', [[0, '#ffe9ac', 0.6], [1, '#ffe9ac', 0]]);
  const petals = Array.from({ length: 22 }, (_, i) => petal(f(rand(i, 5) * W), f(rand(i, 6) * H), f(14 + rand(i, 7) * 14), f(24 + rand(i, 8) * 16), f(rand(i, 9) * 180), ['#f6cfd0', '#fff5ef', '#f0b9c0'][i % 3], 0.85)).join('');
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(8, ['#c9e0b8', '#ffe9ac', '#8fb49a'], 12, { rmin: 40, rmax: 100, op: 0.35 }) +
    petals +
    `<circle cx="400" cy="520" r="300" fill="url(#glow)"/>` +
    `<g fill="none" stroke="url(#gold)" stroke-width="26"><circle cx="322" cy="540" r="118"/><circle cx="478" cy="540" r="118"/></g>` +
    `<g fill="none" stroke="rgba(0,0,0,.22)" stroke-width="4"><circle cx="322" cy="552" r="128"/><circle cx="478" cy="552" r="128"/></g>` +
    `<path d="M322 396l26 26-26 26-26-26z" fill="#ffffff"/><path d="M322 396l26 26h-52z" fill="#dfeaf5"/>` +
    sparkle(322, 396, 34, '#fff', 0.95) + sparkle(560, 380, 22) + sparkle(250, 620, 16) + sparkle(600, 660, 18, '#ffe9ac') + sparkle(430, 300, 14);
  return wrap(defs, body);
}

function bouquet() {
  const defs = grad('bg', [[0, '#f6ece2'], [1, '#efd8cc']]) + grad('rib', [[0, '#f6d6d2'], [1, '#e7aaa8']], 1, 0);
  const roses = [[400, 430, 74, '#f2b6ba'], [300, 490, 66, '#ffffff'], [500, 490, 66, '#f8d2d3'], [350, 590, 62, '#f2b6ba'], [455, 590, 62, '#ffffff'], [400, 520, 60, '#e9959d'], [250, 600, 44, '#f8d2d3'], [550, 600, 44, '#f2b6ba'], [400, 350, 46, '#ffffff']];
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(8, ['#ffffff', '#f7cfc9', '#e8c7a9'], 21, { rmin: 40, rmax: 100, op: 0.5 }) +
    `<path d="M400 980L330 700M400 980L470 700M400 980L400 690" stroke="#5f7f58" stroke-width="14" stroke-linecap="round"/>` +
    [[250, 470, 120, 200], [560, 470, 120, -20], [330, 380, 110, 240], [480, 380, 110, -60], [300, 640, 100, 160], [510, 640, 100, 20], [400, 300, 90, -90]].map(([x, y, l, r]) => leaf(x, y, l, r)).join('') +
    roses.map(([x, y, r, c]) => rose(x, y, r, c, '#fff4f1', '#e6a3a9')).join('') +
    [[340, 400], [470, 420], [270, 540], [540, 540], [400, 660]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${10 + (i % 2) * 4}" fill="#fff" opacity=".9"/>`).join('') +
    `<path d="M330 740Q400 700 470 740L455 800Q400 770 345 800Z" fill="url(#rib)"/><ellipse cx="365" cy="815" rx="46" ry="20" transform="rotate(20 365 815)" fill="#e7aaa8"/><ellipse cx="435" cy="815" rx="46" ry="20" transform="rotate(-20 435 815)" fill="#e7aaa8"/><circle cx="400" cy="808" r="16" fill="#d98f8f"/>` +
    `<path d="M392 820L370 930M408 820L430 930" stroke="#e7aaa8" stroke-width="16" stroke-linecap="round"/>`;
  return wrap(defs, body);
}

function arch() {
  const defs = grad('sky', [[0, '#cfe3f2'], [1, '#fbf1e2']]) + grad('grass', [[0, '#9dbb8b'], [1, '#6f9166']]) + grad('aisle', [[0, '#f3e6d3'], [1, '#e2cfb4']]);
  const garland = Array.from({ length: 34 }, (_, i) => {
    const a = Math.PI + (i / 33) * Math.PI;
    const x = 400 + Math.cos(a) * 250;
    const y = 470 + Math.sin(a) * 300;
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(18 + rand(i, 2) * 12)}" fill="${['#f4c2c5', '#ffffff', '#f7dcc8', '#e89aa5'][i % 4]}"/>` + (i % 3 === 0 ? leaf(f(x), f(y), 34, f((a * 180) / Math.PI + 90)) : '');
  }).join('');
  const chairs = Array.from({ length: 8 }, (_, i) => `<rect x="${110 + (i % 4) * 24}" y="${780 + Math.floor(i / 4) * 60}" width="16" height="30" rx="3" fill="#fff" opacity=".9"/><rect x="${590 + (i % 4) * 24}" y="${780 + Math.floor(i / 4) * 60}" width="16" height="30" rx="3" fill="#fff" opacity=".9"/>`).join('');
  const body =
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
    bokeh(6, ['#ffffff', '#fbe3c8'], 30, { y1: 400, rmin: 50, rmax: 100, op: 0.5 }) +
    `<rect y="560" width="${W}" height="440" fill="url(#grass)"/>` +
    `<path d="M330 560L470 560L640 1000L160 1000Z" fill="url(#aisle)"/>` +
    chairs +
    `<path d="M150 560V470C150 300 270 190 400 190C530 190 650 300 650 470V560" stroke="#efe2cd" stroke-width="26" fill="none"/>` +
    garland +
    `<g fill="#3a3550" transform="translate(400 640)"><circle cx="-16" cy="-70" r="8"/><rect x="-24" y="-61" width="16" height="36" rx="6"/><rect x="-23" y="-27" width="6" height="27"/><rect x="-14" y="-27" width="6" height="27"/><circle cx="22" cy="-66" r="8"/><path d="M12 -56h20l12 56h-44z"/></g>` +
    Array.from({ length: 14 }, (_, i) => petal(f(200 + rand(i, 3) * 400), f(700 + rand(i, 4) * 260), 8, 13, f(rand(i, 6) * 180), ['#f6cfd0', '#fff'][i % 2], 0.9)).join('');
  return wrap(defs, body);
}

function lights() {
  const defs = grad('bg', [[0, '#0e1430'], [1, '#2d2b58']]) + radial('glow', [[0, '#ffe7a8', 0.95], [0.35, '#ffd27a', 0.35], [1, '#ffd27a', 0]]);
  const bulbs = (base, sag, y0, n) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      const x = t * W;
      const y = y0 + sag * 4 * t * (1 - t) * 0.5 * 2;
      return `<circle cx="${f(x)}" cy="${f(y + 14)}" r="${44 + (i % 3) * 6}" fill="url(#glow)"/><circle cx="${f(x)}" cy="${f(y + 14)}" r="8" fill="#fff6d0"/><path d="M${f(x)} ${f(y)}v8" stroke="#1b1b32" stroke-width="3"/>`;
    }).join('') + `<path d="M0 ${y0}Q${W / 2} ${y0 + sag} ${W} ${y0}" stroke="#191a30" stroke-width="3" fill="none"/>`;
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(16, ['#ffd98a', '#a99cff', '#fff1c4', '#7ea6ff'], 41, { rmin: 24, rmax: 70, op: 0.4 }) +
    bulbs(0, 200, 250, 9) + bulbs(0, 240, 470, 9) + bulbs(0, 200, 700, 7) +
    `<rect y="900" width="${W}" height="100" fill="#0a0d20"/>` +
    Array.from({ length: 5 }, (_, i) => `<circle cx="${100 + i * 150}" cy="900" r="30" fill="#0a0d20"/>`).join('');
  return wrap(defs, body);
}

function dance() {
  const defs = grad('bg', [[0, '#150f28'], [1, '#3a2547']]) + grad('cone', [[0, '#ffe7b8', 0.85], [1, '#ffe7b8', 0]]) + radial('floor', [[0, '#ffe2ae', 0.6], [1, '#ffe2ae', 0]]);
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(14, ['#e58fa0', '#ffd98a', '#8f7bd6'], 51, { rmin: 24, rmax: 70, op: 0.35 }) +
    `<path d="M330 0L470 0L640 900L160 900Z" fill="url(#cone)" opacity=".55"/>` +
    `<ellipse cx="400" cy="900" rx="300" ry="70" fill="url(#floor)"/>` +
    `<g fill="#0a0716" transform="translate(400 880) scale(3)"><circle cx="-26" cy="-136" r="11"/><rect x="-41" y="-124" width="30" height="62" rx="9" transform="rotate(8 -26 -124)"/><rect x="-38" y="-64" width="11" height="64" rx="3"/><rect x="-22" y="-64" width="11" height="64" rx="3"/><circle cx="30" cy="-130" r="10"/><path d="M16 -118Q30 -122 44 -114L86 0H-6Q6 -50 16 -118Z"/><path d="M-8 -100Q10 -108 20 -104" stroke="#0a0716" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M52 -104Q76 -118 84 -100" stroke="#0a0716" stroke-width="5" fill="none" stroke-linecap="round"/></g>` +
    Array.from({ length: 10 }, (_, i) => sparkle(f(120 + rand(i, 3) * 560), f(120 + rand(i, 4) * 600), f(8 + rand(i, 5) * 14), '#ffe7b8', 0.85)).join('');
  return wrap(defs, body);
}

function cake() {
  const defs = grad('bg', [[0, '#f0d6d3'], [1, '#faf1e6']]) + grad('tier', [[0, '#fffdf8'], [1, '#f1e6d6']]);
  const tier = (x, y, w, h) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="url(#tier)"/>` +
    Array.from({ length: Math.floor(w / 26) }, (_, i) => `<circle cx="${x + 13 + i * 26}" cy="${y + 4}" r="13" fill="#fffdf8"/>`).join('') +
    `<rect x="${x}" y="${y + h - 16}" width="${w}" height="16" rx="8" fill="#e9cdbb" opacity=".7"/>`;
  const flowers = [[210, 720], [300, 700], [420, 712], [520, 704], [600, 724], [330, 590], [470, 580], [400, 470], [360, 480]].map(([x, y], i) => rose(x, y, 22 + (i % 3) * 5, ['#f2b6ba', '#ffffff', '#e9959d'][i % 3], '#fff4f1', '#d98a93')).join('');
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
    bokeh(9, ['#ffffff', '#f7c9c9', '#f3e2c7'], 61, { rmin: 40, rmax: 100, op: 0.6 }) +
    `<rect y="800" width="${W}" height="200" fill="#e9d6c2"/><rect y="800" width="${W}" height="14" fill="#f8efe4"/>` +
    tier(170, 690, 460, 110) + tier(245, 560, 310, 130) + tier(310, 450, 180, 110) +
    flowers + [[250, 690, 30, 200], [560, 690, 30, -20], [360, 560, 26, 200], [450, 560, 26, -20]].map(([x, y, l, r]) => leaf(x, y, l, r)).join('') +
    `<path d="M400 440l-26-30a16 16 0 0 1 26-20a16 16 0 0 1 26 20z" fill="#d98f8f" transform="translate(0 -20)"/><path d="M400 448V420" stroke="#d9b26a" stroke-width="4"/>` +
    sparkle(230, 400, 20) + sparkle(590, 380, 16) + sparkle(120, 560, 12);
  return wrap(defs, body);
}

function flatlay() {
  const defs = grad('bg', [[0, '#f2e7d6'], [1, '#e8d8c0']]);
  const lines = Array.from({ length: 34 }, (_, i) => `<path d="M0 ${i * 30}H${W}" stroke="#d9c7a9" stroke-width="1" opacity=".5"/>`).join('');
  const sprig = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0Q120 -30 240 0" stroke="#7d9a6e" stroke-width="5" fill="none"/>${[30, 70, 110, 150, 190].map((p, i) => leaf(p, -8 - (i % 2) * 6, 34, i % 2 ? -50 : 50, '#7d9a6e')).join('')}</g>`;
  const body =
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>${lines}` +
    sprig(80, 260, -18) + sprig(480, 800, 165) +
    `<g transform="translate(400 520) rotate(-8)"><rect x="-260" y="-170" width="520" height="340" rx="10" fill="#fffaf0" stroke="#e5d6bd" stroke-width="3"/><path d="M-260 -170L0 20L260 -170" fill="#f6ead3" stroke="#e5d6bd" stroke-width="3"/><path d="M-260 170L-40 0M260 170L40 0" stroke="#e5d6bd" stroke-width="3"/><circle cx="0" cy="20" r="34" fill="#a94c58"/><circle cx="0" cy="20" r="22" fill="#c46372"/><path d="M-10 20a10 10 0 0 1 20 0" stroke="#a94c58" stroke-width="4" fill="none"/></g>` +
    `<g transform="translate(470 300) rotate(9)"><rect x="-170" y="-90" width="340" height="180" rx="6" fill="#ffffff" stroke="#eadfcb" stroke-width="3"/><path d="M-110 -30H110M-90 10H90M-60 46H60" stroke="#c9a46a" stroke-width="5" stroke-linecap="round"/></g>` +
    [[210, 790, 26, '#f2b6ba'], [270, 830, 22, '#ffffff'], [180, 850, 20, '#e9959d'], [620, 250, 24, '#f8d2d3'], [660, 300, 18, '#ffffff']].map(([x, y, r, c]) => rose(x, y, r, c, '#fff4f1', '#e6a3a9')).join('') +
    Array.from({ length: 9 }, (_, i) => petal(f(rand(i, 3) * W), f(rand(i, 4) * H), 8, 14, f(rand(i, 6) * 180), '#f6cfd0', 0.75)).join('');
  return wrap(defs, body);
}

const files = { groom, bride, gallery1: sunset, gallery2: rings, gallery3: bouquet, gallery4: arch, gallery5: lights, gallery6: dance, gallery7: cake, gallery8: flatlay };
for (const [slot, make] of Object.entries(files)) {
  const svg = make();
  writeFileSync(`${OUT}${slot}.svg`, svg);
  console.log(slot.padEnd(9), Math.round(svg.length / 1024) + ' KB');
}
