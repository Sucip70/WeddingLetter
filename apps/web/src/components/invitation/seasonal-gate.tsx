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
  const splitTransition = designId === 'panas';
  const splitBackground = designId === 'panas';
  const instruction = LABELS[designId];

  return (
    <div className="sg-scene" data-design={designId} data-visible={visible ? 'true' : 'false'}>
      <style>{SEASONAL_GATE_CSS}</style>
      {splitBackground ? (
        <>
          <img className="sg-bg sg-tide-bg sg-half sg-left" src={background.url} alt="" />
          <img className="sg-bg sg-tide-bg sg-half sg-right" src={background.url} alt="" />
        </>
      ) : <img className="sg-bg" src={background.url} alt="" />}
      {splitTransition ? (
        <>
          <img className="sg-transition sg-half sg-left" src={transition.url} alt="" />
          <img className="sg-transition sg-half sg-right" src={transition.url} alt="" />
        </>
      ) : designId === 'salju' ? (
        <>
          <img className="sg-transition sg-frost-zone sg-frost-inner" src={transition.url} alt="" />
          <img className="sg-transition sg-frost-zone sg-frost-middle" src={transition.url} alt="" />
          <img className="sg-transition sg-frost-zone sg-frost-outer" src={transition.url} alt="" />
        </>
      ) : <img className="sg-transition" src={transition.url} alt="" />}
      <div className="sg-copy">
        <small>{kicker}</small>
        <b style={{ fontFamily: headingFamily }}>{names}</b>
        <i />
        {guest && <span>Kepada Yth.<strong>{guest}</strong></span>}
      </div>
      {designId === 'salju' ? (
        <>
          <img className="sg-object sg-frost-shard sg-frost-shard-top" src={object.url} alt="" />
          <img className="sg-object sg-frost-shard sg-frost-shard-left" src={object.url} alt="" />
          <img className="sg-object sg-frost-shard sg-frost-shard-right" src={object.url} alt="" />
          <svg className="sg-frost-cracks" viewBox="0 0 100 100" aria-hidden>
            <path d="M50 51 43 43 45 34 36 27 39 17" />
            <path d="M50 51 58 44 56 36 67 29 65 18" />
            <path d="M50 51 47 59 38 65 40 76 31 85" />
            <path d="M50 51 57 57 55 68 66 76 62 87" />
          </svg>
        </>
      ) : designId === 'semi' ? (
        <>
          <img className="sg-object sg-spring-ribbon sg-spring-ribbon-left" src={object.url} alt="" />
          <img className="sg-object sg-spring-ribbon sg-spring-ribbon-right" src={object.url} alt="" />
          <img className="sg-object sg-spring-seal" src={object.url} alt="" />
        </>
      ) : <img className="sg-object" src={object.url} alt="" />}
      {designId === 'panas' && <div className="sg-ripples" aria-hidden><i /><i /></div>}
      {designId === 'salju' && <><div className="sg-warm-point" aria-hidden /><div className="sg-thaw-rings" aria-hidden><i /><i /></div></>}
      <button type="button" className="sg-target" onClick={onOpen} disabled={phase === 'opening'} aria-label={instruction}>
        <span className="sr-only">{instruction}</span>
      </button>
      <p className="sg-instruction">{instruction}</p>
    </div>
  );
}

