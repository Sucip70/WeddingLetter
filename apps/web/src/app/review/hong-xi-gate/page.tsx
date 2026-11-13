import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import type { ArtworkManifest, ArtworkSlot, InvitationViewData } from '@/lib/types';

export const metadata={title:'Hong Xi — Gate Review',robots:{index:false,follow:false}};
function artwork():ArtworkManifest {
  const files:Partial<Record<ArtworkSlot,string>>={coverBackground:'page-bg',pageBackground:'page-tile',gateBackground:'page-bg',cornerTopLeft:'lanterns',gateInteractive:'xi',divider:'divider',cardFrame:'info-card',photoFrame:'photo-frame',topDecoration:'xi',bottomDecoration:'koi'};
  return {
    schemaVersion:1,designId:'hong-xi',artworkVersion:1,
    assets:Object.fromEntries(Object.entries(files).map(([slot,file])=>[slot,{default:{url:`/themes/hong-xi/${file}.webp`,contentType:'image/webp',width:1024,height:1536,sizeBytes:1}}])),
    presentation:{backgroundFit:'cover',backgroundPosition:'center',foregroundPosition:'center',foregroundMotion:'none',opacity:1,scale:1,backgroundLayer:0,decorationLayer:2,foregroundLayer:3,showOnOrnamentCover:true,showOnPhotoCover:true},fallback:{coverEffect:'none'},
  };
}
export default async function HongXiGateReview({searchParams}:{searchParams:Promise<{long?:string;size?:string;tier?:string}>}) {
  if(process.env.NODE_ENV==='production')notFound();
  const query=await searchParams;
  const standard=query.tier==='standard';
  const view:InvitationViewData={
    slug:'hong-xi-gate-review',features:{},media:{},rsvpEnabled:false,guestbook:[],
    layout:{artwork:artwork(),theme:{preset:'hong-xi',motif:'hong-xi',gate:standard?'none':'lentera',fx:standard?'standard':'premium',primary:'#a3151f',secondary:'#e4be6c',background:'#9d1420',text:'#f8ecd0',headingFont:'serif',bodyFont:'serif'},sections:[{id:'cover',title:'Cover',fields:[]}],musik:{presets:[]},coverLayouts:['ornamen','bingkai','berdua','terbagi','penuh']},
    data:{cover:{tata_letak:'ornamen'},mempelai:{pria_nama:query.long==='true'?'Alexandra Putri':'Andi',wanita_nama:query.long==='true'?'Muhammad Rasyid':'Sinta'},tanggal_lokasi:{akad_tanggal:'2026-12-26T10:00'}},
  };
  const dimensions=query.size==='narrow'?{width:320,height:640}:query.size==='short'?{width:320,height:520}:query.size==='tall'?{width:440,height:956}:{width:390,height:740};
  return <main style={{...dimensions,background:'#211712'}}><InvitationView view={view} mode="live" embedded gate="show"/></main>;
}
