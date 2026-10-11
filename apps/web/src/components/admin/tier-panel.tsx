'use client';

// Panel "Paket & ketersediaan" di dalam halaman satu tema: harga dan ketersediaan tiap paket (Basic / Standard / Premium)
// diatur di sini, bukan di daftar. Tiap paket adalah satu baris template; menyimpan = PATCH parsial { price, status }.
import Link from 'next/link';
import { useState } from 'react';
import { Alert, Badge, Button, Card, Field, Input, Select } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';
import { TIER_LABEL } from '@/lib/catalog';

export type TierStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface TierRow {
  id: string;
  name: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  price: number;
  status: TierStatus;
  orders: number;
}

const STATUS_OPTIONS: { value: TierStatus; label: string }[] = [
  { value: 'PUBLISHED', label: 'Tersedia (tampil di katalog)' },
  { value: 'DRAFT', label: 'Tidak tersedia (draf)' },
  { value: 'ARCHIVED', label: 'Diarsipkan' },
];

function RowEditor({ row, current, onSaved }: { row: TierRow; current: boolean; onSaved: (id: string, price: number, status: TierStatus) => void }) {
  const [price, setPrice] = useState(String(row.price));
  const [status, setStatus] = useState<TierStatus>(row.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const amount = Number(price);
  const valid = price.trim() !== '' && Number.isInteger(amount) && amount >= 0 && amount <= 10_000_000;
  const dirty = amount !== row.price || status !== row.status;

  async function save() {
    setBusy(true);
    setError('');
    setDone('');
    try {
      await api(`admin/templates/${row.id}`, { method: 'PATCH', body: { price: amount, status } });
      onSaved(row.id, amount, status);
      setDone('Tersimpan.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${current ? 'border-rose/40 bg-rose-soft/30' : 'border-line'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink">{TIER_LABEL[row.tier]}</p>
          <Badge tone={row.status === 'PUBLISHED' ? 'sage' : row.status === 'DRAFT' ? 'gold' : 'neutral'}>
            {row.status === 'PUBLISHED' ? 'Tersedia' : row.status === 'DRAFT' ? 'Draf' : 'Arsip'}
          </Badge>
          {row.orders > 0 && <span className="text-xs text-ink-soft">{row.orders} pesanan</span>}
        </div>
        {current ? <span className="text-xs text-ink-soft">Sedang dibuka di bawah</span> : <Link href={`/admin/templates/${row.id}`} className="text-sm font-medium text-rose hover:underline">Buka editor paket ini →</Link>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <Field label="Harga (Rp)">
          <Input type="number" min={0} max={10000000} step={1000} value={price} onChange={(e) => { setPrice(e.target.value); setDone(''); }} />
        </Field>
        <Field label="Ketersediaan">
          <Select value={status} onChange={(e) => { setStatus(e.target.value as TierStatus); setDone(''); }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Button type="button" onClick={save} loading={busy} disabled={!dirty || !valid}>Simpan</Button>
      </div>
      {!valid && <p className="mt-2 text-xs text-danger" role="alert">Harga harus bilangan bulat 0 – 10.000.000.</p>}
      {error && <Alert className="mt-3">{error}</Alert>}
      {done && !error && <p className="mt-2 text-sm text-sage" role="status">{done}</p>}
    </div>
  );
}

// `current` = harga & status terkini paket yang sedang dibuka di editor (sumber kebenarannya state editor, karena tombol
// "Simpan & publikasikan" di editor juga mengubah status); paket lain disimpan di state panel ini.
export function TierPanel({ rows, currentId, current, onCurrentSaved }: { rows: TierRow[]; currentId: string; current: { price: number; status: TierStatus }; onCurrentSaved: (price: number, status: TierStatus) => void }) {
  const [others, setOthers] = useState(rows);
  const list = others.map((r) => (r.id === currentId ? { ...r, price: current.price, status: current.status } : r));

  function saved(id: string, price: number, status: TierStatus) {
    if (id === currentId) onCurrentSaved(price, status);
    else setOthers((l) => l.map((r) => (r.id === id ? { ...r, price, status } : r)));
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink">Paket &amp; ketersediaan tema ini</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Atur harga dan ketersediaan tiap paket di sini. Hanya paket berstatus <strong>Tersedia</strong> yang tampil dan bisa dipesan; undangan yang sudah dibeli tidak terpengaruh.
        Isi dan tampilan tiap paket diedit di editornya masing-masing.
      </p>
      <div className="mt-4 space-y-3">
        {list.map((r) => (
          // key memuat nilai tersimpan: setelah disimpan (dari sini atau dari tombol simpan editor) baris dimuat ulang dari nilai terbaru.
          <RowEditor key={`${r.id}:${r.price}:${r.status}`} row={r} current={r.id === currentId} onSaved={saved} />
        ))}
      </div>
    </Card>
  );
}
