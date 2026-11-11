import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import { ToranGate, hasToranGate } from './toran-gate';
import { Gate } from './gates';
const artwork={designId:'vivaha-rani',assets:{}} as ArtworkManifest;
const props={artwork,phase:'closed' as const,names:'Andi & Sinta',kicker:'Undangan Pernikahan',guest:'Bapak/Ibu Rahmat & Keluarga',onOpen:()=>undefined};
const render=(p:Partial<Parameters<typeof ToranGate>[0]>={})=>renderToStaticMarkup(createElement(ToranGate,{...props,...p}));
describe('Vivaha Pintu Sutra',()=>{
  it('selects only Vivaha without depending on obsolete curtain assets',()=>{
    expect(hasToranGate(artwork,'vivaha-rani')).toBe(true);
    expect(hasToranGate(artwork,'noor-e-nikah')).toBe(false);
    expect(hasToranGate(undefined,'vivaha-rani')).toBe(false);
  });
  it('renders the approved opaque doors and dynamic identity',()=>{
    const html=render();
    for(const text of ['vivaha-gate-doors.webp','Pernikahan','aria-label="Andi &amp; Sinta"','Kepada Yth.','Bapak/Ibu Rahmat &amp; Keluarga'])expect(html).toContain(text);
    for(const text of ['<svg','gate-rosette','gate-panel-left','gate-bg','.tmp'])expect(html).not.toContain(text);
    expect(render({guest:null})).toContain('Bapak/Ibu/Saudara/i');
    expect(render({guest:'   '})).toContain('Bapak/Ibu/Saudara/i');
    expect(render({names:'Alexandra Putri & Muhammad Rasyid'})).toContain('data-long="true"');
  });
  it('uses one accessible native action, disabled during animation and static review',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    for(const p of [{phase:'opening' as const},{previewState:'open' as const},{onOpen:undefined}])expect(render(p)).toMatch(/<button[^>]+disabled=""/);
  });
  it('integrates without nested generic button semantics',()=>{
    const html=renderToStaticMarkup(createElement(Gate,{...props,kind:'toran',embedded:true,pattern:'none',motif:'vivaha-rani',headingFamily:'serif'}));
    expect(html).not.toContain('role="button"');
    expect((html.match(/<button/g)||[]).length).toBe(1);
    expect(html).toContain('data-gate-design="vivaha-pintu-sutra"');
  });
});
