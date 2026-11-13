import { describe, expect, it } from 'vitest';
import { purchasedInvitationPreview } from './purchased-invitation-preview';
import type { InvitationDetail, InvitationMedia, Layout } from './types';

function fixture(designId = 'garden'): InvitationDetail {
  const layout: Layout = {
    theme: { preset: designId, motif: designId, fx: 'premium', primary: '#284d3b', secondary: '#a58e5c', background: '#f5f1e6', text: '#264536', headingFont: 'serif', bodyFont: 'source' },
    sections: [], musik: { allowed: true, presets: [] }, galeri: { maxPhotos: 20, maxVideos: 1 }, palettes: [],
    coverLayouts: ['ornamen', 'bingkai', 'terbagi'], coverDefault: 'bingkai',
    artwork: { designId, schemaVersion: 1, artworkVersion: 1, assets: {
      stationeryBackground: { default: { url: `https://media-staging.weddingletter.id/templates/${designId}/v1/paper.webp`, storageKey: `templates/${designId}/v1/paper.webp`, contentType: 'image/webp', width: 1000, height: 2176, sizeBytes: 336832 } },
    } } as Layout['artwork'],
  };
  return { id: 'purchased', slug: 'purchased', status: 'ACTIVE', templateName: designId, layout, data: {}, features: {},
    media: [], publishedAt: null, expiresAt: null, pausedAt: null, remainingDays: null, viewCount: 0,
    order: { id: 'paid-order', status: 'PAID', paidAt: null, activeWeeks: 4, totalAmount: 150000 }, refundEligible: false,
  };
}

describe('purchased invitation dashboard preview', () => {
  it.each(['garden', 'lavender', 'wisteria', 'marigold', 'hortensia', 'jawa-sekar-keraton'])(
    'passes the %s artwork snapshot from the API to the renderer', (designId) => {
      const inv = fixture(designId);
      const view = purchasedInvitationPreview(inv, inv.data, inv.layout.theme);
      expect(view.layout).toEqual(inv.layout);
      expect(view.layout.artwork).toBe(inv.layout.artwork);
      expect(view.layout.artwork?.assets.stationeryBackground?.default?.url).toContain(`/${designId}/v1/paper.webp`);
    },
  );
  it('keeps artwork and other layout metadata while applying draft colors and content', () => {
    const inv = fixture();
    const before = structuredClone(inv);
    const theme = { ...inv.layout.theme, primary: '#123456' };
    const data = { mempelai: { pria_nama: 'Ahmad', wanita_nama: 'Grace' } };
    const view = purchasedInvitationPreview(inv, data, theme);
    expect(view.data).toBe(data);
    expect(view.layout.theme).toBe(theme);
    expect(view.layout.artwork).toBe(inv.layout.artwork);
    expect(inv).toEqual(before);
  });
  it('retains media eligibility and RSVP behavior without depending on artwork', () => {
    const inv = fixture();
    delete inv.layout.artwork;
    inv.layout.sections = [{ id: 'rsvp', title: 'RSVP', fields: [] }];
    inv.media = ['UPLOADED', 'ACTIVE', 'PAUSED', 'EXPIRED_GRACE', 'DELETED', 'PENDING'].map((status): InvitationMedia => ({
      id: status, status, url: `/${status}.webp`, type: 'PHOTO', sizeBytes: 1000, included: true,
      rentedWeeks: 0, expiresAt: null, remainingDays: null,
    }));
    const view = purchasedInvitationPreview(inv, inv.data, inv.layout.theme);
    expect(Object.keys(view.media)).toEqual(['UPLOADED', 'ACTIVE', 'PAUSED', 'EXPIRED_GRACE']);
    expect(view.rsvpEnabled).toBe(true);
    expect(view.layout.artwork).toBeUndefined();
  });
});
