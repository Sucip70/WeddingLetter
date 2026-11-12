import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { GuestListService } from './guest-list.service.js';

// Opt in explicitly. Fixture data is isolated by random IDs and removed afterwards.
describe.skipIf(process.env.GUEST_DB_TESTS !== '1')('guest list database integration', () => {
  const suffix = randomUUID();
  const userId = `guest-test-user-${suffix}`;
  const templateId = `guest-test-template-${suffix}`;
  const orderId = `guest-test-order-${suffix}`;
  const invitationId = `guest-test-invitation-${suffix}`;
  let prisma: PrismaClient;
  let service: GuestListService;
  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL!;
    if (!['localhost', '127.0.0.1'].includes(new URL(connectionString).hostname)) throw new Error('Guest integration tests require a localhost database');
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    service = new GuestListService(prisma as unknown as PrismaService);
    await prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { id: userId, name: 'Guest Test Owner', email: `${suffix}@example.invalid` } });
      await tx.template.create({ data: { id: templateId, name: 'Guest Test Template', category: 'klasik', tier: 'BASIC', price: 0, layoutSchema: {} } });
      await tx.order.create({ data: { id: orderId, userId, templateId, subtotal: 0, totalAmount: 0, status: 'PAID' } });
      await tx.invitation.create({ data: { id: invitationId, orderId, templateId, slug: `guest-test-${suffix}`, data: {}, status: 'ACTIVE', expiresAt: new Date(Date.now() + 86_400_000) } });
    });
  });
  afterAll(async () => {
    if (!prisma) return;
    try {
      await prisma.$transaction([
        prisma.invitationGuest.deleteMany({ where: { invitationId } }),
        prisma.invitation.deleteMany({ where: { id: invitationId } }),
        prisma.order.deleteMany({ where: { id: orderId } }),
        prisma.template.deleteMany({ where: { id: templateId } }),
        prisma.user.deleteMany({ where: { id: userId } }),
      ]);
    } finally { await prisma.$disconnect(); }
  });
  it('keeps guest sharing and check-in persistent and prevents a concurrent double count', async () => {
    const guest = await service.create(userId, invitationId, { name: 'Keluarga Budi', phone: '62812345', partySize: 3 });
    await expect(service.list('another-user', invitationId)).rejects.toThrow('Undangan berbayar');
    await service.activity(userId, invitationId, guest.id, 'copied');
    expect((await service.list(userId, invitationId))[0]!.sharedAt).toBeNull();
    await service.activity(userId, invitationId, guest.id, 'shared');
    expect((await service.list(userId, invitationId))[0]!.sharedAt).toBeInstanceOf(Date);
    expect(await service.publicGuest(`guest-test-${suffix}`, guest.token)).toEqual({ name: 'Keluarga Budi' });
    const results = await Promise.all([1, 3].map((count) => service.checkin(userId, invitationId, { token: guest.token, count })));
    expect(results.filter((r) => !r.alreadyCheckedIn)).toHaveLength(1);
    expect(results.filter((r) => r.alreadyCheckedIn)).toHaveLength(1);
    const saved = (await service.list(userId, invitationId))[0]!;
    expect([1, 3]).toContain(saved.checkedInCount);
    await service.checkin(userId, invitationId, { token: guest.token, count: 50 });
    expect((await service.list(userId, invitationId))[0]!.checkedInCount).toBe(saved.checkedInCount);
    await expect(service.remove(userId, invitationId, guest.id)).rejects.toThrow('sudah check-in');
  });
});
