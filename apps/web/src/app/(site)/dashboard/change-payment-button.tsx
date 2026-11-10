'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';

export function ChangePaymentButton({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function changeMethod() {
    if (!confirm('Ganti metode pembayaran? Kode QR atau nomor pembayaran lama akan dibatalkan dan tidak boleh digunakan lagi.')) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<{ status: string; redirectUrl?: string }>(`payments/${orderId}/change-method`, { method: 'POST', body: {} });
      if (result.status === 'PAID' || !result.redirectUrl) router.push(`/checkout/${orderId}`);
      else window.location.assign(result.redirectUrl);
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" size="sm" loading={busy} onClick={changeMethod}>
        {compact ? 'Ganti metode' : 'Ganti metode pembayaran'}
      </Button>
      {error && <span role="alert" className="max-w-64 text-xs text-danger">{error}</span>}
    </span>
  );
}
