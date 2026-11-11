import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';

import { LenteraGate, hasLenteraGate } from './lentera-gate';
import { Gate } from './gates';

const artwork = {
  designId: 'hong-xi',
  assets: Object.fromEntries(Object.entries({gateBackground:'page-bg', cornerTopLeft:'lanterns', gateInteractive:'xi', divider:'divider'})
    .map(([slot,file])=>[slot,{default:{url:`/themes/hong-xi/${file}.webp`}}])),
} as ArtworkManifest;
const props = { artwork, phase:'closed' as const, names:'Andi & Sinta', kicker:'UNDANGAN PERNIKAHAN', guest:null,
  dateText:'Sabtu, 26 Desember 2026', onOpen:()=>undefined };
const render = (overrides:Partial<Parameters<typeof LenteraGate>[0]>={}) => renderToStaticMarkup(createElement(LenteraGate,{...props,...overrides}));

describe('Hong Xi — Angpao Merah',()=>{
  it('selects only a complete Hong Xi gate',()=>{
    expect(hasLenteraGate(artwork,'hong-xi')).toBe(true);
    expect(hasLenteraGate(artwork,'pawiwahan-agung')).toBe(false);
    expect(hasLenteraGate(undefined,'hong-xi')).toBe(false);
    expect(hasLenteraGate({...artwork,assets:{...artwork.assets,gateInteractive:undefined}},'hong-xi')).toBe(false);
  });
  it('uses one unmirrored xi above the letter and a separate cloud inside the CTA',()=>{
    const html=render();
    expect((html.match(/<img[^>]+src="\/themes\/hong-xi\/xi.webp"/g)||[]).length).toBe(1);
    expect((html.match(/<img[^>]+src="\/themes\/hong-xi\/lanterns.webp"/g)||[]).length).toBe(2);
    expect(html.indexOf('src="/themes/hong-xi/xi.webp"')).toBeLessThan(html.indexOf('<h1'));
    expect(html).toMatch(/<button[^>]*><img[^>]+hong-xi-cloud.webp/);
    expect(html).not.toContain('<svg');
  });
  it('renders live names, date and recipient without sample data',()=>{
    const html=render({guest:'Ibu Ratna & Keluarga'});
    expect(html).toContain('aria-label="Andi &amp; Sinta"');
    expect(html).toContain('Sabtu, 26 Desember 2026');
    expect(html).toContain('Ibu Ratna &amp; Keluarga');
    expect(html).not.toContain('Rahmat');
    expect(render({guest:'  '})).toContain('Bapak/Ibu/Saudara/i');
    expect(render({dateText:undefined})).not.toContain('26 Desember');
  });
  it('supports the long Indonesian name case',()=>{
    const html=render({names:'Alexandra Putri & Muhammad Rasyid'});
    expect(html).toContain('data-long="true"');
    expect(html).toContain('Alexandra Putri');
    expect(html).toContain('Muhammad Rasyid');
  });
  it('has one native button and makes the opening/static-open state inert',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    expect(render({phase:'opening'})).toContain('inert=""');
    expect(render({phase:'opening'})).toMatch(/<button[^>]+disabled=""/);
    expect(render({previewState:'open'})).toContain('inert=""');
    expect(render({onOpen:undefined})).toMatch(/<button[^>]+disabled=""/);
  });
  it('does not nest the native CTA inside a generic button',()=>{
    const html=renderToStaticMarkup(createElement(Gate,{...props,kind:'lentera',embedded:true,pattern:'none',motif:'hong-xi',headingFamily:'serif'}));
    expect(html).not.toContain('role="button"');
    expect((html.match(/<button/g)||[]).length).toBe(1);
    expect(html).toContain('Sabtu, 26 Desember 2026');
    expect(html).toContain('Buka undangan</span>');
  });
  it('preserves manifest/CDN sources',()=>{
    const custom={...artwork,assets:{...artwork.assets,gateBackground:{mobile:{url:'https://cdn.example.com/paper.webp'}},gateInteractive:{default:{url:'https://cdn.example.com/xi.webp'}}}} as ArtworkManifest;
    expect(render({artwork:custom})).toContain('https://cdn.example.com/paper.webp');
    expect(render({artwork:custom})).toContain('https://cdn.example.com/xi.webp');
  });
});
