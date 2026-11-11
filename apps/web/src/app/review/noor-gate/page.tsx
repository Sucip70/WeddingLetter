import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import type { ArtworkManifest, InvitationViewData } from '@/lib/types';

export const metadata={title:'Noor — Gate Review',robots:{index:false,follow:false}};
export default async function NoorGateReview({searchParams}:{searchParams:Promise<{long?:string;size?:string;tier?:string}>}) {
  if(process.env.NODE_ENV==='production')notFound();
  const query=await searchParams;
  const standard=query.tier==='standard';
  const artwork={schemaVersion:1,artworkVersion:1,designId:'noor-e-nikah',assets:Object.fromEntries(Object.entries({coverBackground:'page-bg',pageBackground:'page-tile',cardFrame:'info-card',gateInteractive:'gate-rosette',divider:'divider',bottomDecoration:'inlay',topDecoration:'marker',photoFrame:'photo-frame'}).map(([slot,file])=>[slot,{default:{url:`/themes/noor-e-nikah/${file}.webp`,contentType:'image/webp',width:1024,height:1536,sizeBytes:1}}])),presentation:{backgroundFit:'cover',backgroundPosition:'center',foregroundPosition:'center',foregroundMotion:'none',opacity:1,scale:1,backgroundLayer:0,decorationLayer:2,foregroundLayer:3,showOnOrnamentCover:true,showOnPhotoCover:true},fallback:{coverEffect:'none'}} as ArtworkManifest;
  const view:InvitationViewData={
    slug:'noor-gate-review',features:{},media:{},rsvpEnabled:false,guestbook:[],
    layout:{artwork,theme:{preset:'noor-e-nikah',motif:'noor-e-nikah',gate:standard?'none':'jali',fx:standard?'standard':'premium',primary:'#063f32',secondary:'#c8a25d',background:'#f6ecd4',text:'#28231f',headingFont:'serif',bodyFont:'serif'},sections:[{id:'cover',title:'Cover',fields:[]}],musik:{presets:[]},coverLayouts:['ornamen','bingkai','berdua','terbagi','penuh']},
    data:{cover:{tata_letak:'ornamen'},mempelai:{pria_nama:query.long==='true'?'Alexandra Putri':'Andi',wanita_nama:query.long==='true'?'Muhammad Rasyid':'Sinta'},tanggal_lokasi:{akad_tanggal:'2026-12-26T10:00'}},
  };
  const dimensions=query.size==='narrow'?{width:320,height:640}:query.size==='short'?{width:320,height:520}:query.size==='tall'?{width:440,height:956}:{width:390,height:740};
  return <main style={{...dimensions,position:'relative'}}><InvitationView view={view} mode="live" embedded gate="show"/></main>;
}
