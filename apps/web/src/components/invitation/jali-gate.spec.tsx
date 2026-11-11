import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import { JaliGate, hasJaliGate } from './jali-gate';
import { Gate } from './gates';
const artwork={designId:'noor-e-nikah',assets:Object.fromEntries(Object.entries({cardFrame:'info-card',gateInteractive:'gate-rosette',divider:'divider',bottomDecoration:'inlay'}).map(([slot,file])=>[slot,{default:{url:`https://cdn.example.com/noor/${file}.webp`}}]))} as ArtworkManifest;
const props={artwork,phase:'closed' as const,names:'Andi & Sinta',kicker:'UNDANGAN PERNIKAHAN',guest:null,dateText:'26 . 12 . 2026',onOpen:()=>undefined};
const render=(p:Partial<Parameters<typeof JaliGate>[0]>={})=>renderToStaticMarkup(createElement(JaliGate,{...props,...p}));
describe('Noor gate — Lengkung Gading',()=>{
  it('selects Noor only when its new letter and seal exist',()=>{
    expect(hasJaliGate(artwork,'noor-e-nikah')).toBe(true);
    expect(hasJaliGate(artwork,'hong-xi')).toBe(false);
    expect(hasJaliGate(undefined,'noor-e-nikah')).toBe(false);
    expect(hasJaliGate({...artwork,assets:{...artwork.assets,cardFrame:undefined}},'noor-e-nikah')).toBe(false);
  });
  it('uses mirrored identical edge art, not the old full doorway panels',()=>{
    const html=render();
    expect((html.match(/<img[^>]+noor-gate-jali.webp/g)||[]).length).toBe(2);
    expect(html).toContain('noor-gate-cloth.webp');
    expect(html).not.toContain('gate-panel-right');
    expect(html).not.toContain('<svg');
  });
  it('renders live couple, date and recipient with neutral missing-recipient fallback',()=>{
    const html=render({guest:'Ibu Ratna & Keluarga'});
    expect(html).toContain('aria-label="Andi &amp; Sinta"');
    expect(html).toContain('26 . 12 . 2026');
    expect(html).toContain('Ibu Ratna &amp; Keluarga');
    expect(render({guest:'  '})).toContain('Bapak/Ibu/Saudara/i');
    expect(render({dateText:undefined})).not.toContain('26 . 12 . 2026');
  });
  it('supports long Indonesian names and manifest/CDN artwork',()=>{
    const html=render({names:'Alexandra Putri & Muhammad Rasyid'});
    expect(html).toContain('data-long="true"');
    expect(html).toContain('Muhammad Rasyid');
    expect(html).toContain('https://cdn.example.com/noor/info-card.webp');
    expect(html).toContain('https://cdn.example.com/noor/gate-rosette.webp');
  });
  it('provides one native CTA and disables it during opening or static review',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    expect(render({phase:'opening'})).toMatch(/<button[^>]+disabled=""/);
    expect(render({previewState:'open'})).toContain('inert=""');
    expect(render({onOpen:undefined})).toMatch(/<button[^>]+disabled=""/);
  });
  it('integrates without a nested generic button and passes the real date',()=>{
    const html=renderToStaticMarkup(createElement(Gate,{...props,kind:'jali',embedded:true,pattern:'none',motif:'noor-e-nikah',headingFamily:'serif'}));
    expect(html).not.toContain('role="button"');
    expect((html.match(/<button/g)||[]).length).toBe(1);
    expect(html).toContain('data-gate-design="lengkung-gading"');
    expect(html).toContain('26 . 12 . 2026');
  });
});
