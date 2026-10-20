'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasPusakoGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'pusako-minang' && artwork?.designId === 'pusako-minang' && !!(
    artwork.assets.gateBackground && artwork.assets.gateTransition && artwork.assets.gateForeground && artwork.assets.gateInteractive
  );
}

/* Gerbang "Gonjong Pusako" (artwork-handoff/minangkabau/pusako-minang/gate-raster/motion-spec.md):
   kain songket marun (ubin cermin selebar layar) + dua tiang ukir + gonjong. Urutan lapisan: sampul (aplikasi), latar, teks,
   tiang, gonjong. Gerak 1550 ms: gonjong menekan lalu terangkat dan memudar, tiang bergeser keluar horizontal (bukan engsel 3D),
   latar memudar menyingkap sampul; tanpa partikel. */
export function PusakoGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  const style = { '--pg-bg': `url(${rasterAsset(artwork, 'gateBackground')})` } as CSSProperties;
  return (
    <div className="pg" data-phase={phase} data-preview={previewState} data-long={names.length > 22 ? 'true' : 'false'} style={style}>
      <style>{GATE_CSS}</style>
      <div className="pg-bg" aria-hidden />
      <div className="pg-glow" aria-hidden />
      <div className="pg-copy">
        <p className="pg-kicker">{kicker}</p>
        <h1 className="pg-names">{names}</h1>
        {guest && <p className="pg-guest"><span>Kepada Yth.</span><strong>{guest}</strong></p>}
        {cta && <p className="pg-cta">{cta}</p>}
      </div>
      <div className="pg-door pg-door-l"><img src={rasterAsset(artwork, 'gateTransition')} alt="" draggable={false} /></div>
      <div className="pg-door pg-door-r"><img src={rasterAsset(artwork, 'gateForeground')} alt="" draggable={false} /></div>
      <div className="pg-obj"><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
    </div>
  );
}

const GATE_CSS = `
.pg{--pg-ivory:#f1e3c6;--pg-gold:#d8ab5c;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;background:#4a0f0c;color:var(--pg-ivory);pointer-events:none}
.pg *{box-sizing:border-box}
.pg-bg{position:absolute;inset:0;z-index:1;background:var(--pg-bg) center top / 100% auto repeat-y,#4a0f0c;transition:opacity .94s ease .38s}
.pg-glow{position:absolute;left:50%;top:60cqh;z-index:2;width:120cqw;height:120cqw;margin:-60cqw 0 0 -60cqw;border-radius:50%;background:radial-gradient(circle,rgba(216,171,92,.3) 0,rgba(216,171,92,.09) 36%,transparent 64%);opacity:.75;animation:pg-breathe 4.6s ease-in-out infinite alternate;transition:opacity .3s}
.pg-copy{position:absolute;inset:0;z-index:3;text-align:center;transition:opacity .3s ease}
.pg-copy>*{position:absolute;left:19cqw;right:19cqw;margin:0}
.pg-kicker{top:8.6cqh;font-family:var(--font-source),sans-serif;font-size:clamp(8.5px,2.45cqw,10.5px);font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:var(--pg-gold)}
.pg-names{top:12.6cqh;left:14cqw;right:14cqw;font-family:var(--font-playfair),Georgia,serif;font-size:clamp(28px,9cqw,38px);font-style:italic;font-weight:400;line-height:1.16;text-wrap:balance;overflow-wrap:anywhere;color:var(--pg-ivory);text-shadow:0 2px 14px rgba(20,4,4,.65)}
.pg[data-long=true] .pg-names{font-size:clamp(23px,7.2cqw,31px)}
.pg-guest{top:30cqh;display:flex;flex-direction:column;gap:.3em;font-family:var(--font-source),sans-serif;font-size:clamp(9.5px,2.6cqw,11.5px);letter-spacing:.1em;color:rgba(241,227,198,.78)}.pg-guest strong{font-family:var(--font-playfair),Georgia,serif;font-size:clamp(14px,4.2cqw,18px);font-weight:400;letter-spacing:0;color:var(--pg-ivory);overflow-wrap:anywhere}
.pg-cta{top:83cqh;left:50%;right:auto;transform:translateX(-50%);white-space:nowrap;padding:.8em 1.3em;border:1px solid rgba(216,171,92,.8);background:rgba(20,4,4,.4);font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.2cqw,9.5px);font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--pg-ivory);box-shadow:inset 0 0 0 3px rgba(20,4,4,.4),inset 0 0 0 4px rgba(216,171,92,.42);animation:pg-pulse 2.4s ease-in-out infinite}
.pg-door{position:absolute;bottom:2.5cqh;z-index:4;height:70cqh;will-change:transform;transition:transform .96s cubic-bezier(.22,.72,.18,1) .28s}
.pg-door img{display:block;height:100%;width:auto;filter:drop-shadow(0 10px 16px rgba(10,2,2,.6))}
.pg-door-l{left:0}.pg-door-l img{transform:translateX(-20%)}.pg-door-r{right:0}.pg-door-r img{transform:translateX(20%)}
.pg-obj{position:absolute;left:50%;top:60cqh;z-index:5;width:min(46cqw,29cqh);margin-left:calc(min(46cqw,29cqh) / -2);transform-origin:50% 60%}
.pg-obj img{display:block;width:100%;height:auto;margin-top:calc(min(46cqw,29cqh) * -.33);filter:drop-shadow(0 12px 16px rgba(10,2,2,.55));animation:pg-float 4.2s ease-in-out infinite alternate}
@keyframes pg-breathe{from{opacity:.5;transform:scale(.95)}to{opacity:.85;transform:scale(1.05)}}@keyframes pg-float{from{transform:translateY(0)}to{transform:translateY(-5px)}}@keyframes pg-pulse{50%{border-color:rgba(216,171,92,1);box-shadow:inset 0 0 0 3px rgba(20,4,4,.4),inset 0 0 0 4px rgba(216,171,92,.75),0 0 16px rgba(216,171,92,.3)}}
@keyframes pg-press{0%{transform:scale(1) translateY(0)}10%{transform:scale(.96) translateY(3px)}22%{transform:scale(1) translateY(-12px)}70%{transform:scale(1) translateY(-12px);opacity:1}100%{transform:scale(.82) translateY(-30px);opacity:0}}
.pg[data-phase=opening] .pg-copy,.pg[data-preview=open] .pg-copy{opacity:0}
.pg[data-phase=opening] .pg-obj{animation:pg-press 1.55s cubic-bezier(.4,0,.3,1) both}.pg[data-phase=opening] .pg-obj img{animation:none}
.pg[data-phase=opening] .pg-glow{opacity:0}
.pg[data-phase=opening] .pg-bg,.pg[data-preview=open] .pg-bg{opacity:0}
.pg[data-phase=opening] .pg-door-l,.pg[data-preview=open] .pg-door-l{transform:translateX(-135%)}
.pg[data-phase=opening] .pg-door-r,.pg[data-preview=open] .pg-door-r{transform:translateX(135%)}
.pg[data-preview=open]{background:transparent}.pg[data-preview=open] .pg-door,.pg[data-preview=open] .pg-bg{transition:none}.pg[data-preview=open] .pg-obj,.pg[data-preview=open] .pg-glow{opacity:0;animation:none}
.pg[data-phase=opening]{animation:pg-shell .4s linear 1.15s both}@keyframes pg-shell{to{background-color:transparent}}
@media (prefers-reduced-motion:reduce){.pg *{animation:none!important}.pg-door{transition:none!important}}
`;
