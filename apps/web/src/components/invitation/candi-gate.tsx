'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasCandiGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'pawiwahan-agung' && artwork?.designId === 'pawiwahan-agung' && !!(
    artwork.assets.gateBackground && artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/* Gerbang "Kembar Bentar Ceremony" (artwork-handoff/bali/pawiwahan-agung/gate-raster/motion-spec.md): candi bentar batu paras yang
   tetap diam, dua panel prada di tengahnya, dan selembar kain prada kecil (tab) di ambang. Latar & dua panel digambar pada kanvas
   2:3 yang sama, jadi semuanya ditempatkan di "panggung" setinggi layar (lebar = 2/3 tinggi) yang dipusatkan; di ponsel yang lebih
   ramping sisi luarnya terpotong, koridor tengah (teks, panel, tab) tetap utuh. Gerak 1580 ms: tab ditekan lalu terangkat dan
   memudar, kedua panel prada bergeser keluar horizontal (bukan engsel), teks dan latar memudar menyingkap sampul; tanpa partikel. */
export function CandiGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  const style = { '--cg-bg': `url(${rasterAsset(artwork, 'gateBackground')})` } as CSSProperties;
  return (
    <div className="cg" data-phase={phase} data-preview={previewState} data-long={names.length > 22 ? 'true' : 'false'} style={style}>
      <style>{GATE_CSS}</style>
      <div className="cg-stage cg-bgwrap" aria-hidden />
      <div className="cg-stage">
        <div className="cg-panel cg-panel-l"><img src={rasterAsset(artwork, 'gateTransition')} alt="" draggable={false} /><img src={rasterAsset(artwork, 'gateTransition')} alt="" draggable={false} className="cg-up" /></div>
        <div className="cg-panel cg-panel-r"><img src={rasterAsset(artwork, 'gateForeground')} alt="" draggable={false} /><img src={rasterAsset(artwork, 'gateForeground')} alt="" draggable={false} className="cg-up" /></div>
        <div className="cg-copy">
          <p className="cg-kicker">{kicker}</p>
          <h1 className="cg-names">{names}</h1>
          {guest && <p className="cg-guest"><span>Kepada Yth.</span><strong>{guest}</strong></p>}
          {cta && <p className="cg-cta">{cta}</p>}
        </div>
        <div className="cg-tab"><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
      </div>
    </div>
  );
}

