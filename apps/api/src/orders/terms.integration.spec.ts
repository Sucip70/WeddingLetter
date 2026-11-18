import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { OrdersService } from './orders.service.js';
import { LifecycleService } from '../invitations/lifecycle.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { buildLegalPolicy, LEGAL_DEFAULTS } from '../settings/legal-policy.js';

describe.skipIf(process.env.TERMS_DB_TESTS !== '1')('terms and retention database integration', () => {
  const suffix = randomUUID();
  const userId = `terms-test-user-${suffix}`;
  const templateId = `terms-test-template-${suffix}`;
  let db: PrismaClient;
  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL!;
    if (!['localhost', '127.0.0.1'].includes(new URL(connectionString).hostname)) throw new Error('Local database only');
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    await db.user.create({ data: { id: userId, name: 'Terms Test', email: `${suffix}@example.invalid` } });
    await db.template.create({ data: { id: templateId, name: 'Terms Test', category: 'klasik', tier: 'BASIC', price: 100, layoutSchema: {} } });
  });
  afterAll(async () => {
    if (!db) return;
    try {
      const orders = await db.order.findMany({ where: { userId }, select: { id: true } });
      await db.$transaction([
        db.invitation.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } }),
        db.order.deleteMany({ where: { userId } }),
        db.template.deleteMany({ where: { id: templateId } }),
        db.user.deleteMany({ where: { id: userId } }),
      ]);
    } finally { await db.$disconnect(); }
  });
  it('persists acceptance and frozen retention on new orders; legacy orders remain unaffected', async () => {
    let policy = buildLegalPolicy(LEGAL_DEFAULTS, '6282125622542');
    const prepared = { template: { id: templateId }, coupon: null, media: [], data: {}, sections: [], features: {}, layout: {}, weeks: 4, quote: { templatePrice: 100, addOnTotal: 0, lines: [] }, discount: 0, total: 100, addOnRows: new Map() };
    const lifecycle = new LifecycleService(db as never, {} as never);
    const orders = new OrdersService(db as never, { prepareNewOrder: async () => prepared } as never, {} as never, lifecycle, { publicSettings: async () => ({ policy }) } as never);
    const input = { templateId, weeks: 4, data: {}, media: [], addOns: [], termsAccepted: true, termsVersion: policy.version };
    const first = await orders.createNew(userId, input);
    expect(first.order.agreement?.version).toBe(policy.version);
    expect(first.order.agreement?.acceptedAt).toBeInstanceOf(Date);
    expect(first.order.draftExpiresAt).toBeNull();
    policy = buildLegalPolicy({ ...LEGAL_DEFAULTS, draftRetentionDays: 120, ownerName: 'Changed Test Owner' }, '6282125622542');
    await expect(orders.createNew(userId, input)).rejects.toThrow('Ketentuan telah diperbarui');
    const second = await orders.createNew(userId, { ...input, termsVersion: policy.version });
    const payments = new PaymentsService(db as never, lifecycle, { paymentReceived: vi.fn() } as never);
    await payments.markPaid(first.order.id, { provider: 'DEV' });
    await payments.markPaid(second.order.id, { provider: 'DEV' });
    const a = await db.order.findUniqueOrThrow({ where: { id: first.order.id } });
    const b = await db.order.findUniqueOrThrow({ where: { id: second.order.id } });
    expect(a.draftExpiresAt!.getTime() - a.paidAt!.getTime()).toBe(100 * 86400000);
    expect(b.draftExpiresAt!.getTime() - b.paidAt!.getTime()).toBe(120 * 86400000);
    expect(a.termsVersion).not.toBe(b.termsVersion);
    expect((a.termsSnapshot as { settings: { ownerName: string } }).settings.ownerName).toBe('Ahmad Sucipto');
    const deadline = a.draftExpiresAt!.toISOString();
    await payments.markPaid(a.id, { provider: 'DEV' });
    expect((await db.order.findUniqueOrThrow({ where: { id: a.id } })).draftExpiresAt!.toISOString()).toBe(deadline);
    const legacy = await db.order.create({ data: { userId, templateId, subtotal: 100, totalAmount: 100, status: 'PENDING' } });
    await payments.markPaid(legacy.id, { provider: 'DEV' });
    expect((await db.order.findUniqueOrThrow({ where: { id: legacy.id } })).draftExpiresAt).toBeNull();
  });
});
