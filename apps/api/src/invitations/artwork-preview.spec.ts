import { describe, expect, it, vi } from 'vitest';
import { InvitationsService } from './invitations.service.js';
import { normalizeLayout } from '../templates/layout.js';
import { artworkManifestSchema } from '../templates/artwork.js';

describe('purchased botanical invitation artwork responses', () => {
  it.each(['editor', 'preview', 'public'])('includes restored artwork in the %s response without replacing stored layout', async (view) => {
    const layout = normalizeLayout({ theme: { preset: 'garden', motif: 'garden' }, sections: ['cover', 'mempelai'] });
    const original = structuredClone(layout);
    const artwork = artworkManifestSchema.parse({ designId: 'garden', artworkVersion: 1, assets: {
      stationeryBackground: { default: { url: 'https://cdn.example.com/templates/garden/v1/paper.webp', storageKey: 'templates/garden/v1/paper.webp', contentType: 'image/webp', width: 850, height: 1850, sizeBytes: 1000 } },
    } });
    const inv = {
      id: 'invitation', slug: 'private-example', status: 'ACTIVE', layout, data: {}, features: {}, mediaFiles: [],
      template: { name: 'Taman Botani', category: 'klasik', layoutSchema: { artwork } },
      order: { id: 'order', status: 'PAID', paidAt: null, activeWeeks: 4, totalAmount: 150000 },
    };
    const prisma = { invitation: {
      findFirst: vi.fn().mockResolvedValue(inv), findUnique: vi.fn().mockResolvedValue(inv), update: vi.fn().mockResolvedValue(inv),
    } };
    type Args = ConstructorParameters<typeof InvitationsService>;
    const service = new InvitationsService(prisma as unknown as Args[0], {} as Args[1], {} as Args[2], {} as Args[3]);
    const result = view === 'editor' ? await service.getMine('owner', inv.id)
      : view === 'preview' ? await service.previewView('owner', inv.id) : await service.publicView(inv.slug);
    expect(result.layout.artwork).toEqual(artwork);
    expect(inv.layout).toEqual(original);
    const read = view === 'public' ? prisma.invitation.findUnique : prisma.invitation.findFirst;
    expect(read).toHaveBeenCalledWith(expect.objectContaining({ include: expect.objectContaining({ template: { select: expect.objectContaining({ layoutSchema: true }) } }) }));
    if (view !== 'public') expect(prisma.invitation.update).not.toHaveBeenCalled();
    else expect(prisma.invitation.update).toHaveBeenCalledWith({ where: { id: inv.id }, data: { viewCount: { increment: 1 } } });
  });
});
