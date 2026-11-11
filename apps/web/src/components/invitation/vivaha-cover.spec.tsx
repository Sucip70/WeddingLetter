import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import type { CoverProps } from './raster-cover';
vi.mock('./assets/vivaha-cover-paper.webp',()=>({default:{src:'/_next/static/media/vivaha-cover-paper.webp'}}));
import { RasterCover } from './raster-cover';

const artwork={designId:'vivaha-rani',assets:Object.fromEntries(Object.entries({coverBackground:'page-bg',photoFrame:'photo-frame',topDecoration:'marker',divider:'divider'}).map(([slot,file])=>[slot,{default:{url:`https://cdn.example.com/vivaha/${file}.webp`}}]))} as ArtworkManifest;
const props:CoverProps={kind:'bingkai',artwork,photo:'/uploads/couple.webp',names:'Andi & Sinta',kicker:'UNDANGAN PERNIKAHAN',dateText:'26 · 12 · 2026',guest:{dear:'Kepada Yth.',name:'Ibu Ratna & Keluarga'},openLabel:'Buka undangan',onOpen:()=>undefined,animated:false};
const render=(p:Partial<CoverProps>={})=>renderToStaticMarkup(createElement(RasterCover,{...props,...p}));
describe('Vivaha approved cover',()=>{
  it('upgrades stationery layouts only and leaves other themes untouched',()=>{
    for(const kind of ['ornamen','bingkai','berdua'] as const)expect(render({kind})).toContain('data-cover-design="vivaha-zardozi"');
    for(const kind of ['penuh','terbagi'] as const)expect(render({kind})).not.toContain('data-cover-design="vivaha-zardozi"');
    expect(render({artwork:{...artwork,designId:'sekar-keraton'}})).not.toContain('data-cover-design="vivaha-zardozi"');
  });
  it('uses bundled text-free raster, live copy and the real uploaded photo',()=>{
    const html=render();
    for(const text of ['vivaha-cover-paper.webp','/uploads/couple.webp','aria-label="Andi &amp; Sinta"','Ibu Ratna &amp; Keluarga','26 · 12 · 2026','https://cdn.example.com/vivaha/photo-frame.webp'])expect(html).toContain(text);
    for(const text of ['.tmp','/samples/','<svg'])expect(html).not.toContain(text);
  });
  it('supports long names, omitted data, no photo, and independent portraits',()=>{
    expect(render({names:'Alexandra Putri & Muhammad Rasyid'})).toContain('data-long="true"');
    expect(render({photo:undefined})).toContain('data-photo="false"');
    expect(render({kind:'ornamen'})).not.toContain('<figure');
    expect(render({guest:null,dateText:''})).not.toContain('Kepada Yth.');
    const duo=render({kind:'berdua',groom:'/uploads/groom.webp',bride:'/uploads/bride.webp'});
    expect(duo).toContain('/uploads/groom.webp');expect(duo).toContain('/uploads/bride.webp');
    expect((duo.match(/<figure/g)||[]).length).toBe(2);
  });
  it('keeps thumbnails non-interactive',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    expect(render({decorative:true})).not.toContain('<button');
  });
});
