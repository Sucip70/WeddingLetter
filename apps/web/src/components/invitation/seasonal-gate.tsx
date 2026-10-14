'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import type { ArtworkLayer, ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';

export const SEASONAL_GATE_MS = { semi: 1500, panas: 1600, gugur: 1650, salju: 1400 } as const;
export type SeasonalGateDesign = keyof typeof SEASONAL_GATE_MS;

const LABELS: Record<SeasonalGateDesign, string> = {
  semi: 'Ketuk segel untuk membuka',
  panas: 'Sentuh mutiara untuk membuka',
  gugur: 'Lepaskan daun untuk membuka',
  salju: 'Sentuh untuk mencairkan embun',
};

const source = (layer: ArtworkLayer | undefined) => layer?.default ?? layer?.mobile ?? layer?.desktop;

export function hasSeasonalGate(artwork: ArtworkManifest | undefined, motif: string): artwork is ArtworkManifest {
  return motif in SEASONAL_GATE_MS && artwork?.designId === motif
    && !!source(artwork.assets.gateBackground)
    && !!source(artwork.assets.gateTransition)
    && !!source(artwork.assets.gateInteractive);
}

export function SeasonalGate({ designId, phase, artwork, names, kicker, guest, headingFamily, onOpen }: {
  designId: SeasonalGateDesign;
  phase: GatePhase;
  artwork: ArtworkManifest;
  names: string;
  kicker: string;
  guest: string | null;
  headingFamily: string;
  onOpen: () => void;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const background = source(artwork.assets.gateBackground)!;
  const transition = source(artwork.assets.gateTransition)!;
  const object = source(artwork.assets.gateInteractive)!;
  const splitTransition = designId === 'semi' || designId === 'panas';
  const instruction = LABELS[designId];

  return (
    <div className="sg-scene" data-design={designId} data-visible={visible ? 'true' : 'false'}>
      <style>{SEASONAL_GATE_CSS}</style>
      <img className="sg-bg" src={background.url} alt="" />
      {splitTransition ? (
        <>
          <img className="sg-transition sg-half sg-left" src={transition.url} alt="" />
          <img className="sg-transition sg-half sg-right" src={transition.url} alt="" />
        </>
      ) : <img className="sg-transition" src={transition.url} alt="" />}
      <div className="sg-copy">
        <small>{kicker}</small>
        <b style={{ fontFamily: headingFamily }}>{names}</b>
        <i />
        {guest && <span>Kepada Yth.<strong>{guest}</strong></span>}
      </div>
      <img className="sg-object" src={object.url} alt="" />
      {designId === 'panas' && <div className="sg-ripples" aria-hidden><i /><i /></div>}
      {designId === 'salju' && <div className="sg-warm-point" aria-hidden />}
      <button type="button" className="sg-target" onClick={onOpen} disabled={phase === 'opening'} aria-label={instruction}>
        <span className="sr-only">{instruction}</span>
      </button>
      <p className="sg-instruction">{instruction}</p>
    </div>
  );
}

const SEASONAL_GATE_CSS = `
@property --sg-clear{syntax:'<percentage>';inherits:false;initial-value:0%}
.sg-scene{position:absolute;inset:0;overflow:hidden;color:var(--tx)}
.wl-gate[data-seasonal=true]{cursor:default}
.sg-scene img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none}
.sg-bg{z-index:1}.sg-transition{z-index:2}.sg-object{z-index:5}
.sg-copy{position:absolute;left:14.6%;right:14.6%;top:22%;z-index:4;text-align:center;transition:opacity .18s ease}
.sg-copy small{display:block;font-size:11px;letter-spacing:.34em;text-transform:uppercase;opacity:.88}
.sg-copy b{display:block;margin-top:1.2em;font-size:clamp(2rem,9cqw,3.7rem);font-weight:500;line-height:1.06;text-wrap:balance;overflow-wrap:anywhere}
.sg-copy i{display:block;width:42%;height:1px;margin:1.4em auto;background:currentColor;opacity:.28}
.sg-copy span{display:block;font-size:12px;letter-spacing:.15em;opacity:.78}
.sg-copy strong{display:block;margin-top:.6em;font-family:var(--font-playfair),serif;font-size:1.15rem;letter-spacing:0;line-height:1.25;overflow-wrap:anywhere}
.sg-instruction{position:absolute;left:10%;right:10%;top:67%;z-index:7;text-align:center;font-size:12px;letter-spacing:.18em;transition:opacity .18s ease}
.sg-target{position:absolute;left:50%;top:54%;z-index:8;width:72px;height:72px;transform:translate(-50%,-50%);border:0;border-radius:50%;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sg-target:focus-visible{outline:3px solid color-mix(in srgb,var(--p) 72%,#fff);outline-offset:5px}
.sg-target:disabled{cursor:default}
.sg-scene[data-visible=true] .sg-object{animation:sg-wait 4.8s ease-in-out infinite}
.sg-scene[data-visible=false] .sg-object{animation-play-state:paused!important}
.sg-scene[data-design=panas][data-visible=true] .sg-object{animation-name:sg-pearl;animation-duration:5.2s}
.sg-scene[data-design=gugur][data-visible=true] .sg-object{animation-name:sg-leaf-wait;animation-duration:5s}
.sg-scene[data-design=salju][data-visible=true] .sg-object{animation-name:sg-frost-wait;animation-duration:5.5s}
@keyframes sg-wait{0%,88%,100%{transform:scale(1)}94%{transform:scale(1.025)}}
@keyframes sg-pearl{0%,88%,100%{opacity:.55}94%{opacity:.82}}
@keyframes sg-leaf-wait{0%,88%,100%{transform:rotate(-1.5deg)}94%{transform:rotate(1.5deg)}}
@keyframes sg-frost-wait{0%,88%,100%{opacity:.7}94%{opacity:1}}
.wl-gate[data-phase=opening] .sg-copy,.wl-gate[data-phase=opening] .sg-instruction{opacity:0}
.wl-gate[data-phase=opening] .sg-object{animation:none}
.wl-gate[data-phase=opening] .sg-bg{opacity:0}
.sg-half.sg-left{clip-path:inset(0 50% 0 0)}.sg-half.sg-right{clip-path:inset(0 0 0 50%)}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-object{animation:sg-seal 700ms cubic-bezier(.22,1,.36,1) both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-left{animation:sg-semi-left 1.15s cubic-bezier(.22,1,.36,1) .18s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-right{animation:sg-semi-right 1.15s cubic-bezier(.22,1,.36,1) .18s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-bg{transition:opacity .65s cubic-bezier(.22,1,.36,1) .85s}
@keyframes sg-seal{0%{transform:translateY(0) scale(1)}26%{transform:translateY(2px) scale(.97)}100%{transform:translateY(-3px) scale(1);opacity:0}}
@keyframes sg-semi-left{to{transform:translate(-13cqw,-6cqh);opacity:.4}}
@keyframes sg-semi-right{to{transform:translate(13cqw,-6cqh);opacity:.4}}
.sg-ripples{position:absolute;left:50%;top:54%;z-index:6;width:20px;height:20px;transform:translate(-50%,-50%);pointer-events:none}
.sg-ripples i{position:absolute;inset:0;border:1px solid color-mix(in srgb,var(--s) 72%,#fff);border-radius:50%;opacity:0}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-object{animation:sg-pearl-open .3s cubic-bezier(.16,1,.3,1) both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-ripples i{animation:sg-ripple .76s cubic-bezier(.16,1,.3,1) .16s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-ripples i+ i{animation-delay:.32s}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-left{animation:sg-tide-left .9s cubic-bezier(.16,1,.3,1) .42s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-right{animation:sg-tide-right .9s cubic-bezier(.16,1,.3,1) .42s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-bg{transition:opacity .62s cubic-bezier(.16,1,.3,1) .98s}
@keyframes sg-pearl-open{50%{transform:scale(.96);filter:brightness(1.18)}100%{transform:scale(1);filter:brightness(1.08)}}
@keyframes sg-ripple{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(13)}}
@keyframes sg-tide-left{to{transform:translateX(-18cqw);opacity:0}}
@keyframes sg-tide-right{to{transform:translateX(18cqw);opacity:0}}
.wl-gate[data-phase=opening] .sg-scene[data-design=gugur] .sg-object{animation:sg-leaf-exit 1.05s cubic-bezier(.2,.8,.2,1) both}
.wl-gate[data-phase=opening] .sg-scene[data-design=gugur] .sg-transition{animation:sg-paper-aside .92s cubic-bezier(.2,.8,.2,1) .3s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=gugur] .sg-bg{animation:sg-card-resolve .65s cubic-bezier(.2,.8,.2,1) 1s both}
@keyframes sg-leaf-exit{0%{transform:translateY(0) rotate(0)}17%{transform:translateY(-10px) rotate(0)}100%{transform:translate(30cqw,-58cqh) rotate(360deg);opacity:0}}
@keyframes sg-paper-aside{to{transform:translateX(26cqw) rotate(-5deg);opacity:0}}
@keyframes sg-card-resolve{to{transform:scale(1.01);opacity:0}}
.sg-warm-point{position:absolute;left:50%;top:54%;z-index:6;width:12px;height:12px;transform:translate(-50%,-50%);border-radius:50%;background:#ffe1a1;box-shadow:0 0 18px 8px rgba(255,218,143,.55);opacity:0}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-warm-point{animation:sg-warm 1.1s ease-out both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-transition{animation:sg-frost-clear .87s cubic-bezier(.22,1,.36,1) .18s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-bg{transition:opacity .55s cubic-bezier(.22,1,.36,1) .7s}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-object{transition:opacity .3s ease 1.1s;opacity:0}
@keyframes sg-warm{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}16%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}
@keyframes sg-frost-clear{from{--sg-clear:0%;mask-image:radial-gradient(circle at 50% 54%,transparent var(--sg-clear),#000 calc(var(--sg-clear) + 3%));-webkit-mask-image:radial-gradient(circle at 50% 54%,transparent var(--sg-clear),#000 calc(var(--sg-clear) + 3%))}to{--sg-clear:145%;mask-image:radial-gradient(circle at 50% 54%,transparent var(--sg-clear),#000 calc(var(--sg-clear) + 3%));-webkit-mask-image:radial-gradient(circle at 50% 54%,transparent var(--sg-clear),#000 calc(var(--sg-clear) + 3%))}}
@media(prefers-reduced-motion:reduce){
  .wl-gate[data-seasonal=true]{transition:opacity .22s ease!important}
  .wl-gate[data-seasonal=true][data-phase=opening]{opacity:0}
  .sg-scene *{animation:none!important;transition:none!important;transform:none}
  .sg-target{transform:translate(-50%,-50%)}
}
`;
