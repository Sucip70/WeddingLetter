'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Card, Field, Input } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';

export function OrderActions({ id, status, kind, published }: { id: string; status: string; kind: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [force, setForce] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function run(action: 'mark-paid' | 'refund') {
    if (action === 'refund' && !confirm('Refund pesanan ini? Undangan akan dihapus permanen. Pengembalian uang dilakukan manual di dashboard payment gateway.')) return;
    setBusy(action);
    setError('');
    setDone('');
    try {
      await api(`admin/orders/${id}/${action}`, { method: 'POST', body: action === 'mark-paid' ? { note: note || undefined } : { force } });
      setDone(action === 'mark-paid' ? 'Pesanan ditandai lunas.' : 'Pesanan direfund dan undangan dihapus.');
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }

  if (status !== 'PENDING' && status !== 'PAID') return null;
  return (
    <Card className="mt-5 space-y-5 p-6">
      <h2 className="font-semibold text-ink">Tindakan</h2>
      {error && <Alert>{error}</Alert>}
      {done && <Alert tone="success">{done}</Alert>}
      {status === 'PENDING' && (
        <div className="space-y-3">
          <Field label="Catatan (mis. bank & nama pengirim transfer)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Transfer BCA a.n. …" maxLength={200} /></Field>
          <Button onClick={() => run('mark-paid')} loading={busy === 'mark-paid'} variant="sage">Tandai lunas (pembayaran manual)</Button>
        </div>
      )}
      {status === 'PAID' && kind === 'NEW' && (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">Kebijakan: refund penuh hanya sebelum publish dan dalam 48 jam sejak dibayar.{published ? ' Undangan ini sudah dipublikasikan.' : ''}</p>
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="accent-[#b4533c]" /> Pengecualian (abaikan syarat di atas)</label>
          <Button variant="danger" onClick={() => run('refund')} loading={busy === 'refund'}>Refund pesanan</Button>
        </div>
      )}
    </Card>
  );
}
