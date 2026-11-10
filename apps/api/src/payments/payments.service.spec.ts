import { createHash } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MidtransProvider } from './midtrans.provider.js';
import { PaymentsService } from './payments.service.js';

const SERVER_KEY = 'SB-Mid-server-test';
const sign = (orderId: string, status: string, gross: string) =>
  createHash('sha512').update(`${orderId}${status}${gross}${SERVER_KEY}`).digest('hex');

function setup(
  order: { id: string; totalAmount: number } | null = { id: 'ord1', totalAmount: 53_120 },
  attempt: { id: string; orderId: string; providerOrderId: string; status: string } | null = null,
) {
  const paymentAttempt = {
    findUnique: vi.fn(async () => attempt),
    update: vi.fn(async () => attempt),
    updateMany: vi.fn(async () => ({ count: attempt ? 1 : 0 })),
    findMany: vi.fn(async () => []),
  };
  const prisma = { order: { findUnique: async () => order }, paymentAttempt };
  const service = new PaymentsService(prisma as never, {} as never, {} as never);
  const markPaid = vi.spyOn(service, 'markPaid').mockResolvedValue({ alreadyPaid: false });
  return { service, paymentAttempt, markPaid };
}

const notification = (over: Record<string, string> = {}) => {
  const base = { order_id: 'ord1', status_code: '200', gross_amount: '53120.00', transaction_status: 'settlement', fraud_status: 'accept', transaction_id: 'tx1' };
  const merged = { ...base, ...over };
  return { ...merged, signature_key: over.signature_key ?? sign(merged.order_id, merged.status_code, merged.gross_amount) };
};

