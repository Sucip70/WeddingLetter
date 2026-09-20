'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { OrderLines } from '@/components/order-summary';
import { Alert, Badge, Button, Card } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';
import type { OrderDetail } from '@/lib/types';

export function DevPay({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await api(`payments/dev/${order.id}/confirm`, { method: 'POST', body: {} });
      router.push(`/checkout/${order.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Card className="p-7">
      <Badge tone="gold">Mode development</Badge>
      <h1 className="mt-4 font-display text-3xl text-ink">Simulasi pembayaran</h1>
      <p className="mt-2 text-sm text-ink-soft">Kunci Midtrans belum dikonfigurasi, jadi pembayaran disimulasikan. Di production, halaman ini digantikan Midtrans Snap (QRIS, VA, e-wallet).</p>
      <div className="mt-6"><OrderLines order={order} /></div>
      {error && <Alert className="mt-5">{error}</Alert>}
      <Button size="lg" className="mt-6 w-full" onClick={confirm} loading={busy} disabled={order.status !== 'PENDING'}>
        {order.status === 'PENDING' ? 'Simulasikan pembayaran berhasil' : `Pesanan berstatus ${order.status}`}
      </Button>
    </Card>
  );
}
