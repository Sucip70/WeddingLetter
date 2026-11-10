import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { InvitationsService, rsvpSchema, wishSchema } from './invitations.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { LifecycleService } from './lifecycle.service.js';
import type { PricingService } from '../pricing/pricing.service.js';
import type { StorageService } from '../storage/storage.service.js';

function setup(sections = ['buku_tamu','rsvp'], status = 'ACTIVE') {
  const create = vi.fn().mockImplementation(async ({ data }) => ({ ...data, createdAt: new Date('2026-11-04T00:00:00Z') }));
  const findUnique = vi.fn().mockResolvedValue({ id: 'test-invitation', status, layout: { sections: sections.map((id) => ({ id })) } });
  const prisma = { invitation: { findUnique }, rsvpGuest: { create } } as unknown as PrismaService;
  const service = new InvitationsService(prisma, {} as LifecycleService, {} as PricingService, {} as StorageService);
  return { service, create, findUnique };
}

describe('public guest responses', () => {
  it('stores a wish without falsely reporting attendance or guest count', async () => {
    const { service, create } = setup();
    const input = wishSchema.parse({ name: '  Rahmat  ', message: '  Selamat berbahagia!  ' });
    const result = await service.submitWish('wish-ok', input, '127.0.0.1');
    expect(result).toMatchObject({ ok: true, name: 'Rahmat', message: 'Selamat berbahagia!', attending: null, guestCount: 0 });
    expect(create).toHaveBeenCalledWith({ data: { invitationId: 'test-invitation', name: 'Rahmat', message: 'Selamat berbahagia!', attending: null, guestCount: 0 } });
  });
  it('requires an active invitation with guestbook enabled', async () => {
    const disabled = setup(['rsvp']);
    await expect(disabled.service.submitWish('wish-disabled', { name: 'X', message: 'Y' }, '127.0.0.1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(disabled.create).not.toHaveBeenCalled();
    await expect(setup(['buku_tamu'],'EXPIRED').service.submitWish('wish-expired', { name: 'X', message: 'Y' }, '127.0.0.1')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('shares the submission quota between RSVP and wishes', async () => {
    const { service, create } = setup();
    for (let i = 0; i < 5; i++) {
      await service.submitRsvp('quota-shared', rsvpSchema.parse({ name: 'Rahmat', attending: true, guestCount: 2 }), '127.0.0.2');
      await service.submitWish('quota-shared', { name: 'Rahmat', message: 'Selamat!' }, '127.0.0.2');
    }
    await expect(service.submitWish('quota-shared', { name: 'Rahmat', message: 'Lagi' }, '127.0.0.2')).rejects.toBeInstanceOf(HttpException);
    expect(create).toHaveBeenCalledTimes(10);
  });
  it('returns the accepted attendance and count for the confirmation dialog', async () => {
    const { service } = setup();
    const result = await service.submitRsvp('rsvp-response', rsvpSchema.parse({ name: 'Rahmat', attending: false, guestCount: 4 }), '127.0.0.3');
    expect(result).toMatchObject({ ok: true, name: 'Rahmat', attending: false, guestCount: 0 });
  });
  it('rejects blank and oversized wishes', () => {
    expect(wishSchema.safeParse({ name: ' ', message: 'Doa' }).success).toBe(false);
    expect(wishSchema.safeParse({ name: 'Rahmat', message: 'x'.repeat(501) }).success).toBe(false);
  });
});
