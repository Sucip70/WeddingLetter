'use client';

/* eslint-disable @next/next/no-img-element -- artwork slots are already optimized, versioned raster assets */
import type { CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasUlosGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'horas-nauli' && artwork?.designId === 'horas-nauli' && !!(
    artwork.assets.gateBackground && artwork.assets.gateInteractive && artwork.assets.pageBackground && artwork.assets.bottomDecoration
  );
}

const recipientText = (guest: string | null) => guest?.trim() || 'Bapak/Ibu/Saudara/i';

/** Gerbang Surat Ulos. Informasi undangan tetap live text; artwork hanya kain dan ornamen raster. */
export function UlosGate({ artwork, phase, names, kicker, guest, cta, previewState, dateText }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
  dateText?: string;
}) {
  const recipient = recipientText(guest);
  const style = {
    '--ug-bg': `url(${rasterAsset(artwork, 'gateBackground')})`,
    '--ug-edge': `url(${rasterAsset(artwork, 'pageBackground')})`,
    '--ug-ribbon': `url(${rasterAsset(artwork, 'bottomDecoration')})`,
  } as CSSProperties;
  return (
    <div className="ug" data-phase={phase} data-preview={previewState} data-long={names.length > 22 ? 'true' : 'false'} data-guest-long={recipient.length > 30 ? 'true' : 'false'} style={style}>
      <style>{GATE_CSS}</style>
      <div className="ug-bg" aria-hidden />
      <div className="ug-rail ug-rail-l" aria-hidden />
      <div className="ug-rail ug-rail-r" aria-hidden />
      <img className="ug-band ug-band-top" src={rasterAsset(artwork, 'bottomDecoration')} alt="" draggable={false} />
      <img className="ug-band ug-band-bottom" src={rasterAsset(artwork, 'bottomDecoration')} alt="" draggable={false} />
      <div className="ug-letter" aria-hidden />
      <div className="ug-copy">
        <p className="ug-kicker">{kicker}</p>
        <p className="ug-intro">Dengan penuh sukacita kami mengundang</p>
        <h1 className="ug-names">{names}</h1>
        {dateText && <p className="ug-date">{dateText}</p>}
        <img className="ug-divider" src={rasterAsset(artwork, 'divider')} alt="" draggable={false} />
        <p className="ug-salutation">Kepada Yth.</p>
        <p className="ug-guest">{recipient}</p>
        <p className="ug-note">Mohon maaf apabila terdapat kesalahan penulisan nama atau gelar.</p>
      </div>
      <div className="ug-binding" aria-hidden>
        <span className="ug-binding-half ug-binding-l" />
        <span className="ug-binding-half ug-binding-r" />
      </div>
      <div className="ug-knot" aria-hidden><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
      <div className="ug-action">
        <p>{cta ?? 'Ketuk simpul untuk membuka'}</p>
        <em>Ulos pangihot ni holong<br />pengikat kasih dua keluarga</em>
        <span />
      </div>
      <img className="ug-mark" src={rasterAsset(artwork, 'topDecoration')} alt="" draggable={false} />
    </div>
  );
}

