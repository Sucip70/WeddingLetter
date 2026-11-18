import { describe, expect, it } from 'vitest';
import { devPaymentOrderId } from './dev-payment-order';

describe('legacy development payment URLs', () => {
  it.each([1, 2, 12])('resolves attempt p%s to its merchant order', (sequence) => {
    expect(devPaymentOrderId(`cmwlftest-p${sequence}`)).toBe('cmwlftest');
  });
  it.each(['cmwlftest', 'order-payment', 'order-p0', 'order-p1-middle'])('preserves non-attempt reference %s', (id) => {
    expect(devPaymentOrderId(id)).toBe(id);
  });
});
