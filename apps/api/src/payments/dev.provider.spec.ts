import { DevProvider } from './dev.provider.js';
import type { PaymentRequest } from './payment.provider.js';

const request: PaymentRequest = {
  orderId: 'merchant-order-p1', amount: 150000, customer: { name: 'Demo', email: 'demo@example.invalid' },
  items: [], finishUrl: 'http://localhost:3105/checkout/merchant-order',
};

describe('development payment redirect', () => {
  it.each([1, 2, 12])('uses the merchant order, not payment attempt p%s', async (sequence) => {
    const result = await new DevProvider().createPayment({ ...request, orderId: `merchant-order-p${sequence}` });
    expect(result).toEqual({ provider: 'DEV', redirectUrl: 'http://localhost:3105/dev/pay/merchant-order' });
  });
  it('preserves an application base path and removes callback query/hash', async () => {
    const result = await new DevProvider().createPayment({ ...request, finishUrl: 'http://localhost:3105/app/checkout/merchant-order?status=pending#details' });
    expect(result.redirectUrl).toBe('http://localhost:3105/app/dev/pay/merchant-order');
  });
  it('rejects an invalid finish path instead of producing a broken redirect', async () => {
    await expect(new DevProvider().createPayment({ ...request, finishUrl: 'http://localhost:3105/other' })).rejects.toThrow('tidak valid');
  });
});
