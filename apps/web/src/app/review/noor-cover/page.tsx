import { notFound } from 'next/navigation';
import { RasterCover, type RasterCoverKind } from '@/components/invitation/raster-cover';
import type { ArtworkManifest } from '@/lib/types';

export const metadata={title:'Noor — Cover Review',robots:{index:false,follow:false}};
export default async function NoorCoverReview({searchParams}:{searchParams:Promise<{long?:string;size?:string;kind?:string;photo?:string}>}) {
  if(process.env.NODE_ENV==='production')notFound();
  const query=await searchParams;
  const kind:RasterCoverKind=query.kind==='ornamen'?'ornamen':query.kind==='berdua'?'berdua':'bingkai';
  const artwork={designId:'noor-e-nikah',assets:Object.fromEntries(Object.entries({coverBackground:'page-bg',photoFrame:'photo-frame',topDecoration:'marker',divider:'divider'}).map(([slot,file])=>[slot,{default:{url:`/themes/noor-e-nikah/${file}.webp`}}]))} as ArtworkManifest;
  const dimensions=query.size==='narrow'?{width:320,height:640}:query.size==='short'?{width:320,height:520}:query.size==='tall'?{width:440,height:956}:{width:390,height:740};
  const noPhoto=query.photo==='none';
  return <main style={{...dimensions,position:'relative'}}><RasterCover kind={kind} artwork={artwork}
    photo={noPhoto?undefined:'/samples/noor-e-nikah/cover.webp'} groom={noPhoto?undefined:'/samples/noor-e-nikah/groom.webp'} bride={noPhoto?undefined:'/samples/noor-e-nikah/bride.webp'}
    names={query.long==='true'?'Alexandra Putri & Muhammad Rasyid':'Andi & Sinta'} kicker="Undangan Pernikahan" dateText="26 · 12 · 2026"
    guest={{dear:'Kepada Yth.',name:query.long==='true'?'Bapak/Ibu Muhammad Abdurrahman & Keluarga':'Bapak/Ibu/Saudara/i'}} openLabel="Buka undangan" animated={false} decorative/></main>;
}
