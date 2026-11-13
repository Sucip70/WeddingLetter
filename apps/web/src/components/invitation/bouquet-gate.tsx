// Gerbang "Lempar buket" (Buket Pengantin): buket pengantin berpita melayang pelan di tengah halaman putih bertabur kelopak.
// Ketukan pada `.wl-gate` (gates.tsx) mengubah `data-phase` ke 'opening': buket menunduk sesaat (ancang-ancang), dilempar ke atas
// sambil berputar dan menyusut, di puncaknya meledak jadi kilatan dan hamburan kelopak, bunga kecil, dan hati warna-warni, lalu
// latar putih memudar menyingkap sampul (REVEALS_COVER). Bunga digambar di flora-art.ts / flora-comp.ts; warna bunga utama = --s.
//
// RINGAN SENGAJA: seluruh gerak adalah animasi CSS pada transform & opacity (aturan di GATE_CSS, gates.tsx) sehingga berjalan di
// compositor/GPU tanpa JavaScript per frame, dan tidak ada animasi yang memicu tata letak atau cat ulang (tidak memakai mask,
// filter, atau properti kustom beranimasi). Dulu ada "dinding bunga" yang menyapu dari bawah ke atas lewat mask + --wipe: itu berat
// di ponsel, jadi dihapus (jangan dikembalikan). Komponen ini tidak punya state: semua perubahan lewat selector
// `.wl-gate[data-phase=opening]`, jadi aman untuk SSR dan "kurangi gerakan" (GATE_CSS mematikan semua animasi lalu gerbang memudar).
import type { CSSProperties } from 'react';
import { BloomCorner, BloomDivider, PETAL_COLORS } from './bloom-parts';
import { Particles } from './effects';
import { bouquetHead, bouquetStems, paperLeft, paperRight, ribbonBand, ribbonBow } from './flora-comp';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';

const rand = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// ----- waktu (detik sejak ketukan); harus sama dengan aturan .bq-* di GATE_CSS. GATE_MS.bouquet & REVEAL_DELAY_MS.bouquet ikut. -----
// ancang-ancang 0-0,65 | lempar 0,3-1,25 | kilatan & hamburan mulai 1,15 | latar memudar 1,15-1,95 | kelopak terakhir selesai ±3,2
export const BOUQUET_T = { toss: 0.3, tossDur: 0.95, pop: 1.2, fade: 1.15 };

// Titik puncak lemparan relatif terhadap pusat buket (cqw/cqh = persen lebar/tinggi gerbang); sama dengan keyframes bq-toss.
const APEX = { x: 12, y: -26 };

const BOUQUET = bouquetStems() + paperLeft() + paperRight() + bouquetHead() + ribbonBand() + ribbonBow();

const PETAL = 'M12 1.5C17.500 6 18 14 12 22.500C6 14 6.500 6 12 1.500Z';
const INK = 'color-mix(in srgb, var(--tx) 90%, var(--p))';

// Kelopak yang lepas sepanjang lintasan lemparan (posisi awal = titik di lintasan pada saat itu).
const TRAIL = Array.from({ length: 10 }, (_, i) => {
  const u = 0.12 + (i / 10) * 0.8;
  const e = 1 - (1 - u) * (1 - u);
  return {
    id: i,
    left: r3(APEX.x * u),
    top: r3(APEX.y * e),
    delay: r3(BOUQUET_T.toss + u * BOUQUET_T.tossDur),
    dx: r3((rand(i, 1) - 0.5) * 160),
    dy: r3(120 + rand(i, 2) * 220),
    size: r3(12 + rand(i, 3) * 11),
    spin: r3((rand(i, 4) - 0.5) * 540),
    color: PETAL_COLORS[i % PETAL_COLORS.length]!,
    duration: r3(1.2 + rand(i, 5) * 0.7),
  };
});