const SEASONAL_GATE_CSS = `
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
.sg-scene[data-design=gugur][data-visible=true] .sg-object{animation:none}
.sg-scene[data-design=salju][data-visible=true] .sg-object{animation-name:sg-frost-wait;animation-duration:5.5s}
@keyframes sg-wait{0%,88%,100%{transform:scale(1)}94%{transform:scale(1.025)}}
@keyframes sg-pearl{0%,88%,100%{opacity:.55}94%{opacity:.82}}
@keyframes sg-frost-wait{0%,88%,100%{opacity:.7}94%{opacity:1}}
.wl-gate[data-phase=opening] .sg-copy,.wl-gate[data-phase=opening] .sg-instruction{opacity:0}
.wl-gate[data-phase=opening] .sg-object{animation:none}
.wl-gate[data-phase=opening] .sg-bg{opacity:0}
.sg-half.sg-left{clip-path:inset(0 50% 0 0)}.sg-half.sg-right{clip-path:inset(0 0 0 50%)}
.sg-spring-ribbon-left{clip-path:inset(0 55.5% 0 0)}
.sg-spring-ribbon-right{clip-path:inset(0 0 0 55.5%)}
.sg-spring-seal{clip-path:circle(5.5% at 50% 54%);transform-origin:50% 54%}
.sg-scene[data-design=semi][data-visible=true] .sg-spring-ribbon{animation:none}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-spring-seal{animation:sg-seal 700ms cubic-bezier(.22,1,.36,1) both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-spring-ribbon-left{animation:sg-ribbon-left 520ms cubic-bezier(.22,1,.36,1) .18s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-spring-ribbon-right{animation:sg-ribbon-right 520ms cubic-bezier(.22,1,.36,1) .18s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-transition{animation:sg-vellum-lift 890ms cubic-bezier(.22,1,.36,1) .36s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-copy{animation:sg-copy-lift 890ms cubic-bezier(.22,1,.36,1) .36s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=semi] .sg-bg{transition:opacity .65s cubic-bezier(.22,1,.36,1) .85s}
@keyframes sg-seal{0%{transform:translateY(0) scale(1)}26%{transform:translateY(2px) scale(.97)}100%{transform:translateY(-3px) scale(1);opacity:0}}
@keyframes sg-ribbon-left{from{transform:translate3d(0,0,0);opacity:1}to{transform:translate3d(-13cqw,0,0);opacity:.15}}
@keyframes sg-ribbon-right{from{transform:translate3d(0,0,0);opacity:1}to{transform:translate3d(13cqw,0,0);opacity:.15}}
@keyframes sg-vellum-lift{from{transform:translate3d(0,0,0);opacity:1}to{transform:translate3d(0,-6cqh,0);opacity:.4}}
@keyframes sg-copy-lift{from{transform:translate3d(0,0,0);opacity:1}to{transform:translate3d(0,-6cqh,0);opacity:0}}
.sg-ripples{position:absolute;left:50%;top:54%;z-index:6;width:20px;height:20px;transform:translate(-50%,-50%);pointer-events:none}
.sg-ripples i{position:absolute;inset:0;border:1px solid color-mix(in srgb,var(--s) 72%,#fff);border-radius:50%;opacity:0}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-object{animation:sg-pearl-open 1.3s cubic-bezier(.16,1,.3,1) both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-ripples i{animation:sg-ripple .76s cubic-bezier(.16,1,.3,1) .16s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-ripples i+ i{animation-delay:.32s}
.sg-scene[data-design=panas] .sg-half.sg-left{clip-path:polygon(0 0,56% 0,48% 12%,57% 25%,47% 39%,58% 54%,48% 68%,56% 82%,50% 100%,0 100%)}
.sg-scene[data-design=panas] .sg-half.sg-right{clip-path:polygon(44% 0,100% 0,100% 100%,50% 100%,44% 82%,52% 68%,42% 54%,53% 39%,43% 25%,52% 12%)}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-half{will-change:transform,opacity}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-transition.sg-left{animation:sg-tide-line-left .9s cubic-bezier(.16,1,.3,1) .42s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-transition.sg-right{animation:sg-tide-line-right .9s cubic-bezier(.16,1,.3,1) .42s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-tide-bg.sg-left{animation:sg-tide-field-left 1.18s cubic-bezier(.16,1,.3,1) .42s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=panas] .sg-tide-bg.sg-right{animation:sg-tide-field-right 1.18s cubic-bezier(.16,1,.3,1) .42s both}
@keyframes sg-pearl-open{0%{transform:scale(1);opacity:1}12%{transform:scale(.96);filter:brightness(1.18);opacity:1}24%,68%{transform:scale(1);filter:brightness(1.08);opacity:1}100%{transform:scale(1.08);filter:brightness(1.08);opacity:0}}
@keyframes sg-ripple{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(13)}}
@keyframes sg-tide-line-left{to{transform:translate3d(-28cqw,-1.5cqh,0) scale(1.025);opacity:0}}
@keyframes sg-tide-line-right{to{transform:translate3d(28cqw,1.5cqh,0) scale(1.025);opacity:0}}
@keyframes sg-tide-field-left{0%{transform:translate3d(0,0,0) scale(1);opacity:1}48%{opacity:1}100%{transform:translate3d(-24cqw,-1cqh,0) scale(1.035);opacity:0}}
@keyframes sg-tide-field-right{0%{transform:translate3d(0,0,0) scale(1);opacity:1}48%{opacity:1}100%{transform:translate3d(24cqw,1cqh,0) scale(1.035);opacity:0}}
.wl-gate[data-phase=opening] .sg-scene[data-design=gugur] .sg-object{animation:sg-leaf-exit .28s ease-out both;will-change:opacity}
.wl-gate[data-phase=opening] .sg-scene[data-design=gugur] .sg-transition{animation:sg-paper-aside .92s cubic-bezier(.2,.8,.2,1) .3s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=gugur] .sg-bg{animation:sg-card-resolve .65s cubic-bezier(.2,.8,.2,1) 1s both}
@keyframes sg-leaf-exit{from{opacity:1}to{opacity:0}}
@keyframes sg-paper-aside{from{transform:translate3d(0,0,0) rotate(0);opacity:1}to{transform:translate3d(26cqw,0,0) rotate(-5deg);opacity:0}}
@keyframes sg-card-resolve{from{transform:scale(1);opacity:1}to{transform:scale(1.01);opacity:0}}
.sg-warm-point{position:absolute;left:50%;top:54%;z-index:6;width:12px;height:12px;transform:translate(-50%,-50%);border-radius:50%;background:#ffe1a1;box-shadow:0 0 18px 8px rgba(255,218,143,.55);opacity:0}
.sg-thaw-rings{position:absolute;left:50%;top:54%;z-index:6;width:12px;height:12px;transform:translate(-50%,-50%);pointer-events:none}
.sg-thaw-rings i{position:absolute;inset:0;border:1px solid rgba(255,232,184,.88);border-radius:50%;opacity:0;box-shadow:0 0 10px rgba(255,225,161,.35)}
.sg-frost-shard{transform-origin:50% 54%}
.sg-frost-shard-top{clip-path:polygon(0 0,100% 0,100% 49%,58% 49%,50% 54%,42% 49%,0 49%)}
.sg-frost-shard-left{clip-path:polygon(0 49%,42% 49%,50% 54%,48% 100%,0 100%)}
.sg-frost-shard-right{clip-path:polygon(58% 49%,100% 49%,100% 100%,48% 100%,50% 54%)}
.sg-frost-cracks{position:absolute;left:50%;top:54%;z-index:7;width:clamp(70px,18cqw,88px);height:auto;transform:translate(-50%,-50%);overflow:visible;pointer-events:none;opacity:0;filter:drop-shadow(0 0 2px rgba(255,255,255,.85))}
.sg-frost-cracks path{fill:none;stroke:rgba(35,69,105,.82);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:120;stroke-dashoffset:120}
.sg-frost-inner{-webkit-mask-image:radial-gradient(circle at 50% 54%,#000 0 24%,rgba(0,0,0,.96) 26%,transparent 31%);mask-image:radial-gradient(circle at 50% 54%,#000 0 24%,rgba(0,0,0,.96) 26%,transparent 31%)}
.sg-frost-middle{-webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 24%,#000 31% 54%,transparent 62%);mask-image:radial-gradient(circle at 50% 54%,transparent 24%,#000 31% 54%,transparent 62%)}
.sg-frost-outer{-webkit-mask-image:radial-gradient(circle at 50% 54%,transparent 54%,#000 62%);mask-image:radial-gradient(circle at 50% 54%,transparent 54%,#000 62%)}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-warm-point{animation:sg-warm 1.1s ease-out both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-thaw-rings i{animation:sg-thaw-ring .72s cubic-bezier(.22,1,.36,1) .08s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-thaw-rings i+i{animation-delay:.22s}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-inner{animation:sg-frost-zone .38s cubic-bezier(.22,1,.36,1) .14s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-middle{animation:sg-frost-zone .55s cubic-bezier(.22,1,.36,1) .32s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-outer{animation:sg-frost-zone .62s cubic-bezier(.22,1,.36,1) .62s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-bg{transition:opacity .55s cubic-bezier(.22,1,.36,1) .7s}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-cracks{animation:sg-cracks-fade .86s ease-out .04s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-cracks path{animation:sg-crack-draw .34s cubic-bezier(.22,1,.36,1) .04s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-shard-top{animation:sg-shard-top .76s cubic-bezier(.22,.75,.3,1) .24s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-shard-left{animation:sg-shard-left .76s cubic-bezier(.22,.75,.3,1) .24s both}
.wl-gate[data-phase=opening] .sg-scene[data-design=salju] .sg-frost-shard-right{animation:sg-shard-right .76s cubic-bezier(.22,.75,.3,1) .24s both}
@keyframes sg-warm{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}16%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}
@keyframes sg-thaw-ring{0%{opacity:.78;transform:scale(.7)}100%{opacity:0;transform:scale(10)}}
@keyframes sg-frost-zone{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.018)}}
@keyframes sg-crack-draw{to{stroke-dashoffset:0}}
@keyframes sg-cracks-fade{0%,56%{opacity:1}100%{opacity:0}}
@keyframes sg-shard-top{0%,16%{transform:translate3d(0,0,0) rotate(0);opacity:1}100%{transform:translate3d(0,-4cqh,0) rotate(-5deg);opacity:0}}
@keyframes sg-shard-left{0%,16%{transform:translate3d(0,0,0) rotate(0);opacity:1}100%{transform:translate3d(-4cqw,3cqh,0) rotate(-8deg);opacity:0}}
@keyframes sg-shard-right{0%,16%{transform:translate3d(0,0,0) rotate(0);opacity:1}100%{transform:translate3d(4cqw,3cqh,0) rotate(8deg);opacity:0}}
@media(prefers-reduced-motion:reduce){
  .wl-gate[data-seasonal=true]{transition:opacity .22s ease!important}
  .wl-gate[data-seasonal=true][data-phase=opening]{opacity:0}
  .sg-scene *{animation:none!important;transition:none!important;transform:none}
  .sg-target{transform:translate(-50%,-50%)}
}
`;
