import { afterEach, describe, expect, it, vi } from 'vitest';
import { MidtransProvider } from './midtrans.provider.js';

const methods = ['BSI VA', 'CIMB Niaga VA', 'BNI VA', 'BRI VA', 'Bank Mandiri Bill Payment', 'PermataBank VA', 'GoPay Dynamic QRIS', 'GoPay'] as const;
const body = (method: string, status = 'settlement') => ({
  status_code: status === 'pending' ? '201' : '200', order_id: 'order-p1',
  transaction_id: `tx-${method}`, gross_amount: '150000.00', transaction_status: status,
});
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

// Contract tests with mocked HTTP, NOT live sandbox payment results.
describe.each(methods)('%s - gateway contract', (method) => {
  it.each(['pending', 'settlement', 'expire'])('reads %s on the legacy route', async (status) => {
    const fetcher = vi.fn().mockResolvedValue(json(body(method, status)));
    vi.stubGlobal('fetch', fetcher);
    await expect(new MidtransProvider('test-key').getStatus('tx-known')).resolves.toMatchObject({ transaction_status: status });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].headers['transaction-source']).toBeUndefined();
  });
  it('retries an HTTP-200/body-404 using the BI-SNAP header', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ status_code: '404' })).mockResolvedValueOnce(json(body(method)));
    vi.stubGlobal('fetch', fetcher);
    await expect(new MidtransProvider('test-key').getStatus('tx-known')).resolves.toMatchObject({ transaction_status: 'settlement' });
    expect(fetcher.mock.calls[1][0]).toContain('/v2/tx-known/status');
    expect(fetcher.mock.calls[1][1].headers['transaction-source']).toBe('SNAP_API');
  });
  it('cancels on BI-SNAP only after a legacy miss', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ status_code: '404' })).mockResolvedValueOnce(json({ status_code: '200' }));
    vi.stubGlobal('fetch', fetcher);
    await expect(new MidtransProvider('test-key').cancelPayment('tx-known')).resolves.toBe(true);
    expect(fetcher.mock.calls[1][1]).toMatchObject({ method: 'POST', headers: expect.objectContaining({ 'transaction-source': 'SNAP_API' }) });
  });
});

describe('gateway response validation', () => {
  it('returns null only after both routes report missing transaction', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => json({ status_code: '404' })));
    await expect(new MidtransProvider('key').getStatus('unknown')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each([{ status_code: '401' }, { status_code: '200' }, { ...body('BSI'), gross_amount: 'invalid' }, { ...body('BSI'), status_code: '500' }])('rejects business errors / malformed success responses', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(data)));
    await expect(new MidtransProvider('key').getStatus('tx')).rejects.toThrow('Gagal memverifikasi');
  });
  it('does not call a failed cancellation successful just because HTTP is 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ status_code: '412' })));
    await expect(new MidtransProvider('key').cancelPayment('tx')).resolves.toBe(false);
  });
  it('rejects HTTP-200/business-401 cancellation without creating a success result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ status_code: '401' })));
    await expect(new MidtransProvider('key').cancelPayment('tx')).rejects.toThrow('Gagal membatalkan');
  });
  it('preserves production routing', async () => {
    vi.stubEnv('MIDTRANS_IS_PRODUCTION', 'true');
    const fetcher = vi.fn().mockResolvedValue(json(body('BNI')));
    vi.stubGlobal('fetch', fetcher);
    await new MidtransProvider('key').getStatus('tx');
    expect(fetcher.mock.calls[0][0]).toBe('https://api.midtrans.com/v2/tx/status');
  });
});
