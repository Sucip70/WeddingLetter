'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';

export function MaintenanceButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function run() {
    setBusy(true);
    try {
      const r = await api<{ expired: { invitations: number; media: number }; staleOrders: number; purged: { invitations: number; media: number }; reminders: number }>('admin/maintenance/run', { method: 'POST', body: {} });
      setMessage(`Selesai: ${r.expired.invitations} berakhir, ${r.purged.invitations} dihapus permanen, ${r.staleOrders} pesanan kedaluwarsa, ${r.reminders} pengingat terkirim.`);
      router.refresh();
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <Button variant="secondary" size="sm" onClick={run} loading={busy}>Jalankan pemeliharaan sekarang</Button>
      {message && <p className="mt-2 max-w-xs text-xs text-ink-soft" role="status">{message}</p>}
    </div>
  );
}
