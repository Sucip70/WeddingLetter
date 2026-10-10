// Ilustrasi vektor untuk tema "Sepasang Merpati": merpati yang mengepak (bulu-bulu bertumpuk di sepanjang lengan sayap)
// dan bunga lily. Semua dibangun dari bentuk sederhana dan mengikuti warna tema (--p). Tanpa hook / id gradien, jadi
// aman dipakai di server maupun klien dan boleh muncul berkali-kali. Kepakan murni CSS (lihat globals.css, "Merpati").
import type { CSSProperties } from 'react';

const f = (n: number) => n.toFixed(1);

// Bulu: gelendong berujung tumpul, pangkal di (0,0), memanjang ke +x sepanjang L.
const feather = (L: number, w: number) =>
  `M0 0C${f(L * 0.2)} ${f(-w)} ${f(L * 0.8)} ${f(-w * 0.95)} ${f(L * 0.97)} ${f(-w * 0.3)}Q${f(L * 1.03)} 0 ${f(L * 0.97)} ${f(w * 0.3)}C${f(L * 0.8)} ${f(w * 0.95)} ${f(L * 0.2)} ${f(w)} 0 0Z`;

// ----- geometri merpati (menghadap kanan, kotak 300x200) -----
const SHOULDER = { x: 184, y: 108 };
const TAIL_ROOT = { x: 98, y: 130 };
export const DOVE_VIEWBOX = '0 0 300 200';

// Badan + kepala dalam satu jalur: dada gemuk, leher melengkung, kepala kecil bulat, paruh pendek.
const BODY =
  'M271 86L254 79C252 69 245 63 235 64C224 65 219 75 221 85C216 93 204 97 190 99C160 103 122 113 94 129C120 148 160 154 196 151C229 148 251 133 254 112C256 102 255 96 252 90Z';
const BELLY = 'M100 136C126 150 162 156 198 153C230 150 252 135 255 114C246 134 222 144 194 146C158 148 122 142 100 136Z';

interface Feather {
  x: number;
  y: number;
  a: number; // sudut dasar (derajat, 0 = kanan) dalam kerangka lengan: lengan menunjuk ke atas (-y)
  L: number;
  w: number;
  swing: number; // ayunan tambahan saat mengepak (derajat)
  lag: number; // jeda fase (pecahan periode) supaya bulu ujung tertinggal
}
const secondaries: Feather[] = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ x: -1, y: -7 - i * 8, a: 150 + i * 5.5, L: [62, 64, 64, 62, 58, 54, 50][i]!, w: 8.6, swing: 4 + i * 1.3, lag: 0.012 * i }));
const middles: Feather[] = [0, 1, 2].map((i) => ({ x: -1, y: -62 - i * 2, a: 196 + i * 14, L: [72, 80, 88][i]!, w: 9, swing: 12 + i * 1.5, lag: 0.04 + i * 0.012 }));
const primaries: Feather[] = [0, 1, 2, 3, 4, 5].map((i) => ({ x: 1, y: -64 - i * 0.5, a: 232 + i * 9.5, L: [94, 101, 103, 99, 92, 82][i]!, w: 9.6, swing: 15 + i * 1.4, lag: 0.07 + i * 0.012 }));
const FLIGHT = [...secondaries, ...middles, ...primaries];
// Penutup (bulu pendek di pangkal): menumpuk di atas bulu panjang supaya tepi sayap bergerigi halus.
const COVERTS: Feather[] = FLIGHT.map((p) => ({ ...p, L: p.L * (p.a > 180 && p.a < 225 ? 0.46 : 0.5), w: p.w * 0.9, swing: p.swing * 0.9 }));
const LESSER: Feather[] = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x: 2, y: -5 - i * 7.6, a: 168 + i * 3, L: 27, w: 6.6, swing: 2, lag: 0.01 * i }));
const WING_LAYERS = [FLIGHT, COVERTS, LESSER];

const TAIL = [158, 168, 178, 188, 198].map((a, i) => ({ a, L: [64, 72, 77, 72, 64][i]!, w: 8.4 }));

