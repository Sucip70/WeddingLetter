'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest, ArtworkSlot } from '@/lib/types';
import type { GatePhase } from './gates';
import { STRINGS } from './i18n';

function asset(artwork: ArtworkManifest, slot: ArtworkSlot) {
  const layer = artwork.assets[slot];
  return layer?.mobile?.url ?? layer?.default?.url ?? layer?.desktop?.url;
}

export function hasSekarKeratonGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'jawa-sekar-keraton' && artwork?.designId === 'jawa-sekar-keraton' && !!(artwork.assets.gateBackground && artwork.assets.gateInteractive);
}

/* Bingkai ukir (gate-background, 1024x1536) dipasang selebar layar dan diregangkan ke tinggi layar TANPA meregangkan ukirannya:
   lengkung atas (0-330px) dan ambang bawah (1346-1536px) tetap berproporsi; bagian tiang di tengah (330-1346px) dibagi dua dan
   separuh bawahnya dicerminkan, jadi sambungannya mulus dan ukiran hanya terkompresi ±17% (bukan terulur ±67%). */
function Frame() {
  return (
    <div className="skg-frame" aria-hidden>
      <i className="skg-top" />
      <div className="skg-mid"><i /><i /></div>
      <i className="skg-bot" />
    </div>
  );
}

export function SekarKeratonGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  const style = { '--skg-bg': `url(${asset(artwork, 'gateBackground')})` } as CSSProperties;
  return (
    <div className="skg" data-phase={phase} data-preview={previewState} data-long={names.length > 22 ? 'true' : 'false'} style={style}>
      <style>{GATE_CSS}</style>
      <div className="skg-door skg-door-l"><Frame /></div>
      <div className="skg-door skg-door-r"><Frame /></div>
      <div className="skg-glow" aria-hidden />
      <div className="skg-kayon"><img src={asset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
      <div className="skg-copy">
        <p className="skg-kicker">{kicker}</p>
        <h1 className="skg-names">{names}</h1>
        <p className="skg-guest"><span>{STRINGS.id.dear}</span><strong>{guest || STRINGS.id.guestFallback}</strong></p>
        {cta && <p className="skg-cta">{cta}</p>}
      </div>
    </div>
  );
}

