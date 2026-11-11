import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import type { CoverProps } from './raster-cover';
vi.mock('./assets/sekar-cover-paper.webp',()=>({default:{src:'/_next/static/media/sekar-cover-paper.webp'}}));
vi.mock('./assets/sekar-cover-divider.webp',()=>({default:{src:'/_next/static/media/sekar-cover-divider.webp'}}));
import { RasterCover } from './raster-cover';

const artwork={designId:'jawa-sekar-keraton',assets:Object.fromEntries(Object.entries({coverBackground:'page-bg',coverPaper:'old-pendopo-paper',coverCanopy:'old-canopy',coverFooter:'old-footer',photoFrame:'old-photo-frame',topDecoration:'mini-kayon',divider:'divider'}).map(([slot,file])=>[slot,{default:{url:`https://cdn.example.com/sekar/${file}.webp`}}]))} as ArtworkManifest;
const props:CoverProps={kind:'bingkai',artwork,photo:'/uploads/couple.webp',names:'Andi & Sinta',kicker:'UNDANGAN PERNIKAHAN',dateText:'28 · 11 · 2026',guest:{dear:'Kepada Yth.',name:'Bapak/Ibu Rahmat & Keluarga'},openLabel:'Buka undangan',onOpen:()=>undefined,animated:false};
const render=(p:Partial<CoverProps>={})=>renderToStaticMarkup(createElement(RasterCover,{...props,...p}));
describe('Sekar cover — approved Bingkai Pusaka',()=>{
  it('upgrades Sekar stationery layouts only',()=>{
    for(const kind of ['ornamen','bingkai','berdua'] as const)expect(render({kind})).toContain('data-cover-design="sekar-bingkai-pusaka"');
    for(const kind of ['penuh','terbagi'] as const)expect(render({kind})).not.toContain('data-cover-design="sekar-bingkai-pusaka"');
    expect(render({artwork:{...artwork,designId:'pusako-minang'}})).not.toContain('data-cover-design="sekar-bingkai-pusaka"');
  });
  it('uses bundled raster artwork, never stacked with the legacy border or frame',()=>{
    const html=render();
    for(const text of ['/_next/static/media/sekar-cover-paper.webp','/_next/static/media/sekar-cover-divider.webp'])expect(html).toContain(text);
    for(const text of ['old-pendopo-paper','old-canopy','old-footer','old-photo-frame','.tmp','/samples/','<svg'])expect(html).not.toContain(text);
  });
  it('preserves real uploaded photos and live invitation data',()=>{
    const html=render();
    for(const text of ['/uploads/couple.webp','aria-label="Andi &amp; Sinta"','28 · 11 · 2026','Bapak/Ibu Rahmat &amp; Keluarga'])expect(html).toContain(text);
    expect(html.indexOf('UNDANGAN PERNIKAHAN')).toBeLessThan(html.indexOf('<figure'));
    expect(render({guest:null,dateText:''})).not.toContain('Kepada Yth.');
  });
  it('handles long names, ornament-only and missing-photo compositions',()=>{
    expect(render({names:'Alexandra Putri & Muhammad Rasyid'})).toContain('data-long="true"');
    for(const p of [{photo:undefined},{kind:'ornamen' as const}]){
      const html=render(p);expect(html).toContain('data-photo="false"');expect(html).not.toContain('<figure');expect(html).toContain('mini-kayon.webp');
    }
  });
  it('uses separate portrait cards for Berdua',()=>{
    const html=render({kind:'berdua',groom:'/uploads/groom.webp',bride:'/uploads/bride.webp'});
    expect(html).toContain('/uploads/groom.webp');expect(html).toContain('/uploads/bride.webp');
    expect((html.match(/<figure/g)||[]).length).toBe(2);
  });
  it('keeps the live action native and catalog thumbnails non-interactive',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    expect(render({decorative:true})).not.toContain('<button');
  });
});