// Siluet satu warna (ikon kecil & mask CSS): badan + ekor + satu sayap terangkat, dihitung dengan memutar/menggeser tiap
// bulu secara manual ke koordinat kotak (perintah path yang dipakai hanya M, C, Q, Z dengan koordinat mutlak).
type Step = { rot?: number; move?: { x: number; y: number } };
function place(d: string, steps: Step[]) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  let i = 0;
  let out = '';
  for (const cmd of d.match(/[MCQZ]/g)!) {
    if (cmd === 'Z') {
      out += 'Z';
      continue;
    }
    const count = cmd === 'C' ? 3 : cmd === 'Q' ? 2 : 1;
    out += cmd;
    for (let k = 0; k < count; k++, i += 2) {
      let x = nums[i]!;
      let y = nums[i + 1]!;
      for (const s of steps) {
        if (s.rot !== undefined) {
          const a = (s.rot * Math.PI) / 180;
          [x, y] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
        }
        if (s.move) {
          x += s.move.x;
          y += s.move.y;
        }
      }
      out += `${k ? ' ' : ''}${f(x)} ${f(y)}`;
    }
  }
  return out;
}
// `arm` = sudut lengan (derajat; positif = condong ke depan, negatif = ke belakang).
// Badan ditulis berlawanan arah jarum jam; bulu searah jarum jam. Pada satu path (fill nonzero) arah yang berlawanan saling
// meniadakan di bagian yang bertumpuk (lubang putih), jadi untuk siluet badannya dibalik arahnya.
const BODY_CW = 'M271 86L252 90C255 96 256 102 254 112C251 133 229 148 196 151C160 154 120 148 94 129C122 113 160 103 190 99C204 97 216 93 221 85C219 75 224 65 235 64C245 63 252 69 254 79Z';
export const doveSilhouette = (arm: number) =>
  [
    BODY_CW,
    ...TAIL.map((t) => place(feather(t.L, t.w), [{ rot: t.a }, { move: TAIL_ROOT }])),
    ...FLIGHT.map((p) => place(feather(p.L, p.w), [{ rot: p.a }, { move: { x: p.x, y: p.y } }, { rot: arm }, { move: SHOULDER }])),
  ].join('');
export const DOVE_SILHOUETTE = doveSilhouette(-55);

const EDGE = 'color-mix(in srgb, var(--p, #6b7fa3) 46%, #fff)';
const SHADE = 'color-mix(in srgb, var(--p, #6b7fa3) 15%, #fff)';
const SHADE2 = 'color-mix(in srgb, var(--p, #6b7fa3) 26%, #fff)';
const RIB = 'color-mix(in srgb, var(--p, #6b7fa3) 28%, #fff)';

// Satu sayap: grup lengan (diputar kelas .wl-arm di sekitar bahu) berisi bulu-bulu; tiap bulu punya ayunan sendiri (.wl-fe)
// dengan jeda fase berbeda, jadi ujung sayap tertinggal seperti sayap sungguhan. Sayap jauh hanya ikut lengan.
function Wing({ far }: { far?: boolean }) {
  const layers = far ? [FLIGHT, COVERTS] : WING_LAYERS;
  return (
    <g transform={far ? `translate(${SHOULDER.x - 9} ${SHOULDER.y - 3}) scale(.93)` : `translate(${SHOULDER.x} ${SHOULDER.y})`}>
      <g className={far ? 'wl-arm wl-arm-far' : 'wl-arm'}>
        {layers.map((layer, li) =>
          layer.map((p, i) => (
            <g key={`${li}-${i}`} transform={`translate(${p.x} ${p.y})`}>
              <g className={far ? undefined : 'wl-fe'} style={far ? undefined : ({ '--sw': p.swing, '--lag': p.lag } as CSSProperties)}>
                <g transform={`rotate(${p.a})`}>
                  <path d={feather(p.L, p.w)} fill={far ? (li === 0 ? SHADE2 : SHADE) : '#fff'} stroke={EDGE} strokeWidth={li === 0 ? 0.8 : 0.7} strokeLinejoin="round" />
                  {!far && li === 0 && <path d={`M5 0H${f(p.L * 0.86)}`} stroke={RIB} strokeWidth=".7" strokeLinecap="round" />}
                </g>
              </g>
            </g>
          )),
        )}
      </g>
    </g>
  );
}

