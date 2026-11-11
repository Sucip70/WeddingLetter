import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import type { CoverProps } from './raster-cover';
vi.mock('./assets/noor-cover-paper.webp',()=>({default:{src:'/_next/static/media/noor-cover-paper.webp',width:851,height:1848}}));
import { RasterCover } from './raster-cover';

const artwork={designId:'noor-e-nikah',assets:Object.fromEntries(Object.entries({coverBackground:'page-bg',photoFrame:'photo-frame',topDecoration:'marker',divider:'divider'}).map(([slot,file])=>[slot,{default:{url:`https://cdn.example.com/noor/${file}.webp`}}]))} as ArtworkManifest;
const props:CoverProps={kind:'bingkai',artwork,photo:'/uploads/user-photo.webp',names:'Andi & Sinta',kicker:'UNDANGAN PERNIKAHAN',dateText:'26 . 12 . 2026',guest:{dear:'Kepada Yth.',name:'Ibu Ratna & Keluarga'},openLabel:'Buka undangan',onOpen:()=>undefined,animated:false};
const render=(p:Partial<CoverProps>={})=>renderToStaticMarkup(createElement(RasterCover,{...props,...p}));

describe('Noor cover — approved ivory inlay',()=>{
  it('routes only the approved Noor stationery layouts to the upgraded cover',()=>{
    for(const kind of ['ornamen','bingkai','berdua'] as const)expect(render({kind})).toContain('data-cover-design="noor-inlay-ivory"');
    expect(render({artwork:{...artwork,designId:'hong-xi'}})).not.toContain('data-cover-design="noor-inlay-ivory"');
    expect(render({kind:'penuh'})).not.toContain('data-cover-design="noor-inlay-ivory"');
    expect(render({kind:'terbagi'})).not.toContain('data-cover-design="noor-inlay-ivory"');
  });
  it('uses the bundled background without relying on ignored public files',()=>{
    const html=render();
    expect(html).toContain('/_next/static/media/noor-cover-paper.webp');
    expect(html).not.toContain('.tmp');
    expect(html).not.toContain('<svg');
  });
  it('keeps live data and uploaded photos separate from artwork',()=>{
    const html=render();
    expect(html).toContain('/uploads/user-photo.webp');
    expect(html).toContain('aria-label="Andi &amp; Sinta"');
    expect(html).toContain('Ibu Ratna &amp; Keluarga');
    expect(html).toContain('26 . 12 . 2026');
    expect(html).toContain('https://cdn.example.com/noor/photo-frame.webp');
    expect(html).not.toContain('/samples/');
    expect(render({dateText:'',guest:null})).not.toContain('Kepada Yth.');
  });
  it('honors a future manifest-backed coverPaper replacement',()=>{
    expect(render({artwork:{...artwork,assets:{...artwork.assets,coverPaper:{mobile:{url:'https://cdn.example.com/new-paper.webp',contentType:'image/webp',width:851,height:1848,sizeBytes:326186}}}}})).toContain('https://cdn.example.com/new-paper.webp');
  });
  it('supports long names, no photos and separate portrait cards',()=>{
    expect(render({names:'Alexandra Putri & Muhammad Rasyid'})).toContain('data-long="true"');
    const noPhoto=render({photo:undefined});
    expect(noPhoto).toContain('data-photo="false"');
    expect(noPhoto).not.toContain('<figure');
    expect(noPhoto).toContain('/marker.webp');
    const duo=render({kind:'berdua',groom:'/uploads/a.webp',bride:'/uploads/b.webp'});
    expect(duo).toContain('/uploads/a.webp');expect(duo).toContain('/uploads/b.webp');
    expect((duo.match(/<figure/g)||[]).length).toBe(2);
  });
  it('retains a native action but uses a non-interactive label in catalog thumbnails',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    expect(render({decorative:true})).not.toContain('<button');
    expect(render({decorative:true})).toContain('Buka undangan</span>');
  });
});
