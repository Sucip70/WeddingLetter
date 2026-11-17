import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { OrderDetail } from '../../../../lib/types';

vi.mock('@/components/order-summary', () => ({
  OrderLines: () => null,
  OrderStatusBadge: () => null,
}));
vi.mock('@/components/ui', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => createElement('div', null, children),
  Card: ({ children }: { children: React.ReactNode }) => createElement('div', null, children),
  Button: ({ children }: { children: React.ReactNode }) => createElement('button', null, children),
  LinkButton: ({ children, href }: { children: React.ReactNode; href: string }) => createElement('a', { href }, children),
}));
vi.mock('@/lib/client-api', () => ({ api: vi.fn(), errorMessage: vi.fn() }));

import { CheckoutStatus } from './checkout-status';

const order = {
  id: 'order-test', kind: 'NEW', status: 'PENDING', media: [],
  invitation: { id: 'invitation-test', slug: 'andi-sinta' },
} as unknown as OrderDetail;

describe('customer checkout status', () => {
  it('shows ordinary pending payment without technical recovery fields', () => {
    const html = renderToStaticMarkup(createElement(CheckoutStatus, { initial: order }));
    expect(html).toContain('Menunggu pembayaran');
    expect(html).toContain('Lanjutkan pembayaran');
    expect(html).not.toMatch(/Transaction ID|BI-SNAP|<input|<form|Status pembayaran belum dapat dipastikan/);
  });

  it('preserves paid-order access without a payment button', () => {
    const html = renderToStaticMarkup(createElement(CheckoutStatus, { initial: { ...order, status: 'PAID' } }));
    expect(html).toContain('Pembayaran diterima');
    expect(html).toContain('Atur &amp; publikasikan undangan');
    expect(html).not.toContain('Lanjutkan pembayaran');
  });

  it('keeps cancelled orders from being paid', () => {
    const html = renderToStaticMarkup(createElement(CheckoutStatus, { initial: { ...order, status: 'CANCELLED' } }));
    expect(html).toContain('Pesanan tidak aktif');
    expect(html).not.toContain('Lanjutkan pembayaran');
  });

  it('keeps automatic sync but never asks customers for gateway identifiers', () => {
    const source = readFileSync(new URL('./checkout-status.tsx', import.meta.url), 'utf8');
    expect(source).toContain('payments/${order.id}/sync');
    expect(source).toContain('setInterval');
    expect(source).toContain('Jika Anda sudah membayar, jangan lakukan pembayaran ulang');
    expect(source).toContain('href="/kontak"');
    expect(source).not.toMatch(/Transaction ID|needsTransactionId|transactionId|BI-SNAP/);
  });
});