// Merpati menghadap kanan. `flap` = mengepak terus; `speed` = detik per kepakan; `olive` = ranting zaitun di paruh.
// Beri `className="-scale-x-100"` untuk menghadap kiri; `--flap-delay` (style) menggeser fase kepakan antar merpati.
export function Dove({ className = '', flap = true, speed = 0.9, olive = false, style }: { className?: string; flap?: boolean; speed?: number; olive?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox={DOVE_VIEWBOX} className={`overflow-visible ${flap ? 'wl-flapping' : ''} ${className}`} style={{ '--flap': `${speed}s`, ...style } as CSSProperties} aria-hidden>
      <g style={{ filter: 'drop-shadow(0 6px 8px color-mix(in srgb, var(--p, #6b7fa3) 40%, transparent))' }}>
        <g className="wl-bob">
          <Wing far />
          {TAIL.map((t, i) => (
            <path key={i} d={feather(t.L, t.w)} transform={`translate(${TAIL_ROOT.x} ${TAIL_ROOT.y}) rotate(${t.a})`} fill={i % 2 ? '#fff' : SHADE} stroke={EDGE} strokeWidth=".8" strokeLinejoin="round" />
          ))}
          <path d={BODY} fill="#fff" stroke={EDGE} strokeWidth="1" strokeLinejoin="round" />
          <path d={BELLY} fill={SHADE} opacity=".75" />
          {/* garis bulu leher & dada */}
          <path d="M226 96C236 104 246 106 252 100M206 104C222 116 244 122 252 114M184 112C206 128 232 134 250 126" fill="none" stroke={RIB} strokeWidth=".9" strokeLinecap="round" />
          {/* paruh, mata */}
          <path d="M254 79L271 86L253 91Z" fill="#f2d3c4" stroke="#d8a998" strokeWidth=".6" strokeLinejoin="round" />
          <circle cx="251" cy="81" r="2.6" fill="#fff" stroke="#d8a998" strokeWidth=".5" />
          <circle cx="242" cy="76" r="3.3" fill="#2b3350" />
          <circle cx="243.2" cy="74.8" r="1.1" fill="#fff" />
          {olive && (
            <g>
              <path d="M268 87C262 102 248 114 226 124" fill="none" stroke="#7a9a6a" strokeWidth="1.8" strokeLinecap="round" />
              {[[260, 98, 40], [252, 106, 30], [243, 113, 22], [234, 119, 14], [264, 94, -52], [255, 102, -44], [246, 109, -36]].map(([x, y, r], i) => (
                <path key={i} d="M0 0C4-5 12-5 17 0C12 4.500 4 4.500 0 0Z" transform={`translate(${x} ${y}) rotate(${r})`} fill="#8fb27c" stroke="#6b8c5b" strokeWidth=".5" />
              ))}
            </g>
          )}
          <Wing />
        </g>
      </g>
    </svg>
  );
}

// Sepasang merpati berhadapan dengan setangkai lily di antaranya (lambang di sampul & footer).
export function DovePair({ className = '', size = 'w-[3.6rem]' }: { className?: string; size?: string }) {
  return (
    <div className={`flex items-end justify-center ${className}`} style={{ color: 'var(--p)' }} aria-hidden>
      <Dove className={size} speed={1.4} style={{ transform: 'rotate(5deg)' } as CSSProperties} />
      <LilyBloom className="mx-0.5 mb-1 w-[1.7rem] shrink-0" />
      <Dove className={`-scale-x-100 ${size}`} speed={1.4} style={{ transform: 'rotate(5deg)', '--flap-delay': '-0.5s' } as CSSProperties} />
    </div>
  );
}

// ----- lily -----
// Lily tampak depan (bintang): enam kelopak runcing (tiga luar lebar di depan, tiga dalam di belakang), urat tengah, bintik
// halus di pangkal, dan benang sari melengkung berkepala sari. `className` menentukan ukuran; garis = currentColor.
const lilyPetal = (L: number, w: number) =>
  `M0 0C${f(L * 0.18)} ${f(-w * 0.9)} ${f(L * 0.55)} ${f(-w * 1.15)} ${f(L * 0.8)} ${f(-w * 0.55)}Q${f(L * 0.95)} ${f(-w * 0.15)} ${f(L)} 0Q${f(L * 0.95)} ${f(w * 0.15)} ${f(L * 0.8)} ${f(w * 0.55)}C${f(L * 0.55)} ${f(w * 1.15)} ${f(L * 0.18)} ${f(w * 0.9)} 0 0Z`;
const SPOTS = [[10, -3], [16, 3], [22, -2], [14, -7], [26, 2], [20, 6], [30, -1]];

