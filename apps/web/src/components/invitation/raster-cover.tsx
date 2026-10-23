'use client';

/* eslint-disable @next/next/no-img-element */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { ArtworkManifest } from '@/lib/types';
import type { CoverKind } from '@/lib/cover-layouts';
import { rasterAsset, rasterTheme, rasterThemeVars } from './raster-theme';
import { RasterCard } from './raster-sections';

export type RasterCoverKind = Extract<CoverKind, 'ornamen' | 'penuh' | 'bingkai' | 'berdua' | 'terbagi'>;

interface CoverProps {
  kind: RasterCoverKind;
  artwork: ArtworkManifest;
  photo?: string;
  groom?: string;
  bride?: string;
  kicker: string;
  names: string;
  dateText: string;
  guest: { dear: string; name: string } | null;
  openLabel: string;
  onOpen?: () => void;
  decorative?: boolean;
  animated: boolean;
  onAssetError?: () => void;
}

function Art({ src, className, onError }: { src?: string; className: string; onError?: () => void }) {
  return src ? <img src={src} alt="" className={className} draggable={false} onError={onError} /> : null;
}

function InvitationButton({ decorative, onOpen, children }: { decorative?: boolean; onOpen?: () => void; children: string }) {
  const Tag = decorative ? 'span' : 'button';
  return <Tag {...(decorative ? {} : { type: 'button' as const, onClick: onOpen })} className="skr-button">{children}</Tag>;
}

function Copy({ p, divider, kicker = true }: { p: CoverProps; divider?: string; kicker?: boolean }) {
  return (
    <>
      {kicker && <p className="skr-kicker">{p.kicker}</p>}
      <h1 className="skr-names">{p.names}</h1>
      <div className="skr-details">
        <p className="skr-date">{p.dateText}</p>
        <Art src={divider} className="skr-divider" onError={p.onAssetError} />
        {p.guest && <div className="skr-guest"><span>{p.guest.dear}</span><strong>{p.guest.name}</strong></div>}
      </div>
      <InvitationButton decorative={p.decorative} onOpen={p.onOpen}>{p.openLabel}</InvitationButton>
    </>
  );
}

/* Pigura kertas (photo-frame): foto dipasang DI BELAKANG pigura, di lubangnya (13,6%-86,2% x 9,6%-90% pada aset), lalu pigura menutup tepinya. */
function Mount({ frame, photo, alt, className, style, onError }: { frame?: string; photo?: string; alt: string; className?: string; style?: CSSProperties; onError?: () => void }) {
  return (
    <figure className={`skr-mount ${className ?? ''}`} style={style}>
      <div className="skr-mount-photo">{photo && <img src={photo} alt={alt} />}</div>
      <Art src={frame} className="skr-mount-frame" onError={onError} />
    </figure>
  );
}