// Hamburan di puncak: kelopak, bunga kecil, dan hati menyebar ke segala arah lalu jatuh.
const BURST = Array.from({ length: 36 }, (_, i) => {
  const a = rand(i, 6) * Math.PI * 2;
  const d = 80 + rand(i, 7) * 230;
  const flower = i % 3 === 0;
  const heart = i % 7 === 4;
  return {
    id: i,
    flower,
    heart,
    x1: r3(Math.cos(a) * d),
    y1: r3(Math.sin(a) * d * 0.8 - 40),
    x2: r3(Math.cos(a) * d * 1.25 + (rand(i, 8) - 0.5) * 90),
    y2: r3(Math.sin(a) * d * 0.8 + 230 + rand(i, 9) * 260),
    size: r3(flower ? 22 + rand(i, 10) * 14 : heart ? 18 + rand(i, 10) * 10 : 18 + rand(i, 10) * 18),
    spin: r3((rand(i, 11) - 0.5) * 620),
    delay: r3(BOUQUET_T.pop + rand(i, 12) * 0.22),
    duration: r3(1.1 + rand(i, 13) * 0.7),
    color: PETAL_COLORS[(i * 3) % PETAL_COLORS.length]!,
  };
});

function MiniBlossom({ color }: { color: string }) {
  return (
    <svg viewBox="-12 -12 24 24" className="h-full w-full" aria-hidden>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx="0" cy="-5.600" r="4.800" transform={`rotate(${a})`} fill={color} stroke="rgba(120,60,90,.28)" strokeWidth=".5" />
      ))}
      <circle r="2.600" fill="#f8d86e" />
    </svg>
  );
}

