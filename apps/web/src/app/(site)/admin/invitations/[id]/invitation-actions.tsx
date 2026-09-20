'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Card, Field, Input } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';

export function InvitationActions({ id, status, expiresAt }: { id: string; status: string; expiresAt: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [extraDays, setExtraDays] = useState(0);
  const [weeks, setWeeks] = useState(1);
  const [expiry, setExpiry] = useState(expiresAt ? expiresAt.slice(0, 10) : '');

  async function run(key: string, path: string, body: unknown, message: string, method = 'POST') {
    setBusy(key);
    setError('');
    setOk('');
    try {
      await api(`admin/invitations/${id}${path}`, { method, body: body ?? {} });
      setOk(message);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }

  const canExtend = ['ACTIVE', 'PAUSED', 'EXPIRED_GRACE'].includes(status);
  return (
    <Card className="mt-6 space-y-6 p-6">
      <div>
        <h2 className="font-semibold text-ink">Atur status & durasi</h2>
        <p className="mt-1 text-sm text-ink-soft">Mis. pelanggan menghubungi CS untuk menunda tanggal acara: jeda undangan (hitung mundur berhenti, sisa durasi disimpan), lalu lanjutkan di lain hari.</p>
      </div>
      {error && <Alert>{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ink">Jeda / lanjutkan</h3>
          {status === 'ACTIVE' && <Button variant="secondary" onClick={() => run('pause', '/pause', {}, 'Undangan dijeda.')} loading={busy === 'pause'}>Jeda undangan</Button>}
          {status === 'PAUSED' && (
            <div className="space-y-3">
              <Field label="Bonus hari gratis saat melanjutkan"><Input type="number" min={0} max={365} value={extraDays} onChange={(e) => setExtraDays(Math.max(0, Number(e.target.value) || 0))} /></Field>
              <Button onClick={() => run('resume', '/resume', { extraDays }, 'Undangan dilanjutkan.')} loading={busy === 'resume'}>Lanjutkan undangan</Button>
            </div>
          )}
          {!['ACTIVE', 'PAUSED'].includes(status) && <p className="text-sm text-ink-soft">Hanya untuk undangan aktif / dijeda.</p>}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ink">Tambah masa aktif (gratis)</h3>
          <Field label="Minggu"><Input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Math.min(52, Math.max(1, Number(e.target.value) || 1)))} /></Field>
          <Button variant="secondary" disabled={!canExtend} onClick={() => run('extend', '/extend', { weeks }, `Ditambah ${weeks} minggu.`)} loading={busy === 'extend'}>Perpanjang {weeks} minggu</Button>
        </div>

        {status === 'ACTIVE' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-ink">Atur tanggal berakhir</h3>
            <Field label="Berakhir pada"><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></Field>
            <Button variant="secondary" disabled={!expiry} onClick={() => run('expiry', '/expiry', { expiresAt: new Date(`${expiry}T23:59:00+07:00`).toISOString() }, 'Tanggal berakhir diperbarui.')} loading={busy === 'expiry'}>Simpan tanggal</Button>
          </div>
        )}

        {status !== 'DELETED' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-danger">Zona berbahaya</h3>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Hapus undangan ini beserta semua file-nya secara permanen?')) void run('delete', '', {}, 'Undangan dihapus.', 'DELETE');
              }}
              loading={busy === 'delete'}
            >
              Hapus permanen
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