describe('webhook Midtrans', () => {
  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
  });
  afterEach(() => {
    delete process.env.MIDTRANS_SERVER_KEY;
  });

  it('settlement dengan signature valid -> pesanan ditandai lunas', async () => {
    const { service, markPaid } = setup();
    await expect(service.handleMidtrans(notification())).resolves.toEqual({ ok: true });
    expect(markPaid).toHaveBeenCalledWith('ord1', { provider: 'MIDTRANS', ref: 'tx1' });
  });

  it('settlement attempt bersuffix dipetakan kembali ke order internal', async () => {
    const attempt = { id: 'att1', orderId: 'ord1', providerOrderId: 'ord1-p1', status: 'PENDING' };
    const { service, paymentAttempt, markPaid } = setup(undefined, attempt);
    await service.handleMidtrans(notification({ order_id: 'ord1-p1' }));
    expect(paymentAttempt.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'att1' }, data: expect.objectContaining({ status: 'PAID' }) }));
    expect(markPaid).toHaveBeenCalledWith('ord1', { provider: 'MIDTRANS', ref: 'tx1' });
  });

  it('capture + fraud accept juga lunas; capture + challenge TIDAK', async () => {
    const a = setup();
    await a.service.handleMidtrans(notification({ transaction_status: 'capture' }));
    expect(a.markPaid).toHaveBeenCalledTimes(1);
    const b = setup();
    await b.service.handleMidtrans(notification({ transaction_status: 'capture', fraud_status: 'challenge' }));
    expect(b.markPaid).not.toHaveBeenCalled();
  });

  it('signature palsu -> 403 dan tidak mengubah apa pun', async () => {
    const { service, markPaid } = setup();
    await expect(service.handleMidtrans(notification({ signature_key: 'ab'.repeat(64) }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.handleMidtrans({ ...notification(), gross_amount: '1.00' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('nominal dari gateway harus sama dengan pesanan', async () => {
    const { service, markPaid } = setup({ id: 'ord1', totalAmount: 99_000 });
    await expect(service.handleMidtrans(notification())).rejects.toBeInstanceOf(BadRequestException);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('expire / cancel / deny hanya menutup attempt; order tetap bisa mencoba pembayaran lain', async () => {
    const attempt = { id: 'att1', orderId: 'ord1', providerOrderId: 'ord1-p1', status: 'PENDING' };
    const e = setup(undefined, attempt);
    await e.service.handleMidtrans(notification({ order_id: 'ord1-p1', transaction_status: 'expire' }));
    expect(e.paymentAttempt.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'EXPIRED' } }));
    const c = setup(undefined, attempt);
    await c.service.handleMidtrans(notification({ order_id: 'ord1-p1', transaction_status: 'deny' }));
    expect(c.paymentAttempt.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'FAILED' } }));
    const p = setup(undefined, attempt);
    await p.service.handleMidtrans(notification({ order_id: 'ord1-p1', transaction_status: 'pending' }));
    expect(p.paymentAttempt.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }));
    expect(p.markPaid).not.toHaveBeenCalled();
  });

  it('payload tidak lengkap -> 400', async () => {
    const { service } = setup();
    await expect(service.handleMidtrans({ order_id: 'ord1' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('sinkron status (jaring pengaman kalau webhook tidak sampai)', () => {
  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
  });
  afterEach(() => {
    delete process.env.MIDTRANS_SERVER_KEY;
    vi.restoreAllMocks();
  });

  function setupSync(order: Record<string, unknown> | null) {
    const rows = [order].filter(Boolean) as Record<string, unknown>[];
    const prisma = {
      order: {
        findFirst: async ({ where }: { where: Record<string, unknown> }) =>
          rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) ?? null,
        findUnique: async () => rows[0] ?? null,
      },
      paymentAttempt: {
        findFirst: async () => null,
        findUnique: async () => null,
        findMany: async () => [],
      },
    };
    const service = new PaymentsService(prisma as never, {} as never, {} as never);
    const markPaid = vi.spyOn(service, 'markPaid').mockImplementation(async () => {
      if (rows[0]) rows[0].status = 'PAID';
      return { alreadyPaid: false };
    });
    return { service, markPaid, rows };
  }

  it('settlement di Midtrans tapi webhook belum sampai -> ditandai lunas saat disinkronkan', async () => {
    const { service, markPaid } = setupSync({ id: 'ord1', userId: 'u1', totalAmount: 53_120, status: 'PENDING', paymentProvider: 'MIDTRANS' });
    vi.spyOn(MidtransProvider.prototype, 'getStatus').mockResolvedValue({
      order_id: 'ord1',
      status_code: '200',
      gross_amount: '53120.00',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      transaction_id: 'tx1',
    });

    const res = await service.syncWithMidtrans('u1', 'ord1');
    expect(res).toEqual({ status: 'PAID' });
    expect(markPaid).toHaveBeenCalledWith('ord1', { provider: 'MIDTRANS', ref: 'tx1' });
  });

  it('belum bayar di Midtrans -> tetap PENDING, tidak menandai lunas', async () => {
    const { service, markPaid } = setupSync({ id: 'ord1', userId: 'u1', totalAmount: 53_120, status: 'PENDING', paymentProvider: 'MIDTRANS' });
    vi.spyOn(MidtransProvider.prototype, 'getStatus').mockResolvedValue({
      order_id: 'ord1',
      status_code: '201',
      gross_amount: '53120.00',
      transaction_status: 'pending',
    });

    await expect(service.syncWithMidtrans('u1', 'ord1')).resolves.toEqual({ status: 'PENDING' });
    expect(markPaid).not.toHaveBeenCalled();
  });

  it('pesanan yang sudah PAID/bukan milik Midtrans tidak dicek ulang ke Midtrans', async () => {
    const { service } = setupSync({ id: 'ord1', userId: 'u1', totalAmount: 53_120, status: 'PAID', paymentProvider: 'MIDTRANS' });
    const spy = vi.spyOn(MidtransProvider.prototype, 'getStatus');
    await expect(service.syncWithMidtrans('u1', 'ord1')).resolves.toEqual({ status: 'PAID' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('pesanan orang lain tidak bisa disinkronkan', async () => {
    const { service } = setupSync({ id: 'ord1', userId: 'lain', totalAmount: 53_120, status: 'PENDING', paymentProvider: 'MIDTRANS' });
    await expect(service.syncWithMidtrans('u1', 'ord1')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('mode simulasi', () => {
  it('aktif hanya tanpa kunci Midtrans dan bukan production', () => {
    const service = new PaymentsService({} as never, {} as never, {} as never);
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(service.devMode).toBe(process.env.NODE_ENV !== 'production');
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
    expect(service.devMode).toBe(false);
    delete process.env.MIDTRANS_SERVER_KEY;
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(service.devMode).toBe(false);
    process.env.NODE_ENV = prev;
  });
});

describe('ganti metode pembayaran', () => {
  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
  });
  afterEach(() => {
    delete process.env.MIDTRANS_SERVER_KEY;
    vi.restoreAllMocks();
  });

  function setupChange(overrides: Record<string, unknown> = {}) {
    const order = {
      id: 'ord1',
      userId: 'u1',
      status: 'PENDING',
      kind: 'NEW',
      totalAmount: 50_000,
      subtotal: 50_000,
      couponDiscount: 0,
      paymentProvider: 'MIDTRANS',
      invitation: { mediaFiles: [] },
      user: { name: 'Sinta', email: 'sinta@example.com' },
      template: { name: 'Sekar Keraton' },
      addOns: [],
      ...overrides,
    };
    const active = { id: 'att1', orderId: 'ord1', sequence: 1, provider: 'MIDTRANS', providerOrderId: 'ord1-p1', status: 'PENDING', redirectUrl: 'https://pay/old' };
    const created = { ...active, id: 'att2', sequence: 2, providerOrderId: 'ord1-p2', status: 'CREATING', redirectUrl: null };
    const paymentAttempt = {
      count: vi.fn(async () => 1),
      findFirst: vi.fn(async () => active),
      findUnique: vi.fn(async () => active),
      findMany: vi.fn(async () => []),
      aggregate: vi.fn(async () => ({ _max: { sequence: 1 } })),
      create: vi.fn(async () => created),
      update: vi.fn(async () => created),
      updateMany: vi.fn(async () => ({ count: 1 })),
    };
    const prisma = {
      order: {
        findFirst: vi.fn(async () => order),
        findUnique: vi.fn(async () => order),
        update: vi.fn(async () => order),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      paymentAttempt,
      $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };
    const service = new PaymentsService(prisma as never, {} as never, {} as never);
    return { service, prisma, paymentAttempt, order };
  }

  it('membatalkan attempt QRIS pending lalu membuat sesi baru dengan ID gateway unik', async () => {
    const { service, paymentAttempt } = setupChange();
    vi.spyOn(MidtransProvider.prototype, 'getStatus').mockResolvedValue({
      order_id: 'ord1-p1',
      status_code: '201',
      gross_amount: '50000.00',
      transaction_status: 'pending',
      transaction_id: 'tx-old',
    });
    const cancel = vi.spyOn(MidtransProvider.prototype, 'cancelPayment').mockResolvedValue(true);
    const create = vi.spyOn(MidtransProvider.prototype, 'createPayment').mockResolvedValue({ provider: 'MIDTRANS', token: 'new-token', redirectUrl: 'https://pay/new' });

    await expect(service.changeMethod('u1', 'ord1')).resolves.toEqual({ status: 'PENDING', provider: 'MIDTRANS', redirectUrl: 'https://pay/new' });
    expect(cancel).toHaveBeenCalledWith('ord1-p1');
    expect(paymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerOrderId: 'ord1-p2', sequence: 2 }) }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'ord1-p2', amount: 50_000 }));
  });

  it('tidak membuat attempt baru bila pembayaran ternyata sudah lunas', async () => {
    const { service, prisma, paymentAttempt, order } = setupChange();
    vi.spyOn(MidtransProvider.prototype, 'getStatus').mockResolvedValue({
      order_id: 'ord1-p1',
      status_code: '200',
      gross_amount: '50000.00',
      transaction_status: 'settlement',
      transaction_id: 'tx-paid',
    });
    vi.spyOn(service, 'markPaid').mockImplementation(async () => ({ alreadyPaid: false }));
    prisma.order.findUnique
      .mockResolvedValueOnce({ ...order, status: 'PENDING' })
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, status: 'PAID' });

    await expect(service.changeMethod('u1', 'ord1')).resolves.toEqual({ status: 'PAID' });
    expect(paymentAttempt.create).not.toHaveBeenCalled();
  });

  it('membatasi pergantian berulang dalam satu jam', async () => {
    const { service, paymentAttempt } = setupChange();
    paymentAttempt.count.mockResolvedValue(5);
    await expect(service.changeMethod('u1', 'ord1')).rejects.toBeInstanceOf(ConflictException);
    expect(paymentAttempt.findFirst).not.toHaveBeenCalled();
  });

  it('tidak mengizinkan pengguna mengganti pembayaran order milik orang lain', async () => {
    const { service, prisma, paymentAttempt } = setupChange();
    prisma.order.findFirst.mockResolvedValue(null);
    await expect(service.changeMethod('user-lain', 'ord1')).rejects.toBeInstanceOf(NotFoundException);
    expect(paymentAttempt.count).not.toHaveBeenCalled();
  });
});