// `phase` tidak dipakai di sini: CSS membaca fase dari atribut data-phase pada .wl-gate (lihat catatan di atas).
export function BouquetGate({ names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  const apexPos = { left: `calc(50cqw + ${APEX.x}cqw)`, top: `calc(var(--cy) + ${APEX.y}cqh)` };
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ '--bw': 'min(62cqw, calc(51cqh - 112px))', '--cy': 'calc(46.5cqh + 25px)' } as CSSProperties}>
      {/* ===== latar putih bertabur awan pastel: memudar setelah buket meledak ===== */}
      <div className="bq-scene">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 26% at 6% 0%, rgba(246,179,195,.42), transparent 72%), radial-gradient(ellipse 64% 24% at 98% 4%, rgba(192,166,238,.36), transparent 72%), radial-gradient(ellipse 60% 22% at 0% 100%, rgba(156,199,238,.34), transparent 72%), radial-gradient(ellipse 66% 24% at 100% 96%, rgba(248,216,110,.32), transparent 72%), radial-gradient(ellipse 54% 30% at 50% 56%, rgba(255,255,255,1), transparent 78%), #fffdfc',
          }}
        />
        <Particles kind="blossom" count={11} mode="fall" height="100cqh" />

        {/* karangan sudut */}
        <div className="pointer-events-none absolute left-[-1cqw] top-[-1cqw] w-[30cqw]"><BloomCorner className="w-full" rotate={0} /></div>
        <div className="pointer-events-none absolute right-[-1cqw] top-[-1cqw] w-[30cqw]"><BloomCorner className="w-full" rotate={90} /></div>
        <div className="pointer-events-none absolute bottom-[-1cqw] left-[-1cqw] w-[26cqw]"><BloomCorner className="w-full" rotate={270} /></div>
        <div className="pointer-events-none absolute bottom-[-1cqw] right-[-1cqw] w-[26cqw]"><BloomCorner className="w-full" rotate={180} /></div>

        {/* nama (memudar saat buket dilempar supaya lintasannya bersih) */}
        <div className="bq-fade absolute inset-x-0 top-[12%] flex flex-col items-center px-[12cqw] text-center" style={{ color: INK }}>
          <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.75 }}>{kicker}</p>
          <h2 className="mt-1.5 leading-[1.12]" style={{ fontFamily: headingFamily, fontSize: names.length > 34 ? '2.2rem' : names.length > 22 ? '2.9rem' : '3.4rem', fontWeight: 400, color: 'var(--p)', textShadow: '0 0 18px #fff, 0 0 8px #fff' }}>
            {names}
          </h2>
          <BloomDivider className="mt-0.5 w-[44cqw]" />
        </div>

        {/* bayangan di lantai + kelopak yang tergeletak */}
        <div className="absolute" style={{ left: 'calc(50cqw - var(--bw) * 0.46)', width: 'calc(var(--bw) * 0.92)', top: 'calc(var(--cy) + var(--bw) * 0.6)', height: 'calc(var(--bw) * 0.2)', background: 'radial-gradient(ellipse, color-mix(in srgb, var(--s) 34%, rgba(90,60,70,.4)) 0, transparent 70%)', opacity: 0.45 }} />
        {[[-0.5, 0.58, -30, 0], [0.42, 0.62, 40, 1], [-0.22, 0.66, 100, 2], [0.62, 0.55, -60, 3], [-0.62, 0.52, 10, 4]].map(([x, y, rot, c], i) => (
          <svg key={i} viewBox="0 0 24 24" className="absolute" style={{ left: `calc(50cqw + var(--bw) * ${x})`, top: `calc(var(--cy) + var(--bw) * ${y})`, width: 'calc(var(--bw) * 0.07)', transform: `rotate(${rot}deg)`, opacity: 0.9 }} aria-hidden>
            <path d={PETAL} fill={PETAL_COLORS[(c as number) % PETAL_COLORS.length]} stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
          </svg>
        ))}

        {/* tamu */}
        <div className="bq-fade absolute inset-x-0 bottom-[17%] px-6 text-center" style={{ color: INK }}>
          <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 13, fontStyle: 'italic', opacity: 0.75 }}>{STRINGS.id.dear}</p>
          <p className="mt-0.5 text-[1.4rem] font-semibold" style={{ fontFamily: 'var(--font-cormorant), serif' }}>
            {guest || STRINGS.id.guestFallback}
          </p>
        </div>
      </div>

      {/* ===== kelopak di sepanjang lintasan lemparan ===== */}
      {TRAIL.map((p) => (
        <span
          key={p.id}
          className="bq-trail pointer-events-none"
          style={{ left: `calc(50cqw + ${p.left}cqw)`, top: `calc(var(--cy) + ${p.top}cqh)`, width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2, color: p.color, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--spin': `${p.spin}deg` } as CSSProperties}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-full w-full">
            <path d={PETAL} fill="currentColor" stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
          </svg>
        </span>
      ))}

      {/* ===== buket: ancang-ancang (squash) -> dilempar (toss); goyang pelan saat diam (sway) ===== */}
      <div className="bq-toss absolute" style={{ left: 'calc(50cqw - var(--bw) / 2)', width: 'var(--bw)', height: 'calc(var(--bw) * 1.3333)', top: 'calc(var(--cy) - var(--bw) * 0.6667)' }}>
        <div className="bq-squash h-full w-full">
          <div className="wl-sway h-full w-full">
            <svg viewBox="0 0 300 400" className="h-full w-full overflow-visible" dangerouslySetInnerHTML={{ __html: BOUQUET }} aria-hidden />
          </div>
        </div>
      </div>

      {/* ===== kilatan & hamburan di puncak ===== */}
      <div className="bq-flash pointer-events-none absolute" style={{ ...apexPos, width: '90cqw', height: '90cqw', marginLeft: '-45cqw', marginTop: '-45cqw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,1) 0, rgba(255,228,240,.9) 22%, rgba(255,200,224,.5) 44%, transparent 70%)' }} aria-hidden />
      <div className="pointer-events-none absolute" style={{ ...apexPos, width: 0, height: 0 }} aria-hidden>
        {BURST.map((b) => (
          <span
            key={b.id}
            className="bq-bit"
            style={{ width: b.size, height: b.size, left: -b.size / 2, top: -b.size / 2, color: b.color, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s`, '--x1': `${b.x1}px`, '--y1': `${b.y1}px`, '--x2': `${b.x2}px`, '--y2': `${b.y2}px`, '--spin': `${b.spin}deg` } as CSSProperties}
          >
            {b.flower ? (
              <MiniBlossom color={b.color} />
            ) : b.heart ? (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path d="M12 21C5 15 2 11.500 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 3.500-3 7-10 13Z" fill="#ec7f9d" stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-full w-full">
                <path d={PETAL} fill="currentColor" stroke="rgba(120,60,90,.25)" strokeWidth=".5" />
              </svg>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
