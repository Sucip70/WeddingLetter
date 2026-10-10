// Gerbang "Kayon wayang" (Batik Jawa, kulit keraton): dua daun kelir maroon berpola kawung & parang menutup layar, gunungan emas
// berdiri di tengah diterangi cahaya, nama mempelai tertulis di bawahnya. Ketukan (phase 'opening') meniru pembuka lakon: gunungan
// digoyang dalang, bersinar, lalu terangkat dan memudar, kemudian kedua daun kelir bergeser ke kiri-kanan menyingkap sampul
// (REVEALS_COVER, REVEAL_DELAY_MS.kayon = saat daun mulai bergeser).
//
// RINGAN SENGAJA: tanpa JavaScript per frame dan tanpa state; semua gerak animasi CSS pada transform & opacity yang digerakkan selector
// `.wl-gate[data-phase=opening]` (aturan .kg-* di GATE_CSS, gates.tsx), jadi berjalan di compositor dan aman untuk SSR & "kurangi gerakan".
// Pola batik adalah gambar CSS (variabel --kr-* dari akar undangan, lihat batik-art.ts), bukan simpul SVG. Waktunya = KAYON_T.
import { Particles } from './effects';
import { Gunungan } from './gunungan-art';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';

const { dear: DEAR, guestFallback: GUEST_FALLBACK } = STRINGS.id;

// ----- waktu (detik sejak ketukan); harus sama dengan aturan .kg-* di GATE_CSS. GATE_MS.kayon & REVEAL_DELAY_MS.kayon ikut. -----
// gunungan bergoyang 0-0,7 | cahaya menyala 0,5-1,7 | gunungan naik & memudar 0,6-1,7 | daun kelir bergeser 0,8-1,95
export const KAYON_T = { wobble: 0.7, lift: 0.6, panels: 0.8, panelsDur: 1.15 };

const AKSARA = 'ꦲꦸꦤ꧀ꦝꦁꦔꦤ꧀'; // "undhangan" (undangan), aksara Jawa dekoratif

// `phase` tidak dipakai di sini: CSS membaca fase dari atribut data-phase pada .wl-gate (lihat catatan di atas).
export function WayangKayon({ names, kicker, guest, headingFamily }: { phase: GatePhase; names: string; kicker: string; guest: string | null; headingFamily: string }) {
  return (
    <div className="kg-scene" aria-hidden>
      {/* daun kelir kiri & kanan (parang di tepi luar, pita kawung di atas & bawah, garis emas di tengah) */}
      <div className="kg-panel kg-pl">
        <i className="kg-parang" />
        <i className="kg-band kg-bt" />
        <i className="kg-band kg-bb" />
        <i className="kg-seam" />
      </div>
      <div className="kg-panel kg-pr">
        <i className="kg-parang" />
        <i className="kg-band kg-bt" />
        <i className="kg-band kg-bb" />
        <i className="kg-seam" />
      </div>

      <div className="kg-dust">
        <Particles kind="dust" count={14} mode="rise" height="100cqh" />
      </div>

      <div className="kg-fade kg-head">
        <p className="kg-aksara wl-foil-lit" lang="jv">{AKSARA}</p>
        <p className="kg-kicker">{kicker}</p>
      </div>

      {/* gunungan: cahaya di belakangnya, bergoyang & terangkat saat diketuk */}
      <div className="kg-stage">
        <div className="kg-glow" />
        <div className="kg-mark">
          <div className="kg-float">
            <Gunungan />
          </div>
        </div>
      </div>

      <div className="kg-fade kg-names">
        <b className={names.length > 22 ? 'kg-long' : undefined} style={{ fontFamily: headingFamily }}>{names}</b>
        <span className="kg-rule"><i /></span>
        <small>{DEAR}</small>
        <em>{guest || GUEST_FALLBACK}</em>
      </div>
    </div>
  );
}
