import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import type { ArtworkManifest, ArtworkSlot, InvitationViewData } from '@/lib/types';

export const metadata={title:'Pawiwahan Agung — Gate Review',robots:{index:false,follow:false}};
function artwork():ArtworkManifest {
  const files:Partial<Record<ArtworkSlot,[string,number,number]>>={
    coverBackground:['page-tile',1024,3072],pageBackground:['page-tile',1024,3072],
    gateBackground:['gate-bg',1024,1536],gateTransition:['gate-panel-left',315,1536],
    gateForeground:['gate-panel-right',329,1536],gateInteractive:['gate-tab',727,970],
    divider:['divider',1973,137],cardFrame:['info-card',858,1229],photoFrame:['photo-frame',872,1263],
    topDecoration:['accent',531,531],bottomDecoration:['divider',1973,137],
  };
  return {
    schemaVersion:1,designId:'pawiwahan-agung',artworkVersion:1,
    assets:Object.fromEntries(Object.entries(files).map(([slot,[file,width,height]])=>[slot,{default:{url:`/themes/pawiwahan-agung/${file}.webp`,contentType:'image/webp',width,height,sizeBytes:1}}])),
    presentation:{backgroundFit:'cover',backgroundPosition:'center',foregroundPosition:'center',foregroundMotion:'none',opacity:1,scale:1,backgroundLayer:0,decorationLayer:2,foregroundLayer:3,showOnOrnamentCover:true,showOnPhotoCover:true},fallback:{coverEffect:'none'},
  };
}
export default async function PawiwahanGateReview({searchParams}:{searchParams:Promise<{long?:string;size?:string;tier?:string}>}) {
  if(process.env.NODE_ENV==='production')notFound();
  const query=await searchParams;
  const standard=query.tier==='standard';
  const view:InvitationViewData={
    slug:'pawiwahan-gate-review',features:{},media:{},rsvpEnabled:false,guestbook:[],
    layout:{
      artwork:artwork(),
      theme:{preset:'pawiwahan-agung',motif:'pawiwahan-agung',gate:standard?'none':'paras',fx:standard?'standard':'premium',primary:'#873e32',secondary:'#a77a38',background:'#f2e7d0',text:'#332923',headingFont:'serif',bodyFont:'serif'},
      sections:[{id:'cover',title:'Cover',fields:[]}],musik:{presets:[]},coverLayouts:['ornamen','bingkai','berdua','terbagi','penuh'],
    },
    data:{cover:{tata_letak:'ornamen'},mempelai:{pria_nama:query.long==='true'?'Alexandra Putri':'Andi',wanita_nama:query.long==='true'?'Muhammad Rasyid':'Sinta'},tanggal_lokasi:{akad_tanggal:'2026-12-26T10:00'}},
  };
  const dimensions=query.size==='narrow'?{width:320,height:640}:query.size==='tall'?{width:440,height:956}:{width:390,height:700};
  return <main style={{...dimensions,background:'#211712'}}><InvitationView view={view} mode="live" embedded gate="show"/></main>;
}
