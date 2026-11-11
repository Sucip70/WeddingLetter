import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TemplateThumb } from './template-thumb';
import { usesLiveCulturalThumbnail } from './invitation/cultural-template-thumb';
import type { ArtworkManifest, GateSetting, Theme } from '../lib/types';

const designs: [string, GateSetting][] = [
  ['jawa-sekar-keraton','kayon'], ['pusako-minang','gonjong'], ['horas-nauli','ulos'],
  ['pawiwahan-agung','paras'], ['hong-xi','lentera'], ['noor-e-nikah','jali'], ['vivaha-rani','toran'],
];
function theme(designId:string,gate:GateSetting):Theme {
  return {preset:designId,motif:designId,gate,fx:'premium',primary:'#751d2d',secondary:'#b58a36',background:'#f8efdd',text:'#332722',headingFont:'serif',bodyFont:'source'};
}
function artwork(designId:string):ArtworkManifest {
  return {designId,assets:Object.fromEntries(['gateBackground','gateForeground','gateTransition','gateInteractive','cardFrame','cornerTopLeft','divider','topDecoration','bottomDecoration','photoFrame','coverBackground','pageBackground'].map(slot=>[slot,{default:{url:`https://assets.example/${designId}/${slot}.webp`}}]))} as ArtworkManifest;
}
const render=(id:string,gate:GateSetting='none',imageUrl='https://assets.example/obsolete-thumbnail.webp')=>renderToStaticMarkup(createElement(TemplateThumb,{theme:theme(id,gate),artwork:artwork(id),imageUrl,coverLayouts:['ornamen'],phone:true}));

describe('cultural catalog thumbnails match the live invitation',()=>{
  it.each(designs)('renders the real %s gate instead of stale uploaded artwork', (id, gate)=>{
    const html=render(id,gate);
    expect(html).toContain('data-cultural-thumbnail="gate"');
    expect(html).not.toContain('obsolete-thumbnail');
    expect(html).toContain('Andi');
    expect(html).toContain('Sinta');
    expect(html).toContain('Kepada Yth.');
    expect(html).toContain('inert=""');
  });
  it.each(designs)('uses the real %s cover when the package has no gate',id=>{
    const html=render(id);
    expect(html).toContain('data-cultural-thumbnail="cover"');
    expect(html).not.toContain('wl-gate-host');
    expect(html).not.toContain('obsolete-thumbnail');
  });
  it('uses the revised gate compositions',()=>{
    expect(render('pusako-minang','gonjong')).toContain('data-gate-design="surat-bersegel"');
    expect(render('pawiwahan-agung','paras')).toContain('data-gate-design="prada-terpusat"');
    expect(render('hong-xi','lentera')).toContain('data-gate-design="angpao-merah"');
    expect(render('noor-e-nikah','jali')).toContain('data-gate-design="lengkung-gading"');
    expect(render('vivaha-rani','toran')).toContain('data-gate-design="vivaha-pintu-sutra"');
  });
  it('preserves manual thumbnails for other categories and mismatched manifests',()=>{
    expect(render('semi')).toContain('obsolete-thumbnail');
    expect(usesLiveCulturalThumbnail(undefined,theme('hong-xi','lentera'))).toBe(false);
    expect(usesLiveCulturalThumbnail('hong-xi',theme('noor-e-nikah','jali'))).toBe(false);
  });
});
