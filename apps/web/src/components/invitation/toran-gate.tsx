'use client';

/* eslint-disable @next/next/no-img-element */
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasToranGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'vivaha-rani' && artwork?.designId === 'vivaha-rani' && !!(
    artwork.assets.gateBackground && artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/* Gerbang "Rani Toran" (artwork-handoff/india/vivaha-rani/gate-raster/motion-spec.md): dua panel sutra rani/sindoor bersulam zardozi dengan jendela
   lengkung transparan; di baliknya kertas ivory-chikan berhias toran marigold (gate-background), dan genda di sambungan. Semua lapisan 2:3 yang sama,
   dipasang di "panggung" selebar layar (tinggi = 1,5 x lebar) yang dipusatkan; sisa atas-bawah di ponsel tinggi diisi merah sindoor polos.
   Gerak 1500 ms: genda ditekan lalu naik dan memudar, panel sutra bergeser keluar horizontal, teks memudar dan sampul tersingkap; tanpa partikel
   (tanpa kelopak/bubuk). Teks hidup berada di kertas ivory, di atas gate-background. */
export function ToranGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  return (
    <div className="tg" data-phase={phase} data-preview={previewState} data-long={names.length > 20 ? 'true' : 'false'}>
      <style>{GATE_CSS}</style>
      <div className="tg-bg" aria-hidden />
      <div className="tg-stage">
        <img src={rasterAsset(artwork, 'gateBackground')} alt="" draggable={false} className="tg-card" />
        <div className="tg-copy">
          <p className="tg-kicker">{kicker}</p>
          <h1 className="tg-names">{names}</h1>
          {guest && <p className="tg-guest"><span>Kepada Yth.</span><strong>{guest}</strong></p>}
          {cta && <p className="tg-cta">{cta}</p>}
        </div>
        <img src={rasterAsset(artwork, 'gateTransition')} alt="" draggable={false} className="tg-panel tg-panel-l" />
        <img src={rasterAsset(artwork, 'gateForeground')} alt="" draggable={false} className="tg-panel tg-panel-r" />
        <div className="tg-genda"><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
      </div>
    </div>
  );
}

const GATE_CSS = `
.tg{--tg-ink:#332722;--tg-rani:#8a1230;--tg-gold:#8a6326;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;pointer-events:none}
.tg *{box-sizing:border-box}
.tg-bg{position:absolute;inset:0;z-index:1;background:linear-gradient(#8f1224,#a41425 50%,#8f1224);transition:opacity .7s ease .5s}
.tg-stage{position:absolute;left:0;right:0;top:50%;z-index:2;height:150cqw;transform:translateY(-50%)}
.tg-card{position:absolute;inset:0;width:100%;height:100%;display:block;transition:opacity .75s ease .5s}
.tg-copy{position:absolute;inset:0;z-index:4;text-align:center;transition:opacity .55s ease .25s}
.tg-copy>*{position:absolute;left:27%;right:27%;margin:0}
.tg-kicker{top:21.6%;font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.2cqw,10px);font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--tg-gold)}
.tg-names{top:25.6%;left:24%;right:24%;font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(25px,7.6cqw,32px);font-weight:600;line-height:1.1;text-wrap:balance;overflow-wrap:anywhere;color:var(--tg-rani)}
.tg[data-long=true] .tg-names{font-size:clamp(20px,6cqw,26px)}
.tg-guest{top:37.5%;left:33%;right:33%;display:flex;flex-direction:column;gap:.25em;font-family:var(--font-source),sans-serif;font-size:clamp(9px,2.5cqw,11px);letter-spacing:.08em;color:rgba(51,39,34,.72)}.tg-guest strong{font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(12px,3.4cqw,15px);font-weight:600;letter-spacing:0;color:var(--tg-ink);overflow-wrap:anywhere}
.tg-cta{top:48.5%;left:50%;right:auto;transform:translateX(-50%);width:max-content;max-width:32cqw;padding:.6em 1.2em;border:1px solid rgba(181,138,54,.9);border-radius:999px;background:linear-gradient(#fffaf0,#f3e6cc);font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(10px,2.7cqw,12px);font-weight:600;letter-spacing:.02em;white-space:nowrap;color:var(--tg-rani);box-shadow:0 4px 10px -4px rgba(51,39,34,.4);animation:tg-pulse 2.4s ease-in-out infinite}
.tg-panel{position:absolute;top:0;z-index:3;display:block;height:100%;width:auto;max-width:none;will-change:transform;filter:drop-shadow(0 6px 12px rgba(60,0,10,.3));transition:transform 1.13s cubic-bezier(.65,0,.22,1) .24s}
.tg-panel-l{left:0}.tg-panel-r{right:0}
.tg-genda{position:absolute;left:50%;top:65.8%;z-index:5;width:17.6%;transform:translate(-50%,-50%)}
.tg-genda img{display:block;width:100%;height:auto;filter:drop-shadow(0 5px 8px rgba(40,0,10,.45))}
@keyframes tg-pulse{50%{box-shadow:0 4px 10px -4px rgba(51,39,34,.4),0 0 0 4px rgba(181,138,54,.3)}}
@keyframes tg-release{0%{transform:translate(-50%,-50%) scale(1);opacity:1}11%{transform:translate(-50%,-50%) scale(.94)}28%{transform:translate(-50%,calc(-50% - 18px)) scale(1);opacity:.6}100%{transform:translate(-50%,calc(-50% - 36px)) scale(1);opacity:0}}
.tg[data-phase=opening] .tg-copy,.tg[data-preview=open] .tg-copy{opacity:0;transition-duration:.4s;transition-delay:.1s}
.tg[data-phase=opening] .tg-cta,.tg[data-preview=open] .tg-cta{opacity:0;animation:none;transition:opacity .2s}
.tg[data-phase=opening] .tg-genda{animation:tg-release .95s cubic-bezier(.4,0,.3,1) both}
.tg[data-phase=opening] .tg-bg,.tg[data-preview=open] .tg-bg,.tg[data-phase=opening] .tg-card,.tg[data-preview=open] .tg-card{opacity:0}
.tg[data-phase=opening] .tg-panel-l,.tg[data-preview=open] .tg-panel-l{transform:translateX(-102%)}
.tg[data-phase=opening] .tg-panel-r,.tg[data-preview=open] .tg-panel-r{transform:translateX(102%)}
.tg[data-preview=open] .tg-panel,.tg[data-preview=open] .tg-bg,.tg[data-preview=open] .tg-card,.tg[data-preview=open] .tg-copy{transition:none}.tg[data-preview=open] .tg-genda{opacity:0;animation:none}
@media (prefers-reduced-motion:reduce){.tg *{animation:none!important}.tg-panel{transition:none!important}}
`;
