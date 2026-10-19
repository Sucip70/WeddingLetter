'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { GatePhase } from './gates';
import { rasterAsset } from './raster-theme';

export function hasLenteraGate(artwork: ArtworkManifest | undefined, motif: string) {
  return motif === 'hong-xi' && artwork?.designId === 'hong-xi' && !!(artwork.assets.gateBackground && artwork.assets.cornerTopLeft && artwork.assets.gateInteractive);
}

/* Gerbang "Lentera Hong Xi" (dirancang dari aset source-renders-v2; belum ada aset gerbang khusus dari The Artist): selembar kertas merah
   berawan emas yang terbelah dua di tengah, sepasang lentera menggantung di tiap sisi, dan medali 囍 emas di tengah. Kertas & lentera
   digambar dua kali (kiri/kanan) dengan clip-path separuh, sehingga tiap daun membawa lenteranya sendiri saat bergeser keluar.
   Gerak ±1600 ms: medali ditekan lalu naik dan memudar, kedua daun bergeser ke samping (transform saja, bukan engsel), teks memudar
   dan sampul tersingkap; tanpa partikel. */
function Leaf({ side, lanterns }: { side: 'l' | 'r'; lanterns?: string }) {
  return (
    <div className={`lg-leaf lg-leaf-${side}`} aria-hidden>
      <div className="lg-paper" />
      <img src={lanterns} alt="" draggable={false} className="lg-lanterns" />
    </div>
  );
}

export function LenteraGate({ artwork, phase, names, kicker, guest, cta, previewState }: {
  artwork: ArtworkManifest;
  phase: GatePhase;
  names: string;
  kicker: string;
  guest: string | null;
  cta?: string;
  previewState?: 'closed' | 'open';
}) {
  const style = { '--lg-paper': `url(${rasterAsset(artwork, 'gateBackground')})` } as CSSProperties;
  const lanterns = rasterAsset(artwork, 'cornerTopLeft');
  return (
    <div className="lg" data-phase={phase} data-preview={previewState} data-long={names.length > 22 ? 'true' : 'false'} style={style}>
      <style>{GATE_CSS}</style>
      <Leaf side="l" lanterns={lanterns} />
      <Leaf side="r" lanterns={lanterns} />
      <div className="lg-seam" aria-hidden />
      <div className="lg-copy">
        <p className="lg-kicker">{kicker}</p>
        <h1 className="lg-names">{names}</h1>
        {guest && <p className="lg-guest"><span>Kepada Yth.</span><strong>{guest}</strong></p>}
        {cta && <p className="lg-cta">{cta}</p>}
      </div>
      <div className="lg-xi"><img src={rasterAsset(artwork, 'gateInteractive')} alt="" draggable={false} /></div>
    </div>
  );
}