const GATE_CSS = `
.skg{--skg-ivory:#f3e4c3;--skg-gold:#d9b56a;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;background:#5c1c21;color:var(--skg-ivory);pointer-events:none}
.skg *{box-sizing:border-box}
.skg-door{position:absolute;top:0;bottom:0;z-index:2;width:50%;overflow:hidden;will-change:transform;transition:transform 1.15s cubic-bezier(.62,0,.22,1) .55s}
.skg-door-l{left:0}.skg-door-r{right:0}
.skg-frame{--hm:max(10cqw,calc((100cqh - 50.78cqw) / 2));position:absolute;top:0;bottom:0;width:100cqw}.skg-door-l .skg-frame{left:0}.skg-door-r .skg-frame{right:0}
.skg-frame i{display:block;background-image:var(--skg-bg);background-repeat:no-repeat}
.skg-top{position:absolute;left:0;right:0;top:0;height:32.23cqw;background-size:100cqw auto;background-position:center top}
.skg-bot{position:absolute;left:0;right:0;bottom:0;height:18.55cqw;background-size:100cqw auto;background-position:center bottom}
.skg-mid{position:absolute;left:0;right:0;top:32.23cqw;bottom:18.55cqw}
.skg-mid i{position:absolute;left:0;right:0;height:calc(50% + .5px);background-size:100cqw calc(var(--hm) * 1.5118);background-position:center calc(var(--hm) * -.3248)}
.skg-mid i:first-child{top:0}.skg-mid i:last-child{bottom:0;transform:scaleY(-1)}
.skg-glow{position:absolute;left:50%;top:44cqh;z-index:3;width:150cqw;height:150cqw;margin:-75cqw 0 0 -75cqw;border-radius:50%;background:radial-gradient(circle,rgba(233,190,104,.34) 0,rgba(233,190,104,.1) 34%,transparent 62%);opacity:.7;animation:skg-breathe 4.6s ease-in-out infinite alternate;transition:opacity .3s}
.skg-kayon{position:absolute;left:50%;top:18.5cqh;z-index:4;width:min(56cqw,40cqh);margin-left:calc(min(56cqw,40cqh) / -2);transform-origin:50% 92%}
.skg-kayon img{display:block;width:100%;height:auto;filter:drop-shadow(0 14px 18px rgba(20,4,6,.55));animation:skg-float 4.2s ease-in-out infinite alternate}
.skg-copy{position:absolute;inset:0;z-index:5;text-align:center;transition:opacity .35s ease}
.skg-copy>*{position:absolute;left:14cqw;right:14cqw;margin:0}
.skg-kicker{top:14.2cqh;font-family:var(--font-source),sans-serif;font-size:clamp(8.5px,2.45cqw,10.5px);font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:var(--skg-gold)}
.skg-names{top:62.5cqh;font-family:var(--font-libre),Georgia,serif;font-size:clamp(28px,8.6cqw,38px);font-style:italic;font-weight:400;line-height:1.14;text-wrap:balance;overflow-wrap:anywhere;color:var(--skg-ivory);text-shadow:0 2px 14px rgba(20,4,6,.6)}
.skg[data-long=true] .skg-names{font-size:clamp(23px,7cqw,31px)}
.skg-guest{top:75.5cqh;display:flex;flex-direction:column;gap:.3em;font-family:var(--font-source),sans-serif;font-size:clamp(9.5px,2.6cqw,11.5px);letter-spacing:.1em;color:rgba(243,228,195,.78)}.skg-guest strong{font-family:var(--font-libre),Georgia,serif;font-size:clamp(14px,4.2cqw,18px);font-weight:400;letter-spacing:0;color:var(--skg-ivory);overflow-wrap:anywhere}
.skg-cta{top:84.5cqh;left:50%;right:auto;transform:translateX(-50%);white-space:nowrap;padding:.85em 2em;border:1px solid rgba(217,181,106,.75);background:rgba(20,4,6,.34);font-family:var(--font-source),sans-serif;font-size:clamp(9.5px,2.6cqw,11px);font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--skg-ivory);box-shadow:inset 0 0 0 3px rgba(20,4,6,.34),inset 0 0 0 4px rgba(217,181,106,.4);animation:skg-pulse 2.4s ease-in-out infinite}
@keyframes skg-breathe{from{opacity:.5;transform:scale(.95)}to{opacity:.85;transform:scale(1.05)}}@keyframes skg-float{from{transform:translateY(0)}to{transform:translateY(-6px)}}@keyframes skg-pulse{50%{border-color:rgba(217,181,106,1);box-shadow:inset 0 0 0 3px rgba(20,4,6,.34),inset 0 0 0 4px rgba(217,181,106,.75),0 0 18px rgba(217,181,106,.35)}}
@keyframes skg-wobble{0%{transform:rotate(0)}22%{transform:rotate(-5deg)}50%{transform:rotate(4deg)}76%{transform:rotate(-2deg)}100%{transform:rotate(0)}}@keyframes skg-lift{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-15cqh) scale(1.12);opacity:0}}@keyframes skg-flash{0%{opacity:.7;transform:scale(1)}35%{opacity:1;transform:scale(1.35)}100%{opacity:0;transform:scale(2.2)}}
.skg[data-phase=opening] .skg-copy,.skg[data-preview=open] .skg-copy{opacity:0}
.skg[data-phase=opening] .skg-kayon{animation:skg-wobble .7s ease-in-out both}
.skg[data-phase=opening] .skg-kayon img{animation:skg-lift 1.1s cubic-bezier(.5,0,.8,.5) .6s both}
.skg[data-phase=opening] .skg-glow{animation:skg-flash 1.3s ease-out .45s both}
.skg[data-phase=opening] .skg-door-l,.skg[data-preview=open] .skg-door-l{transform:translateX(-101%)}
.skg[data-phase=opening] .skg-door-r,.skg[data-preview=open] .skg-door-r{transform:translateX(101%)}
.skg[data-preview=open]{background:transparent}.skg[data-preview=open] .skg-door,.skg[data-preview=open] .skg-glow,.skg[data-preview=open] .skg-kayon{transition:none}.skg[data-preview=open] .skg-glow{opacity:0;animation:none}.skg[data-preview=open] .skg-kayon{opacity:0}
.skg[data-phase=opening]{animation:skg-shell .5s linear 1.25s both}@keyframes skg-shell{to{background-color:transparent}}
@media (prefers-reduced-motion:reduce){.skg *{animation:none!important}.skg-door{transition:none!important}}
`;
