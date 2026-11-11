import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import { RasterCover, type RasterCoverKind } from '@/components/invitation/raster-cover';
import type { ArtworkManifest, InvitationViewData } from '@/lib/types';

export const metadata={title:'Vivaha — Approved Gate and Cover Review',robots:{index:false,follow:false}};
export default async function VivahaReview({searchParams}:{searchParams:Promise<{long?:string;size?:string;tier?:string;kind?:string;photo?:string;view?:string}>}) {
  if(process.env.NODE_ENV==='production')notFound();
  const query=await searchParams;
  const standard=query.tier==='standard', noPhoto=query.photo==='none', long=query.long==='true';
  const kind:RasterCoverKind=query.kind==='ornamen'?'ornamen':query.kind==='berdua'?'berdua':'bingkai';
  const artwork={schemaVersion:1,artworkVersion:1,designId:'vivaha-rani',assets:Object.fromEntries(Object.entries({coverBackground:'page-bg',pageBackground:'page-tile',sectionBackground:'info-card',divider:'divider',topDecoration:'marker',photoFrame:'photo-frame'}).map(([slot,file])=>[slot,{default:{url:`/themes/vivaha-rani/${file}.webp`,contentType:'image/webp',width:1024,height:1536,sizeBytes:1}}])),presentation:{backgroundFit:'cover',backgroundPosition:'center',foregroundPosition:'center',foregroundMotion:'none',opacity:1,scale:1,backgroundLayer:0,decorationLayer:2,foregroundLayer:3,showOnOrnamentCover:true,showOnPhotoCover:true},fallback:{coverEffect:'none'}} as ArtworkManifest;
  const dimensions=query.size==='narrow'?{width:320,height:640}:query.size==='short'?{width:320,height:520}:query.size==='tall'?{width:440,height:956}:{width:390,height:740};
  const names=long?'Alexandra Putri & Muhammad Rasyid':'Andi & Sinta';
  if(query.view==='cover')return <main style={{...dimensions,position:'relative'}}><RasterCover kind={kind} artwork={artwork}
    photo={noPhoto?undefined:'/samples/vivaha-rani/cover.webp'} groom={noPhoto?undefined:'/samples/vivaha-rani/groom.webp'} bride={noPhoto?undefined:'/samples/vivaha-rani/bride.webp'}
    names={names} kicker="Undangan Pernikahan" dateText="26 · 12 · 2026" guest={{dear:'Kepada Yth.',name:long?'Bapak/Ibu Muhammad Abdurrahman & Keluarga':'Bapak/Ibu Rahmat & Keluarga'}} openLabel="Buka undangan" animated={false} decorative/></main>;
  const view:InvitationViewData={
    slug:'vivaha-gate-review',features:{},media:noPhoto?{}:{cover:{url:'/samples/vivaha-rani/cover.webp',type:'image/webp'},groom:{url:'/samples/vivaha-rani/groom.webp',type:'image/webp'},bride:{url:'/samples/vivaha-rani/bride.webp',type:'image/webp'}},rsvpEnabled:false,guestbook:[],
    layout:{artwork,theme:{preset:'vivaha-rani',motif:'vivaha-rani',gate:standard?'none':'toran',fx:standard?'standard':'premium',primary:'#941e39',secondary:'#ba9052',background:'#f7ead6',text:'#841d38',headingFont:'serif',bodyFont:'serif'},sections:[{id:'cover',title:'Cover',fields:[]}],musik:{presets:[]},coverLayouts:['ornamen','bingkai','berdua','terbagi','penuh']},
    data:{cover:{tata_letak:kind,foto:noPhoto?'':'cover'},mempelai:{pria_nama:long?'Alexandra Putri':'Andi',wanita_nama:long?'Muhammad Rasyid':'Sinta',pria_foto:noPhoto?'':'groom',wanita_foto:noPhoto?'':'bride'},tanggal_lokasi:{akad_tanggal:'2026-12-26T10:00'}},
  };
  return <main style={{...dimensions,position:'relative'}}><InvitationView view={view} mode="live" embedded gate="show"/></main>;
}