const GATE_CSS = `
.cg{--cg-ivory:#f0e3c9;--cg-prada:#d6ad63;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;background:#792b20;color:var(--cg-ivory);pointer-events:none}
.cg *{box-sizing:border-box}
/* panggung = kanvas 2:3 selebar 130% layar (atau setinggi layar bila layar lebih lebar), menempel di bawah: pilar candi tetap terlihat di ponsel, sisa kecil di atasnya = dinding merah polos */
.cg-stage{position:absolute;left:50%;bottom:0;width:min(130cqw,66.667cqh);aspect-ratio:2 / 3;transform:translateX(-50%)}
.cg-bgwrap{z-index:1;background:var(--cg-bg) center / 100% 100% no-repeat;-webkit-mask-image:linear-gradient(#0000,#000 5%);mask-image:linear-gradient(#0000,#000 5%);transition:opacity .65s ease .43s}
.cg-stage:not(.cg-bgwrap){z-index:2}
.cg-panel{position:absolute;bottom:0;height:100%;will-change:transform;transition:transform .92s cubic-bezier(.24,.74,.2,1) .4s}
.cg-panel img{position:absolute;left:0;bottom:0;display:block;height:100%;width:auto;max-width:none}.cg-panel img.cg-up{bottom:100%;transform:scaleY(-1)}
.cg-panel-l{left:19.63%;width:30.76%;z-index:2}.cg-panel-r{left:40.04%;width:32.13%;z-index:1}
.cg-copy{position:absolute;left:0;right:0;bottom:0;z-index:3;height:100cqh;text-align:center;transition:opacity .65s ease .43s}
.cg-copy>*{position:absolute;left:25%;right:25%;margin:0}
.cg-kicker{top:11%;font-family:var(--font-source),sans-serif;font-size:clamp(8.5px,2.4cqw,10.5px);font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:var(--cg-prada)}
.cg-names{top:15%;left:24%;right:24%;font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(30px,9.4cqw,40px);font-style:italic;font-weight:600;line-height:1.1;text-wrap:balance;overflow-wrap:anywhere;color:var(--cg-ivory);text-shadow:0 2px 14px rgba(30,6,4,.7)}
.cg[data-long=true] .cg-names{font-size:clamp(24px,7.4cqw,32px)}
.cg-guest{top:34%;display:flex;flex-direction:column;gap:.3em;font-family:var(--font-source),sans-serif;font-size:clamp(9.5px,2.6cqw,11.5px);letter-spacing:.1em;color:rgba(240,227,201,.78)}.cg-guest strong{font-family:var(--font-cormorant),Georgia,serif;font-size:clamp(16px,4.6cqw,20px);font-weight:600;letter-spacing:0;color:var(--cg-ivory);overflow-wrap:anywhere}
.cg-cta{top:58%;left:50%;right:auto;transform:translateX(-50%);width:max-content;max-width:60cqw;padding:.8em 1.3em;border:1px solid rgba(214,173,99,.85);background:rgba(40,8,5,.5);font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.2cqw,9.5px);font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--cg-ivory);box-shadow:inset 0 0 0 3px rgba(40,8,5,.45),inset 0 0 0 4px rgba(214,173,99,.4);animation:cg-pulse 2.4s ease-in-out infinite}
.cg-tab{z-index:4;position:absolute;left:50%;top:86%;width:13.5%;transform:translateX(-50%);transform-origin:50% 20%}
.cg-tab img{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 8px rgba(30,6,4,.55))}
@keyframes cg-pulse{50%{border-color:rgba(214,173,99,1);box-shadow:inset 0 0 0 3px rgba(40,8,5,.45),inset 0 0 0 4px rgba(214,173,99,.75),0 0 14px rgba(214,173,99,.3)}}
@keyframes cg-press{0%{transform:translateX(-50%) scale(1) translateY(0)}9%{transform:translateX(-50%) scale(.965) translateY(3px)}21%{transform:translateX(-50%) scale(1) translateY(-7px)}70%{opacity:1}100%{transform:translateX(-50%) scale(.88) translateY(-25px);opacity:0}}
.cg[data-phase=opening] .cg-copy,.cg[data-preview=open] .cg-copy{opacity:0;transition-duration:.45s;transition-delay:.27s}
.cg[data-phase=opening] .cg-cta,.cg[data-preview=open] .cg-cta{opacity:0;animation:none;transition:opacity .25s}
.cg[data-phase=opening] .cg-tab{animation:cg-press .95s cubic-bezier(.4,0,.3,1) both}
.cg[data-phase=opening] .cg-bgwrap,.cg[data-preview=open] .cg-bgwrap{opacity:0;transition-delay:.85s}
.cg[data-phase=opening] .cg-panel-l,.cg[data-preview=open] .cg-panel-l{transform:translateX(-160%)}
.cg[data-phase=opening] .cg-panel-r,.cg[data-preview=open] .cg-panel-r{transform:translateX(160%)}
.cg[data-preview=open]{background:transparent}.cg[data-preview=open] .cg-panel,.cg[data-preview=open] .cg-bgwrap,.cg[data-preview=open] .cg-copy{transition:none}.cg[data-preview=open] .cg-tab{opacity:0;animation:none}
.cg[data-phase=opening]{animation:cg-shell .4s linear 1.15s both}@keyframes cg-shell{to{background-color:transparent}}
@media (prefers-reduced-motion:reduce){.cg *{animation:none!important}.cg-panel{transition:none!important}}
`;
