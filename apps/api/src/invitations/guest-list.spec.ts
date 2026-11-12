import { describe, expect, it, vi } from 'vitest';
import { GuestListService, guestInput } from './guest-list.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

function setup(owned = true, active = true) {
  const guest = { id: 'g1', invitationId: 'i1', name: 'Budi', token: 'a'.repeat(64), checkedInAt: null, checkedInCount: 0 };
  const prisma = {
    invitation: { findFirst: vi.fn().mockResolvedValue(owned ? { id: 'i1', status: active ? 'ACTIVE' : 'DRAFT', expiresAt: new Date(Date.now() + 86_400_000) } : null) },
    invitationGuest: { findMany: vi.fn().mockResolvedValue([guest]), findFirst: vi.fn().mockResolvedValue(guest), create: vi.fn().mockImplementation(({ data }) => data), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  };
  return { prisma, guest, service: new GuestListService(prisma as unknown as PrismaService) };
}
describe('invitation guest list', () => {
  it('requires ownership of a paid invitation before exposing guests', async () => {
    const { service, prisma } = setup(false);
    await expect(service.list('intruder', 'i1')).rejects.toThrow('Undangan berbayar');
    expect(prisma.invitationGuest.findMany).not.toHaveBeenCalled();
  });
  it('creates unpredictable QR tokens and normalizes optional phone numbers', async () => {
    const { service } = setup();
    const input = guestInput.parse({ name: ' Budi ', phone: '+62 812-3456' });
    const a = await service.create('owner', 'i1', input);
    const b = await service.create('owner', 'i1', input);
    expect(a.name).toBe('Budi'); expect(a.phone).toBe('628123456');
    expect(a.token).toMatch(/^[a-f0-9]{64}$/); expect(a.token).not.toBe(b.token);
  });
  it('does not mark a copied link or WhatsApp opening as shared', async () => {
    const { service, prisma } = setup();
    for (const action of ['copied', 'whatsapp'] as const) {
      await service.activity('owner', 'i1', 'g1', action);
      expect(prisma.invitationGuest.updateMany.mock.lastCall![0].data).not.toHaveProperty('sharedAt');
    }
    await service.activity('owner', 'i1', 'g1', 'shared');
    expect(prisma.invitationGuest.updateMany.mock.lastCall![0].data.sharedAt).toBeInstanceOf(Date);
  });
  it('rejects scans while inactive and QR tokens from another invitation', async () => {
    await expect(setup(true, false).service.lookup('owner', 'i1', 'a'.repeat(64))).rejects.toThrow('undangan aktif');
    const { service, prisma } = setup();
    prisma.invitationGuest.findFirst.mockResolvedValue(null);
    await expect(service.lookup('owner', 'i1', 'b'.repeat(64))).rejects.toThrow('undangan lain');
  });
  it('uses a conditional update to prevent duplicate check-ins', async () => {
    const { service, prisma } = setup();
    prisma.invitationGuest.updateMany.mockResolvedValue({ count: 0 });
    const result = await service.checkin('owner', 'i1', { token: 'a'.repeat(64), count: 3 });
    expect(result.alreadyCheckedIn).toBe(true);
    expect(prisma.invitationGuest.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { token: 'a'.repeat(64), invitationId: 'i1', deletedAt: null, checkedInAt: null } }));
  });
  it('rejects removal of checked-in guests and retains their history', async () => {
    const { service, prisma } = setup();
    prisma.invitationGuest.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('owner', 'i1', 'g1')).rejects.toThrow('sudah check-in');
  });
  it('returns only the name on the public ticket endpoint', async () => {
    const { service, prisma } = setup();
    prisma.invitationGuest.findFirst.mockResolvedValue({ name: 'Budi' });
    expect(await service.publicGuest('slug', 'a'.repeat(64))).toEqual({ name: 'Budi' });
    expect(prisma.invitationGuest.findFirst).toHaveBeenCalledWith(expect.objectContaining({ select: { name: true } }));
  });
});
