'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasUlosGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'horas-nauli' && artwork?.designId === 'horas-nauli' && !!(
    artwork.assets.gateBackground && artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/* Gerbang "Pangihot ni Holong" (artwork-handoff/batak-toba/horas-nauli/gate-raster/motion-spec.md): dua ulos Ragi Hotang menjuntai dari
   sudut atas, diikat sabuk bersimpul tenun di tengah. Panel & simpul digambar pada kanvas 2:3 yang sama, jadi semuanya ditempatkan
   di "panggung" setinggi layar (tinggi = 100%, lebar = 2/3 tinggi) yang dipusatkan; di layar ponsel yang lebih ramping sisi luarnya
   terpotong, bagian tengah (teks, sabuk, simpul) tetap utuh. Gerak 1650 ms: simpul ditekan lalu terlepas dan memudar, panel tenun
   bergeser keluar horizontal (bukan engsel 3D), teks dan latar memudar menyingkap sampul; tanpa partikel. */
export function UlosGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  const style = { '--ug-bg': `url(${rasterAsset(artwork, 'gateBackground')})` } as CSSProperties;
  return (
    <div className="ug" data-phase={phase} data-preview={previewState} data-long={names.length > 22 ? 'true' : 'false'} style={style}>
      <style>{GATE_CSS}</style>
      <div className="ug-bg" aria-hidden />
      <div className="ug-stage">
        <div className="ug-copy">
          <p className="ug-kicker">{kicker}</p>
          <h1 className="ug-names">{names}</h1>
          {guest && <p className="ug-guest"><span>Kepada Yth.</span><strong>{guest}</strong></p>}
        </div>
        <img src={rasterAsset(artwork, 'gateTransition')} alt="" draggable={false} className="ug-panel ug-panel-l" />
        <img src={rasterAsset(artwork, 'gateForeground')} alt="" draggable={false} className="ug-panel ug-panel-r" />
        <div className="ug-knot"><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
        {cta && <p className="ug-cta">{cta}</p>}
      </div>
    </div>
  );
}

const GATE_CSS = `
.ug{--ug-bone:#e9ddc8;--ug-copper:#c48b62;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;background:#151313;color:var(--ug-bone);pointer-events:none}
.ug *{box-sizing:border-box}
.ug-bg{position:absolute;inset:0;z-index:1;background:var(--ug-bg) center top / 100% auto no-repeat,#151313;transition:opacity .75s ease .43s}
.ug-stage{position:absolute;left:50%;top:0;z-index:2;height:100cqh;aspect-ratio:2 / 3;transform:translateX(-50%)}
.ug-copy{position:absolute;inset:0;z-index:1;text-align:center;transition:opacity .75s ease .43s}
.ug-copy>*{position:absolute;left:30%;right:30%;margin:0}
.ug-kicker{top:13.2%;font-family:var(--font-source),sans-serif;font-size:clamp(8.5px,2.45cqw,10.5px);font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--ug-copper)}
.ug-names{top:17.4%;left:27%;right:27%;font-family:var(--font-libre),Georgia,serif;font-size:clamp(26px,8.2cqw,35px);font-style:italic;font-weight:400;line-height:1.16;text-wrap:balance;overflow-wrap:anywhere;color:var(--ug-bone);text-shadow:0 2px 14px rgba(0,0,0,.7)}
.ug[data-long=true] .ug-names{font-size:clamp(21px,6.6cqw,29px)}
.ug-guest{top:37%;display:flex;flex-direction:column;gap:.3em;font-family:var(--font-source),sans-serif;font-size:clamp(9.5px,2.6cqw,11.5px);letter-spacing:.1em;color:rgba(233,221,200,.75)}.ug-guest strong{font-family:var(--font-libre),Georgia,serif;font-size:clamp(14px,4.2cqw,18px);font-weight:400;letter-spacing:0;color:var(--ug-bone);overflow-wrap:anywhere}
.ug-panel{position:absolute;top:0;z-index:2;display:block;width:65.92%;height:98.44%;max-width:none;will-change:transform;filter:drop-shadow(0 10px 18px rgba(0,0,0,.55));transition:transform .99s cubic-bezier(.22,.72,.18,1) .43s}
.ug-panel-l{left:0}.ug-panel-r{left:34.08%}
.ug-knot{position:absolute;left:50%;top:71.6%;z-index:3;width:15.5%;transform:translate(-50%,-50%)}
.ug-knot img{display:block;width:100%;height:auto;filter:drop-shadow(0 8px 12px rgba(0,0,0,.6));animation:ug-sway 4.4s ease-in-out infinite alternate}
.ug-cta{position:absolute;left:50%;top:89.5%;z-index:4;width:max-content;max-width:62cqw;transform:translateX(-50%);padding:.8em 1.3em;border:1px solid rgba(196,139,98,.8);background:rgba(10,8,8,.55);text-align:center;font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.2cqw,9.5px);font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ug-bone);box-shadow:inset 0 0 0 3px rgba(10,8,8,.5),inset 0 0 0 4px rgba(196,139,98,.4);animation:ug-pulse 2.4s ease-in-out infinite}
@keyframes ug-sway{from{transform:translateY(0) rotate(-.6deg)}to{transform:translateY(-4px) rotate(.6deg)}}@keyframes ug-pulse{50%{border-color:rgba(196,139,98,1);box-shadow:inset 0 0 0 3px rgba(10,8,8,.5),inset 0 0 0 4px rgba(196,139,98,.7),0 0 14px rgba(196,139,98,.3)}}
@keyframes ug-loosen{0%{transform:translate(-50%,-50%) scale(1)}9%{transform:translate(-50%,calc(-50% + 3px)) scale(.96)}22%{transform:translate(-50%,calc(-50% - 8px)) scale(1) rotate(1.5deg)}32%{transform:translate(-50%,calc(-50% - 8px)) scale(1) rotate(0)}78%{opacity:1}100%{transform:translate(-50%,calc(-50% - 30px)) scale(.84);opacity:0}}
.ug[data-phase=opening] .ug-copy,.ug[data-preview=open] .ug-copy{opacity:0;transition-delay:0s;transition-duration:.4s}
.ug[data-phase=opening] .ug-cta,.ug[data-preview=open] .ug-cta{opacity:0;animation:none;transition:opacity .25s}
.ug[data-phase=opening] .ug-knot{animation:ug-loosen 1.3s cubic-bezier(.4,0,.3,1) both}.ug[data-phase=opening] .ug-knot img{animation:none}
.ug[data-phase=opening] .ug-bg,.ug[data-preview=open] .ug-bg{opacity:0}
.ug[data-phase=opening] .ug-panel-l,.ug[data-preview=open] .ug-panel-l{transform:translateX(-102%)}
.ug[data-phase=opening] .ug-panel-r,.ug[data-preview=open] .ug-panel-r{transform:translateX(102%)}
.ug[data-preview=open]{background:transparent}.ug[data-preview=open] .ug-panel,.ug[data-preview=open] .ug-bg,.ug[data-preview=open] .ug-copy{transition:none}.ug[data-preview=open] .ug-knot{opacity:0;animation:none}
.ug[data-phase=opening]{animation:ug-shell .45s linear 1.2s both}@keyframes ug-shell{to{background-color:transparent}}
@media (prefers-reduced-motion:reduce){.ug *{animation:none!important}.ug-panel{transition:none!important}}
`;
