'use client';

/* eslint-disable @next/next/no-img-element */
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasJaliGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'noor-e-nikah' && artwork?.designId === 'noor-e-nikah' && !!(
    artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/* Gerbang "Jali of Noor" (artwork-handoff/pakistan/noor-e-nikah/gate-raster/motion-spec.md): dua panel (zamrud, jali, lengkung ivory) bertemu di
   tengah, roset jali di sambungan. Panel digambar pada kanvas 2:3 yang sama, jadi dipasang di "panggung" selebar layar (tinggi = 1,5 x lebar)
   yang dipusatkan secara vertikal; sisa atas-bawah di layar tinggi diisi zamrud polos. Teks hidup berada di lengkung ivory, di atas panel.
   Gerak 1550 ms: roset menekan lalu naik dan memudar, panel bergeser keluar horizontal, teks memudar dan sampul tersingkap; tanpa partikel. */
export function JaliGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  return (
    <div className="jg" data-phase={phase} data-preview={previewState} data-long={names.length > 20 ? 'true' : 'false'}>
      <style>{GATE_CSS}</style>
      <div className="jg-bg" aria-hidden />
      <div className="jg-stage">
        <img src={rasterAsset(artwork, 'gateTransition')} alt="" draggable={false} className="jg-panel jg-panel-l" />
        <img src={rasterAsset(artwork, 'gateForeground')} alt="" draggable={false} className="jg-panel jg-panel-r" />
        <div className="jg-copy">
          <p className="jg-kicker">{kicker}</p>
          <h1 className="jg-names">{names}</h1>
          {guest && <p className="jg-guest"><span>Kepada Yth.</span><strong>{guest}</strong></p>}
          {cta && <p className="jg-cta">{cta}</p>}
        </div>
        <div className="jg-rosette"><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
      </div>
    </div>
  );
}

const GATE_CSS = `
.jg{--jg-ink:#f4e7cb;--jg-emerald:#063f32;--jg-gold:#e2bd6a;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;pointer-events:none}
.jg *{box-sizing:border-box}
.jg-bg{position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse at 50% 50%,#0a4a38,#01311c 75%);transition:opacity .75s ease .5s}
.jg-stage{position:absolute;left:0;right:0;top:50%;z-index:2;height:150cqw;transform:translateY(-50%)}
.jg-card{position:absolute;inset:0;width:100%;height:100%;display:block;transition:opacity .7s ease .55s}
.jg-panel{position:absolute;top:0;display:block;height:100%;width:auto;max-width:none;will-change:transform;transition:transform 1.16s cubic-bezier(.65,0,.22,1) .24s}
.jg-panel-l{left:0}.jg-panel-r{right:0}
.jg-copy{position:absolute;inset:0;z-index:3;text-align:center;transition:opacity .6s ease .3s}
.jg-copy>*{position:absolute;left:25%;right:25%;margin:0}
.jg-kicker{top:22.6%;font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.2cqw,10px);font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--jg-gold)}
.jg-names{top:27.4%;left:23%;right:23%;font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(26px,8cqw,34px);font-weight:600;line-height:1.1;text-wrap:balance;overflow-wrap:anywhere;color:var(--jg-ink);text-shadow:0 2px 10px rgba(0,20,10,.7)}
.jg[data-long=true] .jg-names{font-size:clamp(21px,6.4cqw,28px)}
.jg-guest{top:47.5%;display:flex;flex-direction:column;gap:.25em;font-family:var(--font-source),sans-serif;font-size:clamp(9px,2.5cqw,11px);letter-spacing:.08em;color:rgba(244,231,203,.8)}.jg-guest strong{font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(15px,4.4cqw,19px);font-weight:600;letter-spacing:0;color:var(--jg-ink);overflow-wrap:anywhere}
.jg-cta{top:57.5%;left:50%;right:auto;transform:translateX(-50%);width:max-content;max-width:40cqw;padding:.75em 1.5em;border:1px solid rgba(138,95,28,.8);border-radius:999px;background:linear-gradient(#fdf4de,#efdfba);font-family:var(--font-source),sans-serif;font-size:clamp(8.5px,2.3cqw,10px);font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--jg-emerald);box-shadow:0 4px 10px -4px rgba(30,26,22,.4);animation:jg-pulse 2.4s ease-in-out infinite}
.jg-rosette{position:absolute;left:50%;top:69.7%;z-index:4;width:20%;transform:translate(-50%,-50%)}
.jg-rosette img{display:block;width:100%;height:auto;filter:drop-shadow(0 5px 8px rgba(0,0,0,.45))}
@keyframes jg-pulse{50%{box-shadow:0 4px 10px -4px rgba(30,26,22,.4),0 0 0 4px rgba(185,138,56,.28)}}
@keyframes jg-release{0%{transform:translate(-50%,-50%) scale(1);opacity:1}10%{transform:translate(-50%,-50%) scale(.94)}26%{transform:translate(-50%,calc(-50% - 18px)) scale(1);opacity:.55}60%{opacity:.25}100%{transform:translate(-50%,calc(-50% - 34px)) scale(1);opacity:0}}
.jg[data-phase=opening] .jg-copy,.jg[data-preview=open] .jg-copy{opacity:0;transition-duration:.4s;transition-delay:.1s}
.jg[data-phase=opening] .jg-cta,.jg[data-preview=open] .jg-cta{opacity:0;animation:none;transition:opacity .2s}
.jg[data-phase=opening] .jg-rosette{animation:jg-release 1s cubic-bezier(.4,0,.3,1) both}
.jg[data-phase=opening] .jg-bg,.jg[data-preview=open] .jg-bg,.jg[data-phase=opening] .jg-card,.jg[data-preview=open] .jg-card{opacity:0}
.jg[data-phase=opening] .jg-panel-l,.jg[data-preview=open] .jg-panel-l{transform:translateX(-102%)}
.jg[data-phase=opening] .jg-panel-r,.jg[data-preview=open] .jg-panel-r{transform:translateX(102%)}
.jg[data-preview=open] .jg-card,.jg[data-preview=open] .jg-panel,.jg[data-preview=open] .jg-bg,.jg[data-preview=open] .jg-copy{transition:none}.jg[data-preview=open] .jg-rosette{opacity:0;animation:none}
@media (prefers-reduced-motion:reduce){.jg *{animation:none!important}.jg-panel{transition:none!important}}
`;