export function RasterCover(p: CoverProps) {
  const paper = rasterTheme(p.artwork.designId)?.coverPaper ? rasterAsset(p.artwork, 'coverBackground') : rasterAsset(p.artwork, 'pageBackground') ?? rasterAsset(p.artwork, 'coverBackground');
  const fullPaper = !!rasterTheme(p.artwork.designId)?.coverPaper;
  const cornerTL = rasterAsset(p.artwork, 'cornerTopLeft');
  const cornerBR = rasterAsset(p.artwork, 'cornerBottomRight');
  const divider = rasterAsset(p.artwork, 'divider');
  const miniKayon = rasterAsset(p.artwork, 'topDecoration');
  const panel = rasterAsset(p.artwork, 'sectionBackground');
  const cardFrame = rasterAsset(p.artwork, 'cardFrame');
  const photoFrame = rasterAsset(p.artwork, 'photoFrame');
  const photo = p.photo ?? p.groom ?? p.bride;
  // Set sampul khusus (Sekar Keraton "Pendopo Emas") dipakai bersama oleh Ornamen, Foto berbingkai, dan Berdua.
  const set = p.kind === 'ornamen' || p.kind === 'bingkai' || p.kind === 'berdua' ? rasterTheme(p.artwork.designId)?.coverSet : undefined;
  const setMount = set ? ({ '--sk-mount-ar': set.aspect, '--sk-hole-l': `${set.hole.l}%`, '--sk-hole-t': `${set.hole.t}%`, '--sk-hole-w': `${set.hole.w}%`, '--sk-hole-h': `${set.hole.h}%` } as CSSProperties) : undefined;

  return (
    <div className={`skr-cover ${set ? 'skr-set' : ''}`} style={rasterThemeVars(p.artwork.designId)} data-kind={p.kind} data-long={p.names.length > 22 ? 'true' : 'false'} data-animated={p.animated ? 'true' : 'false'}>
      <style>{SEKAR_CSS}</style>
      <div className="skr-paper" style={set ? { backgroundImage: `url(${set.paper})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' } : paper ? { backgroundImage: `url(${paper})`, ...(fullPaper ? { backgroundSize: 'cover', backgroundRepeat: 'no-repeat' } : null) } : undefined} />
      {set && <Art src={set.top} className="skr-b-top" onError={p.onAssetError} />}
      {set && <Art src={set.bottom} className="skr-b-bottom" onError={p.onAssetError} />}

      {/* 01 Ornamen: kertas berukir + sudut ukir + mini kayon sebagai titik upacara di atas teks; tanpa foto.
          Dengan set Pendopo Emas: kanopi & fondasi saja (aturan aset: jangan ditumpuk dengan kayon mini / sudut ukir). */}
      {p.kind === 'ornamen' && (set ? (
        <div className="skr-b-stack skr-b-stack-set skr-o-set">
          <div className="skr-copy skr-b-copy"><Copy p={p} divider={set.divider} /></div>
        </div>
      ) : (
        <>
          <Art src={cornerTL} className="skr-corner skr-corner-tl" onError={p.onAssetError} />
          <Art src={cornerBR} className="skr-corner skr-corner-br" onError={p.onAssetError} />
          <Art src={miniKayon} className="skr-o-kayon" onError={p.onAssetError} />
          <div className="skr-copy skr-o-copy"><Copy p={p} divider={divider} /></div>
        </>
      ))}

      {/* 02 Foto Berbingkai: satu foto dominan dalam pigura kertas bersudut ukir. */}
      {p.kind === 'bingkai' && (
        <div className={`skr-b-stack ${set ? 'skr-b-stack-set' : ''}`}>
          <Mount frame={set?.frame ?? photoFrame} photo={photo} alt="Foto pasangan" className="skr-b-mount" style={setMount} onError={p.onAssetError} />
          <div className="skr-copy skr-b-copy"><Copy p={p} divider={set?.divider ?? divider} /></div>
        </div>
      )}

      {/* 05 Foto penuh: foto pasangan memenuhi layar, gradasi gelap di bawah, garis emas ganda di dalam tepi, tulisan terang di bawah. */}
      {p.kind === 'penuh' && (
        <>
          {photo && <div className="skr-p-photo"><img src={photo} alt="Foto pasangan" /></div>}
          <div className="skr-p-shade" aria-hidden />
          <div className="skr-p-frame" aria-hidden />
          <div className="skr-copy skr-p-copy"><Copy p={p} divider={divider} /></div>
        </>
      )}

      {/* 03 Berdua: dua pigura berukuran sama, sedikit bertumpuk dan miring. */}
      {p.kind === 'berdua' && set && (
        <div className="skr-b-stack skr-b-stack-set skr-d-set">
          <div className="skr-d-row">
            <Mount frame={set.frame} photo={p.groom} alt="Foto mempelai pria" className="skr-d-pm skr-d-pl" style={setMount} onError={p.onAssetError} />
            <Mount frame={set.frame} photo={p.bride} alt="Foto mempelai wanita" className="skr-d-pm skr-d-pr" style={setMount} onError={p.onAssetError} />
          </div>
          <div className="skr-copy skr-b-copy"><Copy p={p} divider={set.divider} kicker={false} /></div>
        </div>
      )}
      {p.kind === 'berdua' && !set && (
        <>
          <Mount frame={photoFrame} photo={p.groom} alt="Foto mempelai pria" className="skr-d-mount skr-d-left" onError={p.onAssetError} />
          <Mount frame={photoFrame} photo={p.bride} alt="Foto mempelai wanita" className="skr-d-mount skr-d-right" onError={p.onAssetError} />
          <div className="skr-copy skr-d-copy"><Copy p={p} divider={divider} kicker={false} /></div>
        </>
      )}

      {/* 04 Terbagi: foto penuh di atas melebur ke kertas; panel kertas berbingkai kayu sogan menimpa peralihannya. */}
      {p.kind === 'terbagi' && (
        <>
          {photo && (
            <>
              <div className="skr-t-haze" aria-hidden><img src={photo} alt="" /></div>
              <div className="skr-t-photo"><img src={photo} alt="Foto pasangan" /></div>
            </>
          )}
          {rasterTheme(p.artwork.designId)?.card.kind === 'sliced' ? (
            <RasterCard artwork={p.artwork} className="skr-t-sliced"><div className="skr-t-copy"><Copy p={p} divider={divider} /></div></RasterCard>
          ) : (
            <div className="skr-t-box">
              <Art src={panel} className="skr-t-panel" onError={p.onAssetError} />
              <Art src={cardFrame} className="skr-t-frame" onError={p.onAssetError} />
              <div className="skr-t-copy"><Copy p={p} divider={divider} /></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const SEKAR_CSS = `
.skr-cover{--skr-paper:#f0dfbd;--skr-sogan:var(--sk-sogan,#74401f);--skr-maroon:var(--sk-maroon,#68252a);--skr-gold:#aa7d38;--skr-ink:var(--sk-ink,#3a291e);position:absolute;inset:0;overflow:hidden;container-type:size;text-align:center;isolation:isolate;font-family:var(--font-source),var(--font-montserrat),sans-serif;color:var(--skr-ink)}
.skr-cover *{box-sizing:border-box}
/* Kertas = ubin vertikal (aset + cerminannya) selebar kanvas: relief tepi tidak terpotong di layar ponsel yang lebih tinggi dari 2:3. */
.skr-paper{position:absolute;inset:0;z-index:0;background-color:#ead6ad;background-position:center top;background-repeat:repeat-y;background-size:100% auto}
.skr-corner{position:absolute;z-index:2;display:block;height:auto;pointer-events:none;user-select:none}.skr-corner-tl{top:0;left:0;width:var(--sk-corner-w,25cqw)}.skr-corner-br{bottom:0;right:var(--sk-corner-br-right,0);width:var(--sk-corner-br-w,var(--sk-corner-w,25cqw))}
/* Teks hidup selalu di koridor tengah (relief tepi aset ±17% di tiap sisi). */
.skr-copy{position:absolute;z-index:5;left:var(--sk-copy-x,17cqw);right:var(--sk-copy-x,17cqw);display:flex;flex-direction:column;align-items:center;justify-content:center}
.skr-kicker{margin:0;font-size:clamp(8px,2.3cqw,10px);font-weight:600;letter-spacing:.32em;line-height:1.5;text-transform:uppercase;color:var(--skr-sogan)}
.skr-names{width:100%;margin:0;font-family:var(--sk-display,var(--font-libre),Georgia,serif);font-size:var(--skr-name,clamp(32px,10cqw,42px));font-style:italic;font-weight:400;line-height:1.14;color:var(--skr-ink);overflow-wrap:anywhere;text-wrap:balance}
.skr-date{margin:0;font-size:clamp(10px,2.9cqw,12.5px);font-weight:600;letter-spacing:.32em;color:var(--skr-sogan)}
.skr-divider{display:block;width:min(40cqw,160px);height:auto;margin:0 auto;object-fit:contain}
.skr-details{display:flex;width:100%;flex-direction:column;align-items:center;gap:var(--skr-gap,2cqh)}
.skr-guest{display:flex;flex-direction:column;gap:.35em;font-size:clamp(9.5px,2.7cqw,11.5px);letter-spacing:.08em;color:color-mix(in srgb,var(--skr-ink) 80%,transparent)}.skr-guest strong{font-family:var(--sk-display,var(--font-libre),Georgia,serif);font-size:clamp(15px,4.3cqw,19px);font-weight:400;letter-spacing:0;color:var(--skr-ink);overflow-wrap:anywhere}
.skr-button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;border:1px solid rgba(var(--sk-edge-rgb,170,125,56),.8);border-radius:2px;background:var(--sk-btn-bg,var(--skr-maroon));padding:0 2.3em;white-space:nowrap;color:var(--sk-btn-fg,#f5e6c6);font-family:var(--font-source),sans-serif;font-size:clamp(10px,2.8cqw,12px);font-weight:600;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 0 0 0 3px var(--sk-btn-bg,var(--skr-maroon)),inset 0 0 0 4px rgba(var(--sk-edge-rgb,170,125,56),.55),0 10px 20px -14px rgba(58,41,30,.75);cursor:pointer}
.skr-copy>.skr-names,.skr-t-copy>.skr-names{margin-top:var(--skr-m1,2.2cqh)}.skr-copy>.skr-details,.skr-t-copy>.skr-details{margin-top:var(--skr-m2,2.2cqh)}.skr-copy>.skr-button,.skr-t-copy>.skr-button{margin-top:var(--skr-m3,3cqh)}
/* Pigura kertas: foto di belakang, pigura di depan. */
.skr-mount{position:absolute;z-index:4;margin:0;aspect-ratio:var(--sk-mount-ar,1014/1496);filter:drop-shadow(0 12px 14px rgba(58,41,30,.3))}
.skr-mount-photo{position:absolute;left:var(--sk-hole-l,12.4%);top:var(--sk-hole-t,8.4%);width:var(--sk-hole-w,75.2%);height:var(--sk-hole-h,82.8%);overflow:hidden;background:#d8c49b}.skr-mount-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 20%}
.skr-mount-frame{position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;user-select:none}
/* 01 Ornamen */
.skr-o-kayon{position:absolute;z-index:3;left:50%;top:7.5cqh;display:block;width:var(--sk-marker-w,27cqw);height:auto;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 6px 8px rgba(58,41,30,.25))}
.skr-o-copy{top:32cqh;bottom:var(--sk-o-bottom,13cqh);--skr-name:var(--sk-name-size,clamp(36px,12cqw,50px));--skr-m1:3cqh;--skr-m2:3.2cqh;--skr-gap:2.6cqh;--skr-m3:4.4cqh}.skr-cover[data-long=true] .skr-o-copy{--skr-name:clamp(30px,9.3cqw,40px)}
/* 02 Foto Berbingkai */
/* foto + tulisan = satu tumpukan yang dipusatkan vertikal; lebar foto dibatasi tinggi kanvas supaya tulisan selalu muat */
.skr-b-stack{position:absolute;inset:6cqh 0 5cqh;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3.2cqh}
/* set khusus (Pendopo Emas): kanopi & fondasi selebar kanvas; tumpukan diletakkan di antaranya, tombol pil marun berbingkai emas */
.skr-b-stack.skr-b-stack-set{top:calc(18.5cqw + 2.5cqh);bottom:calc(21cqw + 2.5cqh);gap:2.6cqh}
.skr-cover[data-long=true] .skr-b-stack-set .skr-b-copy{--skr-name:clamp(24px,min(7.4cqw,4.2cqh),32px)}
.skr-b-stack-set .skr-b-mount{width:min(62cqw,26cqh)}
.skr-b-stack-set .skr-b-copy{--skr-name:clamp(28px,min(9cqw,5cqh),38px);--skr-m1:1.2cqh;--skr-m2:1.4cqh;--skr-gap:1.6cqh;--skr-m3:2.6cqh}
.skr-set .skr-divider{width:min(32cqw,130px)}
.skr-set .skr-button{border-radius:999px;padding:0 2.6em;text-transform:none;letter-spacing:.04em;font-family:var(--sk-display,var(--font-libre),Georgia,serif);font-size:clamp(13px,3.7cqw,16px);font-weight:400}
.skr-set .skr-names{color:var(--skr-maroon)}
/* Ornamen bertset: hanya tulisan, lebih besar */
.skr-o-set .skr-b-copy{--skr-name:clamp(34px,min(11cqw,6cqh),46px);--skr-m1:2.4cqh;--skr-m2:2.6cqh;--skr-gap:2.4cqh;--skr-m3:4cqh}
.skr-cover[data-long=true] .skr-o-set .skr-b-copy{--skr-name:clamp(28px,min(8.6cqw,5cqh),36px)}
.skr-o-set .skr-copy{width:80cqw}
/* Berdua bertset: dua pigura emas berdampingan, sedikit bertumpuk & miring */
.skr-d-row{display:flex;justify-content:center;align-items:flex-start;flex:none}
.skr-d-pm{position:relative;flex:none;width:min(44cqw,22cqh)}
.skr-d-pl{transform:rotate(-2deg);z-index:1}.skr-d-pr{margin-left:-4cqw;margin-top:2cqh;transform:rotate(2deg);z-index:2}
.skr-b-stack .skr-mount{position:relative;flex:none}
.skr-b-mount{width:min(var(--sk-b-w,74cqw),33cqh)}
.skr-b-stack .skr-copy{position:relative;inset:auto;width:68cqw;flex:none}
.skr-b-top,.skr-b-bottom{position:absolute;left:0;z-index:2;display:block;width:100%;height:auto;pointer-events:none;user-select:none}.skr-b-top{top:0}
/* fondasi (1600x224) lebih pipih dari approved-preview: ditinggikan 1,5x (object-fit fill) supaya tiang & pita ukir setinggi di preview */
.skr-b-bottom{bottom:0;height:21cqw;object-fit:fill}
.skr-b-copy{--skr-name:clamp(30px,9.6cqw,40px);--skr-m1:1.5cqh;--skr-m2:1.7cqh;--skr-gap:1.5cqh;--skr-m3:2.2cqh}.skr-cover[data-long=true] .skr-b-copy{--skr-name:clamp(27px,8.4cqw,35px)}
/* 03 Berdua */
.skr-d-mount{width:49cqw;top:5.5cqh}.skr-d-left{left:2cqw;transform:rotate(-2.2deg)}.skr-d-right{left:49cqw;top:7.6cqh;z-index:5;transform:rotate(2.2deg)}
.skr-d-copy{top:41cqh;bottom:13cqh;--skr-name:clamp(34px,11cqw,46px);--skr-m2:3cqh;--skr-gap:2.4cqh;--skr-m3:4cqh}.skr-cover[data-long=true] .skr-d-copy{--skr-name:clamp(30px,9.3cqw,40px)}
/* 04 Terbagi */
.skr-t-haze{position:absolute;inset:0 0 auto;z-index:1;height:80cqh;overflow:hidden;opacity:.8;-webkit-mask-image:linear-gradient(#000 40%,transparent 100%);mask-image:linear-gradient(#000 40%,transparent 100%)}.skr-t-haze img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 30%;filter:blur(18px) saturate(.85);transform:scale(1.18)}
.skr-t-photo{position:absolute;inset:0 0 auto;z-index:2;height:61cqh;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent 100%);mask-image:linear-gradient(#000 70%,transparent 100%)}.skr-t-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 30%}
.skr-t-box{position:absolute;z-index:4;left:50%;top:43cqh;width:80cqw;aspect-ratio:1101/1434;transform:translateX(-50%);filter:drop-shadow(0 16px 18px rgba(58,41,30,.32))}
.skr-t-panel,.skr-t-frame{position:absolute;display:block;pointer-events:none;user-select:none}.skr-t-panel{inset:2.5% 3%;width:94%;height:95%}.skr-t-frame{inset:0;width:100%;height:100%}
.skr-t-sliced{position:absolute;z-index:4;left:50%;top:var(--sk-t-top,46cqh);transform:translateX(-50%);--cw:68cqw;--skr-ink:var(--sk-card-ink,var(--sk-ink));--skr-sogan:var(--sk-card-label,var(--sk-sogan))}.skr-t-sliced .skr-t-copy{position:relative;inset:auto;padding:0;--skr-name:clamp(24px,7.2cqw,30px)}.skr-cover[data-long=true] .skr-t-sliced .skr-t-copy{--skr-name:clamp(21px,6.3cqw,26px)}
.skr-t-copy{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:15.5% 15% 12%;--skr-name:clamp(25px,7.6cqw,31px);--skr-m1:1.2cqh;--skr-m2:1.3cqh;--skr-gap:1.2cqh;--skr-m3:1.8cqh}.skr-cover[data-long=true] .skr-t-copy{--skr-name:clamp(22px,6.6cqw,27px)}.skr-t-copy .skr-divider{width:min(31cqw,124px)}.skr-t-copy .skr-button{min-height:40px;padding:0 1.8em}
.skr-cover[data-animated=true] .skr-mount,.skr-cover[data-animated=true] .skr-t-box{animation:skr-rise .85s cubic-bezier(.2,.75,.2,1) both}.skr-cover[data-animated=true] .skr-o-kayon{animation:skr-breathe 4.5s ease-in-out infinite alternate}
.skr-cover[data-animated=true] .skr-d-right{animation-delay:.12s}
@keyframes skr-rise{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}@keyframes skr-breathe{to{transform:translate(-50%,-5px)}}
/* 05 Foto penuh */
.skr-p-photo{position:absolute;inset:0;z-index:1;background:#2a1a12}.skr-p-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 30%}
.skr-p-shade{position:absolute;inset:0;z-index:2;background:linear-gradient(180deg,rgba(20,10,6,.35) 0%,rgba(20,10,6,0) 22%,rgba(20,10,6,0) 42%,rgba(20,10,6,.62) 66%,rgba(20,10,6,.9) 100%)}
.skr-p-frame{position:absolute;inset:3.5cqw;z-index:3;border:1px solid rgba(var(--sk-edge-rgb,170,125,56),.85);pointer-events:none}.skr-p-frame::after{content:"";position:absolute;inset:5px;border:1px solid rgba(var(--sk-edge-rgb,170,125,56),.45)}
.skr-p-copy{top:auto;bottom:8cqh;left:12cqw;right:12cqw;--skr-ink:#f8eedb;--skr-sogan:rgb(var(--sk-edge-rgb,226,190,120));--skr-name:clamp(32px,10cqw,44px);--skr-m1:1.4cqh;--skr-m2:1.8cqh;--skr-gap:1.6cqh;--skr-m3:2.6cqh;text-shadow:0 2px 12px rgba(0,0,0,.55)}
.skr-p-copy .skr-kicker,.skr-p-copy .skr-date{color:#ecd29a}.skr-p-copy .skr-guest{color:rgba(248,238,219,.82)}
.skr-cover[data-long=true] .skr-p-copy{--skr-name:clamp(28px,8.6cqw,38px)}
/* Kanvas pendek (mis. 360x640): rapatkan tanpa mengubah komposisi. */
@container (max-height:720px){.skr-o-kayon{top:5cqh;width:calc(var(--sk-marker-w,27cqw)*.82)}.skr-o-copy{top:27cqh;bottom:9cqh;--skr-m1:2cqh;--skr-m2:2cqh;--skr-gap:1.8cqh;--skr-m3:2.8cqh}.skr-b-stack{gap:2.4cqh}.skr-b-copy{--skr-gap:1.1cqh}.skr-d-mount{width:43cqw;top:4cqh}.skr-d-left{left:6cqw}.skr-d-right{left:51cqw;top:6cqh}.skr-d-copy{top:39cqh;bottom:7cqh;--skr-gap:1.6cqh;--skr-m3:2.6cqh}.skr-t-box{top:40cqh;width:76cqw}.skr-t-sliced{top:41cqh}.skr-t-photo{height:56cqh}}
@media (prefers-reduced-motion:reduce){.skr-cover *{animation:none!important;transition:none!important}}
`;

/** Miniatur sampul untuk kartu katalog/daftar: sampul asli dirender pada lebar ponsel 390px lalu diskalakan ke lebar wadah. */
export function RasterCoverThumb(p: Omit<CoverProps, 'onOpen' | 'decorative' | 'animated'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, height: 810 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const scale = el.clientWidth / 390 || 1;
      setBox({ scale, height: Math.max(676, el.clientHeight / scale) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden" aria-hidden>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 390, height: box.height, transform: `scale(${box.scale})`, transformOrigin: 'top left' }}>
        <RasterCover {...p} decorative animated={false} />
      </div>
    </div>
  );
}