// Bentuk bunga saja (pusat di 0,0, jari-jari ±62): bisa ditempatkan di dalam <g transform> pada svg lain.
export function LilyShapes() {
  return (
    <>
      {[-90, 30, 150].map((a) => (
        <g key={`i${a}`} transform={`rotate(${a})`}>
          <path d={lilyPetal(50, 11)} fill={SHADE} stroke="currentColor" strokeWidth=".9" strokeLinejoin="round" opacity=".92" />
          <path d="M5 0H42" stroke="currentColor" strokeWidth=".6" opacity=".45" />
        </g>
      ))}
      {[-30, 90, 210].map((a) => (
        <g key={`o${a}`} transform={`rotate(${a})`}>
          <path d={lilyPetal(58, 15)} fill="#fff" stroke="currentColor" strokeWidth=".95" strokeLinejoin="round" />
          <path d="M5 0H48" stroke="currentColor" strokeWidth=".65" opacity=".5" />
          {SPOTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r=".9" fill="currentColor" opacity=".4" />
          ))}
        </g>
      ))}
      {[-66, -30, 6, 54, 90, 126].map((a, i) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d={`M0 0C14 ${i % 2 ? -4 : 4} 26 ${i % 2 ? -3 : 3} 33 0`} stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
          <ellipse cx="35" cy="0" rx="5" ry="2.3" fill="var(--s, #d7c48a)" stroke="currentColor" strokeWidth=".5" />
        </g>
      ))}
      <circle r="3.4" fill="var(--s, #d7c48a)" stroke="currentColor" strokeWidth=".6" />
    </>
  );
}

export function LilyBloom({ className = '', rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg viewBox="-62 -62 124 124" className={`overflow-visible ${className}`} fill="none" aria-hidden style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}>
      <LilyShapes />
    </svg>
  );
}

// Daun lanset panjang untuk ranting lily.
const leaf = (L: number, w: number) => `M0 0C${f(L * 0.25)} ${f(-w)} ${f(L * 0.7)} ${f(-w * 0.9)} ${f(L)} 0C${f(L * 0.7)} ${f(w * 0.9)} ${f(L * 0.25)} ${f(w)} 0 0Z`;
const LEAF_FILL = 'color-mix(in srgb, var(--p, #6b7fa3) 30%, #cfe0d3)';

// Ranting lily setinggi 140x230: tangkai melengkung, daun, satu bunga mekar & dua kuncup. Pangkal di bawah-tengah.
export function LilySprig({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 140 230" className={`overflow-visible ${className}`} style={flip ? { transform: 'scaleX(-1)' } : undefined} fill="none" aria-hidden>
      <path d="M68 230C64 190 72 150 82 96" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M76 124C92 118 104 104 110 84" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M72 150C58 142 46 128 42 108" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {[
        [66, 214, -150, 78], [70, 186, -28, 70], [68, 168, -160, 62], [74, 142, -40, 54],
      ].map(([x, y, a, L], i) => (
        <path key={i} d={leaf(L!, 7)} transform={`translate(${x} ${y}) rotate(${a})`} fill={LEAF_FILL} stroke="currentColor" strokeWidth=".8" strokeLinejoin="round" />
      ))}
      <g transform="translate(110 78) rotate(18) scale(.34)"><g transform="translate(0 36)"><path d="M0 34C-10 20 -11 -6 0 -34C11 -6 10 20 0 34Z" fill="#fff" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /></g></g>
      <g transform="translate(42 98) rotate(-24) scale(.3)"><g transform="translate(0 36)"><path d="M0 34C-10 20 -11 -6 0 -34C11 -6 10 20 0 34Z" fill="#fff" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" /></g></g>
      <g transform="translate(86 62) rotate(-8) scale(.82)"><LilyShapes /></g>
    </svg>
  );
}

// Kuncup lily (tertutup) untuk ranting.
export function LilyBud({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-12 -36 24 72" className={`overflow-visible ${className}`} fill="none" aria-hidden>
      <path d="M0 34C-10 20 -11 -6 0 -34C11 -6 10 20 0 34Z" fill="#fff" stroke="currentColor" strokeWidth=".9" strokeLinejoin="round" />
      <path d="M0 30V-28M-5 22C-8 8 -6 -10 0 -28M5 22C8 8 6 -10 0 -28" stroke="currentColor" strokeWidth=".5" opacity=".5" />
    </svg>
  );
}
