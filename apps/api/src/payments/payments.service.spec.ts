import { createHash } from 'node:crypto';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MidtransProvider } from './midtrans.provider.js';
import { PaymentsService } from './payments.service.js';

const SERVER_KEY = 'SB-Mid-server-test';
const sign = (orderId: string, status: string, gross: string) =>
  createHash('sha512').update(`${orderId}${status}${gross}${SERVER_KEY}`).digest('hex');

function setup(order: { id: string; totalAmount: number } | null = { id: 'ord1', totalAmount: 53_120 }) {
  const prisma = { order: { findUnique: async () => order } };
  const orders = { closeUnpaid: vi.fn(async () => undefined) };
  const service = new PaymentsService(prisma as never, orders as never, {} as never, {} as never);
  const markPaid = vi.spyOn(service, 'markPaid').mockResolvedValue({ alreadyPaid: false });
  return { service, orders, markPaid };
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

  it('expire / cancel / deny menutup pesanan; pending tidak melakukan apa-apa', async () => {
    const e = setup();
    await e.service.handleMidtrans(notification({ transaction_status: 'expire' }));
    expect(e.orders.closeUnpaid).toHaveBeenCalledWith('ord1', 'EXPIRED');
    const c = setup();
    await c.service.handleMidtrans(notification({ transaction_status: 'deny' }));
    expect(c.orders.closeUnpaid).toHaveBeenCalledWith('ord1', 'CANCELLED');
    const p = setup();
    await p.service.handleMidtrans(notification({ transaction_status: 'pending' }));
    expect(p.orders.closeUnpaid).not.toHaveBeenCalled();
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
    };
    const orders = { closeUnpaid: vi.fn(async () => undefined) };
    const service = new PaymentsService(prisma as never, orders as never, {} as never, {} as never);
    const markPaid = vi.spyOn(service, 'markPaid').mockImplementation(async () => {
      if (rows[0]) rows[0].status = 'PAID';
      return { alreadyPaid: false };
    });
    return { service, orders, markPaid, rows };
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
    const service = new PaymentsService({} as never, {} as never, {} as never, {} as never);
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
