import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ArtworkManifest } from '../../lib/types';
import { CandiGate, hasCandiGate } from './candi-gate';

const artwork = {
  designId: 'pawiwahan-agung',
  assets: Object.fromEntries(Object.entries({
    gateBackground: 'gate-bg', gateTransition: 'gate-panel-left', gateForeground: 'gate-panel-right',
    gateInteractive: 'gate-tab', divider: 'divider',
  }).map(([slot,file]) => [slot,{default:{url:`/themes/pawiwahan-agung/${file}.webp`}}])),
} as ArtworkManifest;
const render = (props: Partial<Parameters<typeof CandiGate>[0]> = {}) => renderToStaticMarkup(createElement(CandiGate,{
  artwork, phase:'closed', names:'Andi & Sinta', kicker:'UNDANGAN PERNIKAHAN',
  guest:null, dateText:'26 . 12 . 2026', onOpen:()=>undefined, ...props,
}));

describe('Pawiwahan Agung — Prada Terpusat',()=>{
  it('selects only a complete Pawiwahan gate',()=>{
    expect(hasCandiGate(artwork,'pawiwahan-agung')).toBe(true);
    expect(hasCandiGate(artwork,'pusako-minang')).toBe(false);
    expect(hasCandiGate(undefined,'pawiwahan-agung')).toBe(false);
    expect(hasCandiGate({...artwork,assets:{...artwork.assets,gateInteractive:undefined}},'pawiwahan-agung')).toBe(false);
  });
  it('uses the identical panel source on both sides, never stacking the old asymmetric right panel',()=>{
    const html=render();
    expect((html.match(/<img[^>]+src="\/themes\/pawiwahan-agung\/gate-panel-left.webp"/g)||[]).length).toBe(2);
    expect(html).not.toContain('gate-panel-right.webp');
    expect(html).not.toContain('<svg');
  });
  it('keeps the couple, real date and recipient as live text',()=>{
    const html=render({guest:'Ibu Ratna & Keluarga'});
    expect(html).toContain('Andi &amp; Sinta');
    expect(html).toContain('26 . 12 . 2026');
    expect(html).toContain('Ibu Ratna &amp; Keluarga');
    expect(html).not.toContain('Rahmat');
  });
  it('uses a neutral recipient fallback and does not invent an event date',()=>{
    expect(render()).toContain('Bapak/Ibu/Saudara/i');
    expect(render({guest:'   '})).toContain('Bapak/Ibu/Saudara/i');
    expect(render({dateText:undefined})).not.toContain('26 . 12 . 2026');
  });
  it('supports the approved long-name example',()=>{
    const html=render({names:'Alexandra Putri & Muhammad Rasyid'});
    expect(html).toContain('data-long="true"');
    expect(html).toContain('Alexandra Putri &amp; Muhammad Rasyid');
  });
  it('provides one native button and disables it for opening or static review',()=>{
    expect((render().match(/<button/g)||[]).length).toBe(1);
    expect(render()).not.toContain('role="button"');
    expect(render({phase:'opening'})).toMatch(/<button[^>]+disabled=""/);
    expect(render({previewState:'open'})).toContain('inert=""');
    expect(render({onOpen:undefined})).toMatch(/<button[^>]+disabled=""/);
  });
  it('respects custom CDN source URLs while retaining mirrored composition',()=>{
    const custom={...artwork,assets:{...artwork.assets,gateBackground:{default:{url:'https://cdn.example.com/stone.webp'}},gateTransition:{mobile:{url:'https://cdn.example.com/left.webp'}},gateInteractive:{default:{url:'https://cdn.example.com/prada.webp'}}}} as ArtworkManifest;
    expect(render({artwork:custom})).toContain('https://cdn.example.com/stone.webp');
    expect(render({artwork:custom})).not.toContain('/themes/pawiwahan-agung/prada-terpusat-01/');
    expect(render({artwork:custom})).toContain('https://cdn.example.com/left.webp');
    expect(render({artwork:custom})).toContain('https://cdn.example.com/prada.webp');
  });
});
