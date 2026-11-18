import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service.js';
import { buildLegalPolicy, LEGAL_DEFAULTS, legalSettingsSchema } from './legal-policy.js';

const policy = buildLegalPolicy(LEGAL_DEFAULTS, '6282125622542');
function setup() {
  const prepared = { template: { id: 'template' }, invitation: { id: 'invitation' }, coupon: null, media: [], data: {}, sections: [], features: {}, layout: {}, weeks: 4, quote: { templatePrice: 150000, addOnTotal: 0, lines: [], total: 150000 }, discount: 0, total: 150000, addOnRows: new Map() };
  const tx = { order: { create: vi.fn(async (_args: { data: Record<string, unknown> }) => ({ id: 'order' })) }, invitation: { create: vi.fn() } };
  const prisma = { $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(tx)), invitation: { findUnique: vi.fn(async () => null) } };
  const pricing = { prepareNewOrder: vi.fn(async () => prepared), prepareExtension: vi.fn(async () => prepared) };
  const settings = { publicSettings: vi.fn(async () => ({ policy })) };
  const service = new OrdersService(prisma as never, pricing as never, {} as never, {} as never, settings as never);
  vi.spyOn(service, 'getMine').mockResolvedValue({ id: 'order' } as never);
  return { service, pricing, tx, settings };
}
const input = { templateId: 'template', weeks: 4, data: {}, media: [], addOns: [], termsAccepted: true, termsVersion: policy.version };

describe('versioned checkout agreement', () => {
  it('defaults to 100 days and the approved business identity', () => {
    expect(LEGAL_DEFAULTS.draftRetentionDays).toBe(100);
    expect(policy.settings.ownerName).toBe('Ahmad Sucipto');
    expect(policy.sections.flatMap((s) => s.paragraphs).join(' ')).toContain('100 hari');
  });
  it('changes version when identity, retention or contact changes', () => {
    expect(buildLegalPolicy({ ...LEGAL_DEFAULTS, draftRetentionDays: 120 }, policy.supportWhatsapp).version).not.toBe(policy.version);
    expect(buildLegalPolicy({ ...LEGAL_DEFAULTS, ownerName: 'New owner' }, policy.supportWhatsapp).version).not.toBe(policy.version);
    expect(buildLegalPolicy(LEGAL_DEFAULTS, '628111111111').version).not.toBe(policy.version);
    expect(buildLegalPolicy(LEGAL_DEFAULTS, policy.supportWhatsapp).version).toBe(policy.version);
  });
  it.each([0, -1, 1.5, 3651])('rejects unsafe retention %s', (days) => {
    expect(legalSettingsSchema.safeParse({ ...LEGAL_DEFAULTS, draftRetentionDays: days }).success).toBe(false);
  });
  it('rejects executable or non-HTTPS owner URLs', () => {
    expect(legalSettingsSchema.safeParse({ ...LEGAL_DEFAULTS, ownerUrl: 'javascript:alert(1)' }).success).toBe(false);
  });
  it('rejects checkout without explicit consent before any pricing/write', async () => {
    const { service, pricing } = setup();
    await expect(service.createNew('user', { ...input, termsAccepted: false })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createNew('user', { ...input, termsAccepted: undefined })).rejects.toBeInstanceOf(BadRequestException);
    expect(pricing.prepareNewOrder).not.toHaveBeenCalled();
  });
  it('rejects an outdated or omitted version', async () => {
    const { service } = setup();
    await expect(service.createNew('user', { ...input, termsVersion: 'old' })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.createNew('user', { ...input, termsVersion: undefined })).rejects.toBeInstanceOf(ConflictException);
  });
  it('stores server-generated timestamp, user/order association and full snapshot', async () => {
    const { service, tx } = setup();
    await service.createNew('user', input);
    expect(tx.order.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      userId: 'user', termsVersion: policy.version, termsAcceptedAt: expect.any(Date), termsSnapshot: policy, draftRetentionDays: 100,
    }) }));
    expect(tx.order.create.mock.calls[0]?.[0]).not.toHaveProperty('data.draftExpiresAt');
  });
  it('requires consent on extension orders too, without a draft deadline', async () => {
    const { service, tx } = setup();
    await expect(service.createExtension('user', 'invitation', { weeks: 4 })).rejects.toBeInstanceOf(BadRequestException);
    await service.createExtension('user', 'invitation', { weeks: 4, termsAccepted: true, termsVersion: policy.version });
    expect(tx.order.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ kind: 'EXTENSION', termsSnapshot: policy }) }));
    expect(tx.order.create.mock.calls[0]?.[0]).not.toHaveProperty('data.draftRetentionDays');
  });
});
