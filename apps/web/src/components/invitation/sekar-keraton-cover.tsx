'use client';

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import type { ArtworkManifest, ArtworkSlot } from '@/lib/types';
import type { CoverKind } from '@/lib/cover-layouts';

export type SekarKeratonReviewKind = Extract<CoverKind, 'ornamen' | 'bingkai' | 'berdua' | 'terbagi'>;

interface CoverProps {
  kind: SekarKeratonReviewKind;
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

export function sekarAsset(artwork: ArtworkManifest, slot: ArtworkSlot) {
  const layer = artwork.assets[slot];
  return layer?.mobile?.url ?? layer?.default?.url ?? layer?.desktop?.url;
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

export function SekarKeratonCover(p: CoverProps) {
  const paper = sekarAsset(p.artwork, 'pageBackground') ?? sekarAsset(p.artwork, 'coverBackground');
  const cornerTL = sekarAsset(p.artwork, 'cornerTopLeft');
  const cornerBR = sekarAsset(p.artwork, 'cornerBottomRight');
  const divider = sekarAsset(p.artwork, 'divider');
  const miniKayon = sekarAsset(p.artwork, 'topDecoration');
  const panel = sekarAsset(p.artwork, 'sectionBackground');
  const cardFrame = sekarAsset(p.artwork, 'cardFrame');
  const photoFrame = sekarAsset(p.artwork, 'photoFrame');
  const photo = p.photo ?? p.groom ?? p.bride;

  return (
    <div className="skr-cover" data-kind={p.kind} data-long={p.names.length > 22 ? 'true' : 'false'} data-animated={p.animated ? 'true' : 'false'}>
      <style>{SEKAR_CSS}</style>
      <div className="skr-paper" style={paper ? { backgroundImage: `url(${paper})` } : undefined} />

      {/* 01 Ornamen: kertas berukir + sudut ukir + mini kayon sebagai titik upacara di atas teks; tanpa foto. */}
      {p.kind === 'ornamen' && (
        <>
          <Art src={cornerTL} className="skr-corner skr-corner-tl" onError={p.onAssetError} />
          <Art src={cornerBR} className="skr-corner skr-corner-br" onError={p.onAssetError} />
          <Art src={miniKayon} className="skr-o-kayon" onError={p.onAssetError} />
          <div className="skr-copy skr-o-copy"><Copy p={p} divider={divider} /></div>
        </>
      )}

      {/* 02 Foto Berbingkai: satu foto dominan dalam pigura kertas bersudut ukir. */}
      {p.kind === 'bingkai' && (
        <>
          <Mount frame={photoFrame} photo={photo} alt="Foto pasangan" className="skr-b-mount" onError={p.onAssetError} />
          <div className="skr-copy skr-b-copy"><Copy p={p} divider={divider} /></div>
        </>
      )}

      {/* 03 Berdua: dua pigura berukuran sama, sedikit bertumpuk dan miring. */}
      {p.kind === 'berdua' && (
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
          <div className="skr-t-box">
            <Art src={panel} className="skr-t-panel" onError={p.onAssetError} />
            <Art src={cardFrame} className="skr-t-frame" onError={p.onAssetError} />
            <div className="skr-t-copy"><Copy p={p} divider={divider} /></div>
          </div>
        </>
      )}
    </div>
  );
}

const SEKAR_CSS = `
.skr-cover{--skr-paper:#f0dfbd;--skr-sogan:#74401f;--skr-maroon:#68252a;--skr-gold:#aa7d38;--skr-ink:#3a291e;position:absolute;inset:0;overflow:hidden;container-type:size;text-align:center;isolation:isolate;font-family:var(--font-source),var(--font-montserrat),sans-serif;color:var(--skr-ink)}
.skr-cover *{box-sizing:border-box}
/* Kertas = ubin vertikal (aset + cerminannya) selebar kanvas: relief tepi tidak terpotong di layar ponsel yang lebih tinggi dari 2:3. */
.skr-paper{position:absolute;inset:0;z-index:0;background-color:#ead6ad;background-position:center top;background-repeat:repeat-y;background-size:100% auto}
.skr-corner{position:absolute;z-index:2;display:block;height:auto;pointer-events:none;user-select:none}.skr-corner-tl{top:0;left:0;width:25cqw}.skr-corner-br{bottom:0;right:0;width:25cqw}
/* Teks hidup selalu di koridor tengah (relief tepi aset ±17% di tiap sisi). */
.skr-copy{position:absolute;z-index:5;left:17cqw;right:17cqw;display:flex;flex-direction:column;align-items:center;justify-content:center}
.skr-kicker{margin:0;font-size:clamp(8px,2.3cqw,10px);font-weight:600;letter-spacing:.32em;line-height:1.5;text-transform:uppercase;color:var(--skr-sogan)}
.skr-names{width:100%;margin:0;font-family:var(--font-libre),Georgia,serif;font-size:var(--skr-name,clamp(32px,10cqw,42px));font-style:italic;font-weight:400;line-height:1.14;color:var(--skr-ink);overflow-wrap:anywhere;text-wrap:balance}
.skr-date{margin:0;font-size:clamp(10px,2.9cqw,12.5px);font-weight:600;letter-spacing:.32em;color:var(--skr-sogan)}
.skr-divider{display:block;width:min(40cqw,160px);height:auto;margin:0 auto;object-fit:contain}
.skr-details{display:flex;width:100%;flex-direction:column;align-items:center;gap:var(--skr-gap,2cqh)}
.skr-guest{display:flex;flex-direction:column;gap:.35em;font-size:clamp(9.5px,2.7cqw,11.5px);letter-spacing:.08em;color:rgba(58,41,30,.78)}.skr-guest strong{font-family:var(--font-libre),Georgia,serif;font-size:clamp(15px,4.3cqw,19px);font-weight:400;letter-spacing:0;color:var(--skr-ink);overflow-wrap:anywhere}
.skr-button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;border:1px solid rgba(170,125,56,.8);border-radius:2px;background:var(--skr-maroon);padding:0 2.3em;color:#f5e6c6;font-family:var(--font-source),sans-serif;font-size:clamp(10px,2.8cqw,12px);font-weight:600;letter-spacing:.18em;text-transform:uppercase;box-shadow:inset 0 0 0 3px var(--skr-maroon),inset 0 0 0 4px rgba(170,125,56,.55),0 10px 20px -14px rgba(58,41,30,.75);cursor:pointer}
.skr-copy>.skr-names,.skr-t-copy>.skr-names{margin-top:var(--skr-m1,2.2cqh)}.skr-copy>.skr-details,.skr-t-copy>.skr-details{margin-top:var(--skr-m2,2.2cqh)}.skr-copy>.skr-button,.skr-t-copy>.skr-button{margin-top:var(--skr-m3,3cqh)}
/* Pigura kertas: foto di belakang, pigura di depan. */
.skr-mount{position:absolute;z-index:4;margin:0;aspect-ratio:1014/1496;filter:drop-shadow(0 12px 14px rgba(58,41,30,.3))}
.skr-mount-photo{position:absolute;left:12.4%;top:8.4%;width:75.2%;height:82.8%;overflow:hidden;background:#d8c49b}.skr-mount-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 20%}
.skr-mount-frame{position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;user-select:none}
/* 01 Ornamen */
.skr-o-kayon{position:absolute;z-index:3;left:50%;top:7.5cqh;display:block;width:27cqw;height:auto;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 6px 8px rgba(58,41,30,.25))}
.skr-o-copy{top:32cqh;bottom:13cqh;--skr-name:clamp(36px,12cqw,50px);--skr-m1:3cqh;--skr-m2:3.2cqh;--skr-gap:2.6cqh;--skr-m3:4.4cqh}.skr-cover[data-long=true] .skr-o-copy{--skr-name:clamp(30px,9.3cqw,40px)}
/* 02 Foto Berbingkai */
.skr-b-mount{left:50%;top:3.4cqh;width:71cqw;transform:translateX(-50%)}
.skr-b-copy{top:52.5cqh;bottom:7cqh;--skr-name:clamp(30px,9.6cqw,40px);--skr-m1:1.5cqh;--skr-m2:1.7cqh;--skr-gap:1.5cqh;--skr-m3:2.2cqh}.skr-cover[data-long=true] .skr-b-copy{--skr-name:clamp(27px,8.4cqw,35px)}
/* 03 Berdua */
.skr-d-mount{width:49cqw;top:5.5cqh}.skr-d-left{left:2cqw;transform:rotate(-2.2deg)}.skr-d-right{left:49cqw;top:7.6cqh;z-index:5;transform:rotate(2.2deg)}
.skr-d-copy{top:41cqh;bottom:13cqh;--skr-name:clamp(34px,11cqw,46px);--skr-m2:3cqh;--skr-gap:2.4cqh;--skr-m3:4cqh}.skr-cover[data-long=true] .skr-d-copy{--skr-name:clamp(30px,9.3cqw,40px)}
/* 04 Terbagi */
.skr-t-haze{position:absolute;inset:0 0 auto;z-index:1;height:80cqh;overflow:hidden;opacity:.8;-webkit-mask-image:linear-gradient(#000 40%,transparent 100%);mask-image:linear-gradient(#000 40%,transparent 100%)}.skr-t-haze img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 30%;filter:blur(18px) saturate(.85);transform:scale(1.18)}
.skr-t-photo{position:absolute;inset:0 0 auto;z-index:2;height:61cqh;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent 100%);mask-image:linear-gradient(#000 70%,transparent 100%)}.skr-t-photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 30%}
.skr-t-box{position:absolute;z-index:4;left:50%;top:43cqh;width:80cqw;aspect-ratio:1101/1434;transform:translateX(-50%);filter:drop-shadow(0 16px 18px rgba(58,41,30,.32))}
.skr-t-panel,.skr-t-frame{position:absolute;display:block;pointer-events:none;user-select:none}.skr-t-panel{inset:2.5% 3%;width:94%;height:95%}.skr-t-frame{inset:0;width:100%;height:100%}
.skr-t-copy{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:15.5% 15% 12%;--skr-name:clamp(25px,7.6cqw,31px);--skr-m1:1.2cqh;--skr-m2:1.3cqh;--skr-gap:1.2cqh;--skr-m3:1.8cqh}.skr-cover[data-long=true] .skr-t-copy{--skr-name:clamp(22px,6.6cqw,27px)}.skr-t-copy .skr-divider{width:min(31cqw,124px)}.skr-t-copy .skr-button{min-height:40px;padding:0 1.8em}
.skr-cover[data-animated=true] .skr-mount,.skr-cover[data-animated=true] .skr-t-box{animation:skr-rise .85s cubic-bezier(.2,.75,.2,1) both}.skr-cover[data-animated=true] .skr-o-kayon{animation:skr-breathe 4.5s ease-in-out infinite alternate}
.skr-cover[data-animated=true] .skr-d-right{animation-delay:.12s}
@keyframes skr-rise{from{opacity:0;translate:0 18px}to{opacity:1;translate:0 0}}@keyframes skr-breathe{to{transform:translate(-50%,-5px)}}
/* Kanvas pendek (mis. 360x640): rapatkan tanpa mengubah komposisi. */
@container (max-height:720px){.skr-o-kayon{top:5cqh;width:22cqw}.skr-o-copy{top:27cqh;bottom:9cqh;--skr-m1:2cqh;--skr-m2:2cqh;--skr-gap:1.8cqh;--skr-m3:2.8cqh}.skr-b-mount{top:2.5cqh;width:60cqw}.skr-b-copy{top:50cqh;bottom:5cqh;--skr-gap:1.1cqh}.skr-d-mount{width:43cqw;top:4cqh}.skr-d-left{left:6cqw}.skr-d-right{left:51cqw;top:6cqh}.skr-d-copy{top:39cqh;bottom:7cqh;--skr-gap:1.6cqh;--skr-m3:2.6cqh}.skr-t-box{top:40cqh;width:76cqw}.skr-t-photo{height:56cqh}}
@media (prefers-reduced-motion:reduce){.skr-cover *{animation:none!important;transition:none!important}}
`;
