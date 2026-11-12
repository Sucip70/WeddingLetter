import { describe, expect, it } from 'vitest';
import { homeShowcase } from './catalog';
import type { Template } from './types';

const row = (id: string, design: string, options: Partial<Template> = {}): Template => ({
  id, name: id, category: 'suku', tier: 'PREMIUM', price: 100000, includedWeeks: 4,
  status: 'PUBLISHED', thumbnailUrl: null, design: { id: design, name: design, group: 'suku', blurb: '' },
  layout: {} as Template['layout'], ...options,
});

describe('homeShowcase', () => {
  it('only shows explicitly selected, published themes', () => {
    expect(homeShowcase([
      row('hidden', 'hidden'), row('draft', 'draft', { showOnHome: true, status: 'DRAFT' }),
      row('archived', 'archived', { showOnHome: true, status: 'ARCHIVED' }),
      row('selected', 'jawa', { showOnHome: true }),
    ]).map((e) => e.key)).toEqual(['jawa']);
  });
  it('deduplicates designs while preserving published tiers and starting price', () => {
    const entries = homeShowcase([
      row('premium', 'jawa', { showOnHome: true, homeOrder: 5 }),
      row('basic', 'jawa', { tier: 'BASIC', price: 20000, showOnHome: true, homeOrder: 2 }),
      row('standard', 'jawa', { tier: 'STANDARD', price: 50000 }),
      row('bali', 'bali', { showOnHome: true, homeOrder: 3 }),
    ]);
    expect(entries.map((e) => e.key)).toEqual(['jawa', 'bali']);
    expect(entries[0].rows.map((t) => t.id)).toEqual(['basic', 'standard', 'premium']);
  });
  it('uses stable ordering for ties and never auto-fills unselected themes', () => {
    expect(homeShowcase([row('b', 'b', { showOnHome: true }), row('a', 'a', { showOnHome: true })]).map((e) => e.key)).toEqual(['a', 'b']);
    expect(homeShowcase([row('a', 'a')])).toEqual([]);
  });
});
