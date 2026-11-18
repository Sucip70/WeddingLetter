import { LifecycleService } from './lifecycle.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { MaintenanceService } from '../jobs/maintenance.service.js';

describe('paid unpublished draft retention', () => {
  function paymentSetup(days: number | null, kind = 'NEW') {
    const order = { id: 'order', status: 'PENDING', kind, draftRetentionDays: days, user: {}, activeWeeks: 4, totalAmount: 100, invitation: { id: 'inv' }, extendsInvitationId: kind === 'EXTENSION' ? 'inv' : null };
    const updateMany = vi.fn(async (_args: { data: { paidAt: Date; draftExpiresAt?: Date } }) => ({ count: 1 }));
    const tx = { order: { updateMany } };
    const prisma = { order: { findUnique: vi.fn(async () => order) }, $transaction: vi.fn(async (fn: (db: unknown) => unknown) => fn(tx)) };
    const service = new PaymentsService(prisma as never, { extend: vi.fn() } as never, { paymentReceived: vi.fn() } as never);
    return { service, updateMany };
  }
  it('starts the snapshot duration at payment, not order creation', async () => {
    const { service, updateMany } = paymentSetup(100);
    await service.markPaid('order', { provider: 'MANUAL' });
    const data = updateMany.mock.calls[0]![0].data;
    expect(data.draftExpiresAt!.getTime() - data.paidAt.getTime()).toBe(100 * 86400000);
  });
  it.each([null, 0])('never adds a deadline to legacy order (%s)', async (days) => {
    const { service, updateMany } = paymentSetup(days);
    await service.markPaid('order', { provider: 'MANUAL' });
    expect(updateMany.mock.calls[0]![0].data).not.toHaveProperty('draftExpiresAt');
  });
  it('does not add a draft deadline to an extension', async () => {
    const { service, updateMany } = paymentSetup(100, 'EXTENSION');
    await service.markPaid('order', { provider: 'MANUAL' });
    expect(updateMany.mock.calls[0]![0].data).not.toHaveProperty('draftExpiresAt');
  });
  it('cleanup claims only expired paid drafts, retaining transaction records', async () => {
    const prisma = {
      invitation: { findMany: vi.fn(async () => [{ id: 'inv', status: 'DRAFT' }]), updateMany: vi.fn(async () => ({ count: 1 })) },
      rsvpGuest: { deleteMany: vi.fn() }, invitationGuest: { deleteMany: vi.fn() },
      mediaFile: { findMany: vi.fn(async () => []), update: vi.fn() },
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown): Promise<unknown> => fn(prisma)),
    };
    const service = new LifecycleService(prisma as never, {} as never);
    const now = new Date();
    expect(await service.purgeExpiredDrafts(now)).toBe(1);
    expect(prisma.invitation.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'inv', status: 'DRAFT', publishedAt: null, order: { kind: 'NEW', status: 'PAID', draftExpiresAt: { lte: now } } } }));
    expect(prisma.rsvpGuest.deleteMany).toHaveBeenCalledWith({ where: { invitationId: 'inv' } });
  });
  it('never deletes files when a concurrent publication wins the claim', async () => {
    const prisma = { invitation: { findMany: vi.fn(async () => [{ id: 'inv', status: 'DRAFT' }]), updateMany: vi.fn(async () => ({ count: 0 })) },
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown): Promise<unknown> => fn(prisma)), mediaFile: { findMany: vi.fn() },
    };
    const service = new LifecycleService(prisma as never, {} as never);
    expect(await service.purgeExpiredDrafts()).toBe(0);
    expect(prisma.mediaFile.findMany).not.toHaveBeenCalled();
  });
  it('retries failed object deletion without marking the file deleted', async () => {
    const prisma = { invitation: { findMany: vi.fn(async () => [{ id: 'inv', status: 'DELETED' }]) },
      mediaFile: { findMany: vi.fn(async () => [{ id: 'file', storageKey: 'test-only' }]), update: vi.fn() },
    };
    const storage = { delete: vi.fn(async () => { throw new Error('offline'); }) };
    const service = new LifecycleService(prisma as never, storage as never);
    await service.purgeExpiredDrafts();
    expect(storage.delete).toHaveBeenCalledWith('test-only');
    expect(prisma.mediaFile.update).not.toHaveBeenCalled();
  });
  it('rejects publication after the deadline', async () => {
    const service = new LifecycleService({ invitation: { findUnique: async () => ({ status: 'DRAFT', order: { status: 'PAID', draftExpiresAt: new Date(0) }, mediaFiles: [] }) } } as never, {} as never);
    await expect(service.publish('inv')).rejects.toThrow('Batas penyimpanan draf');
  });
  it.each([2, 10])('sends only the applicable reminder (%s days left)', async (days) => {
    const now = new Date();
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = { invitation: { findMany: async () => [] }, order: { findMany: async () => [{ id: 'order', user: {}, invitation: { id: 'inv' }, draftExpiresAt: new Date(now.getTime() + days * 86400000) }], updateMany } };
    const lifecycle = { expireDue: vi.fn(), purgeDue: vi.fn(), purgeStaleReplacements: vi.fn(), purgeExpiredDrafts: vi.fn() };
    const notifications = { draftExpiryReminder: vi.fn(async () => true) };
    const service = new MaintenanceService(prisma as never, lifecycle as never, { expireStale: vi.fn() } as never, notifications as never);
    const result = await service.run(now);
    expect(result).toHaveProperty('draftReminders', 1);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { [days === 2 ? 'draftReminder3At' : 'draftReminder14At']: now } }));
    expect(notifications.draftExpiryReminder).toHaveBeenCalledTimes(1);
  });
});