const GATE_CSS = `
.lg{--lg-ivory:#f8ecd0;--lg-gold:#e4be6c;position:absolute;inset:0;z-index:1;overflow:hidden;container-type:size;color:var(--lg-ivory);pointer-events:none}
.lg *{box-sizing:border-box}
.lg-leaf{position:absolute;inset:0;z-index:1;will-change:transform;transition:transform .9s cubic-bezier(.22,.74,.2,1) .4s}
.lg-leaf-l{clip-path:inset(0 50% 0 0)}.lg-leaf-r{clip-path:inset(0 0 0 50%)}
.lg-paper{position:absolute;inset:0;background:var(--lg-paper) center / cover no-repeat,#9d1420}
.lg-lanterns{position:absolute;left:0;top:0;width:100%;height:auto;max-width:none;display:block;filter:drop-shadow(0 8px 10px rgba(60,4,8,.35));transform-origin:50% 0;animation:lg-sway 5s ease-in-out infinite alternate}
.lg-seam{position:absolute;left:50%;top:0;bottom:0;z-index:2;width:2px;margin-left:-1px;background:linear-gradient(180deg,transparent,rgba(228,190,108,.9) 10%,rgba(228,190,108,.9) 90%,transparent);box-shadow:0 0 10px rgba(228,190,108,.45);transition:opacity .3s}
.lg-copy{position:absolute;inset:0;z-index:3;text-align:center;transition:opacity .6s ease .42s}
.lg-copy>*{position:absolute;left:26%;right:26%;margin:0}
.lg-kicker{top:30%;font-family:var(--font-source),sans-serif;font-size:clamp(8.5px,2.4cqw,10.5px);font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:var(--lg-gold)}
.lg-names{top:34%;left:22%;right:22%;font-family:var(--font-playfair),Georgia,serif;font-size:clamp(28px,8.6cqw,38px);font-style:italic;font-weight:500;line-height:1.14;text-wrap:balance;overflow-wrap:anywhere;color:var(--lg-ivory);text-shadow:0 2px 12px rgba(50,2,8,.55)}
.lg[data-long=true] .lg-names{font-size:clamp(23px,7cqw,31px)}
.lg-guest{top:47%;display:flex;flex-direction:column;gap:.3em;font-family:var(--font-source),sans-serif;font-size:clamp(9.5px,2.6cqw,11.5px);letter-spacing:.1em;color:rgba(248,236,208,.82)}.lg-guest strong{font-family:var(--font-playfair),Georgia,serif;font-size:clamp(15px,4.4cqw,19px);font-weight:500;letter-spacing:0;color:var(--lg-ivory);overflow-wrap:anywhere}
.lg-cta{top:84%;left:50%;right:auto;transform:translateX(-50%);width:max-content;max-width:60cqw;padding:.8em 1.3em;border:1px solid rgba(228,190,108,.9);background:rgba(80,4,12,.45);font-family:var(--font-source),sans-serif;font-size:clamp(8px,2.2cqw,9.5px);font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--lg-ivory);box-shadow:inset 0 0 0 3px rgba(80,4,12,.4),inset 0 0 0 4px rgba(228,190,108,.4);animation:lg-pulse 2.4s ease-in-out infinite}
.lg-xi{position:absolute;left:50%;top:67%;z-index:4;width:26cqw;transform:translate(-50%,-50%)}
.lg-xi img{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 10px rgba(60,4,8,.5));animation:lg-float 3.6s ease-in-out infinite alternate}
@keyframes lg-sway{from{transform:rotate(-.5deg)}to{transform:rotate(.5deg)}}@keyframes lg-float{from{transform:translateY(0)}to{transform:translateY(-4px)}}
@keyframes lg-pulse{50%{border-color:rgba(228,190,108,1);box-shadow:inset 0 0 0 3px rgba(80,4,12,.4),inset 0 0 0 4px rgba(228,190,108,.75),0 0 14px rgba(228,190,108,.3)}}
@keyframes lg-press{0%{transform:translate(-50%,-50%) scale(1)}9%{transform:translate(-50%,calc(-50% + 3px)) scale(.95)}22%{transform:translate(-50%,calc(-50% - 6px)) scale(1.04)}70%{opacity:1}100%{transform:translate(-50%,calc(-50% - 26px)) scale(.86);opacity:0}}
.lg[data-phase=opening] .lg-copy,.lg[data-preview=open] .lg-copy{opacity:0;transition-duration:.4s;transition-delay:.25s}
.lg[data-phase=opening] .lg-cta,.lg[data-preview=open] .lg-cta{opacity:0;animation:none;transition:opacity .25s}
.lg[data-phase=opening] .lg-seam,.lg[data-preview=open] .lg-seam{opacity:0}
.lg[data-phase=opening] .lg-xi{animation:lg-press .95s cubic-bezier(.4,0,.3,1) .1s both}.lg[data-phase=opening] .lg-xi img{animation:none}
.lg[data-phase=opening] .lg-leaf-l,.lg[data-preview=open] .lg-leaf-l{transform:translateX(-100%)}
.lg[data-phase=opening] .lg-leaf-r,.lg[data-preview=open] .lg-leaf-r{transform:translateX(100%)}
.lg[data-preview=open] .lg-leaf,.lg[data-preview=open] .lg-copy{transition:none}.lg[data-preview=open] .lg-xi{opacity:0;animation:none}
@media (prefers-reduced-motion:reduce){.lg *{animation:none!important}.lg-leaf{transition:none!important}}
`;