const GATE_CSS = `
.ug{--ug-bone:#f3e7d0;--ug-red:#92251f;--ug-copper:#a66d4f;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;background:#151313;color:#171313;pointer-events:none}
.ug *{box-sizing:border-box}.ug-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at 50% 38%,transparent 5%,rgba(8,6,6,.28) 55%,rgba(6,5,5,.8) 100%),var(--ug-bg) center/cover no-repeat,#151313;transition:opacity .55s ease 1.02s}
.ug-band{position:absolute;left:0;z-index:7;display:block;width:100%;height:6.6cqh;object-fit:fill;filter:drop-shadow(0 6px 8px rgba(0,0,0,.55));transition:transform .62s cubic-bezier(.4,0,.2,1) .72s,opacity .35s ease 1.12s}.ug-band-top{top:0}.ug-band-bottom{bottom:0;transform:rotate(180deg)}
.ug-rail{position:absolute;top:5.2cqh;bottom:5.2cqh;z-index:2;width:7cqw;max-width:34px;background-image:var(--ug-edge);background-size:100cqw auto;filter:drop-shadow(0 8px 7px rgba(0,0,0,.75));transition:transform .64s cubic-bezier(.4,0,.2,1) .68s,opacity .35s ease 1.08s}.ug-rail-l{left:1.6cqw;background-position:left top}.ug-rail-r{right:1.6cqw;background-position:right top}
.ug-letter{position:absolute;left:12.3cqw;right:12.3cqw;top:8.6cqh;bottom:7.5cqh;z-index:3;background:linear-gradient(100deg,#e5d4b7 0,#f7ecd7 8%,#f4e8d2 53%,#e9d8bb 100%);clip-path:polygon(4% 0,96% 0,100% 2%,100% 98%,96% 100%,4% 100%,0 98%,0 2%);box-shadow:0 20px 42px rgba(0,0,0,.65),inset 0 0 45px rgba(122,76,36,.13);transition:opacity .46s ease .86s,transform .58s ease .82s}.ug-letter::before{content:'';position:absolute;inset:1.05cqw;border:1px solid rgba(164,103,76,.6);box-shadow:inset 0 0 0 3px #f1e1c6,inset 0 0 0 4px rgba(173,117,89,.55)}.ug-letter::after{content:'';position:absolute;inset:2.8cqw;border:1px solid rgba(138,37,33,.2)}
.ug-copy{position:absolute;left:18.7cqw;right:18.7cqw;top:12.35cqh;z-index:4;text-align:center;transition:opacity .38s ease .75s,transform .45s ease .75s}.ug-copy p,.ug-copy h1{margin-left:0;margin-right:0}.ug-kicker{margin-top:0;margin-bottom:2.3cqh;color:#984a34;font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.25cqw,10.5px);font-weight:700;letter-spacing:.31em;text-transform:uppercase}.ug-intro{margin-top:0;margin-bottom:1.2cqh;color:#78645a;font-family:var(--font-libre),Georgia,serif;font-size:clamp(14px,3.85cqw,18px);font-style:italic;line-height:1.42}.ug-names{margin-top:0;margin-bottom:1.7cqh;color:var(--ug-red);font-family:var(--font-libre),Georgia,serif;font-size:clamp(38px,10.7cqw,51px);font-style:italic;font-weight:400;line-height:1.03;text-wrap:balance;overflow-wrap:anywhere}.ug[data-long=true] .ug-names{font-size:clamp(27px,7.6cqw,36px);line-height:1.08}.ug-date{margin-top:0;margin-bottom:1.7cqh;color:#4d3831;font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.1cqw,10px);font-weight:600;letter-spacing:.17em;text-transform:uppercase;overflow-wrap:anywhere}.ug-divider{display:block;width:36cqw;max-width:170px;height:2.1cqh;object-fit:contain;margin:0 auto 2cqh}.ug-salutation{margin-top:0;margin-bottom:.65cqh;color:#806b60;font-family:var(--font-source),sans-serif;font-size:clamp(9px,2.35cqw,11px);letter-spacing:.1em}.ug-guest{margin-top:0;margin-bottom:1.55cqh;color:#30231f;font-family:var(--font-libre),Georgia,serif;font-size:clamp(17px,4.7cqw,22px);font-weight:400;line-height:1.25;text-wrap:balance;overflow-wrap:anywhere}.ug[data-guest-long=true] .ug-guest{font-size:clamp(14px,3.8cqw,18px)}.ug-note{margin:0 1cqw;color:#7a675d;font-family:var(--font-source),sans-serif;font-size:clamp(7.5px,2cqw,9.5px);line-height:1.5}
.ug-binding{position:absolute;left:9.4cqw;right:9.4cqw;top:59.2cqh;z-index:8;height:10.5cqh;filter:drop-shadow(0 8px 9px rgba(0,0,0,.55))}.ug-binding-half{position:absolute;top:0;bottom:0;width:50%;background-image:var(--ug-ribbon);background-size:200% 100%;transition:transform .82s cubic-bezier(.2,.72,.18,1) .28s,opacity .25s ease 1s}.ug-binding-l{left:0;background-position:left center}.ug-binding-r{right:0;background-position:right center}.ug-knot{position:absolute;left:50%;top:64.4cqh;z-index:9;width:24cqw;max-width:112px;aspect-ratio:1;transform:translate(-50%,-50%)}.ug-knot img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 11px rgba(0,0,0,.7));animation:ug-breathe 3.3s ease-in-out infinite}.ug-action{position:absolute;left:18cqw;right:18cqw;top:73.4cqh;z-index:9;text-align:center;transition:opacity .25s ease}.ug-action p{margin:0;color:#70483a;font-family:var(--font-source),sans-serif;font-size:clamp(7.5px,2cqw,9.5px);font-weight:700;letter-spacing:.16em;text-transform:uppercase}.ug-action em{display:block;margin-top:1.1cqh;color:#8b7569;font-family:var(--font-libre),Georgia,serif;font-size:clamp(11px,3cqw,14px);font-weight:400;line-height:1.4}.ug-action span{display:block;width:18cqw;max-width:82px;height:1px;margin:1.45cqh auto 0;background:#a66d4f}.ug-mark{position:absolute;left:50%;bottom:9.5cqh;z-index:6;display:block;width:9.6cqw;max-width:46px;aspect-ratio:1;object-fit:contain;transform:translateX(-50%);opacity:.72;transition:opacity .3s ease .75s}
@keyframes ug-breathe{50%{transform:translateY(-3px) scale(1.025)}}@keyframes ug-loosen{0%{transform:translate(-50%,-50%) scale(1)}14%{transform:translate(-50%,calc(-50% + 3px)) scale(.96)}34%{transform:translate(-50%,calc(-50% - 7px)) scale(1.03) rotate(1.2deg)}68%{opacity:1}100%{transform:translate(-50%,calc(-50% - 28px)) scale(.84);opacity:0}}
.ug[data-phase=opening] .ug-knot{animation:ug-loosen 1.15s cubic-bezier(.4,0,.3,1) both}.ug[data-phase=opening] .ug-knot img{animation:none}.ug[data-phase=opening] .ug-binding-l,.ug[data-preview=open] .ug-binding-l{transform:translateX(-115%)}.ug[data-phase=opening] .ug-binding-r,.ug[data-preview=open] .ug-binding-r{transform:translateX(115%)}.ug[data-phase=opening] .ug-copy,.ug[data-preview=open] .ug-copy{opacity:0;transform:translateY(-5px)}.ug[data-phase=opening] .ug-letter,.ug[data-preview=open] .ug-letter{opacity:0;transform:scale(.985)}.ug[data-phase=opening] .ug-action,.ug[data-preview=open] .ug-action,.ug[data-phase=opening] .ug-mark,.ug[data-preview=open] .ug-mark{opacity:0}.ug[data-phase=opening] .ug-rail-l,.ug[data-preview=open] .ug-rail-l{transform:translateX(-130%)}.ug[data-phase=opening] .ug-rail-r,.ug[data-preview=open] .ug-rail-r{transform:translateX(130%)}.ug[data-phase=opening] .ug-band-top,.ug[data-preview=open] .ug-band-top{transform:translateY(-110%)}.ug[data-phase=opening] .ug-band-bottom,.ug[data-preview=open] .ug-band-bottom{transform:translateY(110%) rotate(180deg)}.ug[data-phase=opening] .ug-bg,.ug[data-preview=open] .ug-bg{opacity:0}.ug[data-phase=opening]{animation:ug-shell .35s linear 1.3s both}@keyframes ug-shell{to{background-color:transparent}}
.ug[data-preview=open]{background:transparent}.ug[data-preview=open] *{transition:none!important}.ug[data-preview=open] .ug-knot{opacity:0}.ug[data-preview=open] .ug-binding-half{opacity:0}
@media (prefers-reduced-motion:reduce){.ug *{animation:none!important;transition-duration:.18s!important;transition-delay:0s!important}.ug[data-phase=opening] .ug-binding-half,.ug[data-phase=opening] .ug-rail,.ug[data-phase=opening] .ug-band{transform:none;opacity:0}.ug[data-phase=opening] .ug-knot{transform:translate(-50%,-50%);opacity:0}}
`;

