'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Badge, Button, Card, Field, Input, Select } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';
import { formatDate, rupiah } from '@/lib/format';
import type { AddOn } from '@/lib/types';
import type { AdminCoupon } from './page';

const UNIT_HINT: Record<string, string> = {
  MEDIA_RENTAL_WEEK: 'per MB per minggu',
  EXTEND_ACTIVE_WEEK: 'per minggu',
  PHOTO_PACK_5: 'per paket 5 foto',
};

function AddOnRow({ addOn }: { addOn: AddOn & { id: string } }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(addOn.price));
  const [name, setName] = useState(addOn.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = Number(price) !== addOn.price || name !== addOn.name;

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api(`admin/add-ons/${addOn.id}`, { method: 'PATCH', body: { name, price: Number(price) } });
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-end gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_auto]">
      <div>
        <p className="text-xs text-ink-soft">{addOn.code}{UNIT_HINT[addOn.code] ? ` · ${UNIT_HINT[addOn.code]}` : ''}</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} aria-label={`Nama ${addOn.code}`} className="mt-1" />
      </div>
      <div>
        <p className="text-xs text-ink-soft">Harga (Rp)</p>
        <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} aria-label={`Harga ${addOn.code}`} className="mt-1" />
      </div>
      <Button size="sm" onClick={save} loading={busy} disabled={!dirty || !name.trim() || price === ''}>Simpan</Button>
      {error && <p className="text-xs text-danger md:col-span-3">{error}</p>}
    </div>
  );
}

function CouponRow({ coupon }: { coupon: AdminCoupon }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');

  async function act(kind: 'toggle' | 'delete') {
    setBusy(kind);
    try {
      if (kind === 'toggle') await api(`admin/coupons/${coupon.id}`, { method: 'PATCH', body: { status: coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } });
      else if (confirm(`Hapus kupon ${coupon.code}?`)) await api(`admin/coupons/${coupon.id}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      alert(errorMessage(e));
    } finally {
      setBusy('');
    }
  }

  return (
    <tr>
      <td className="px-4 py-3 font-mono text-sm font-medium text-ink">{coupon.code}</td>
      <td className="px-4 py-3">{coupon.type === 'PERCENT' ? `${coupon.value}%` : rupiah(coupon.value)}</td>
      <td className="px-4 py-3 tabular-nums">{coupon.usedCount}{coupon.quota !== null ? ` / ${coupon.quota}` : ' / ∞'}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{coupon.endsAt ? `s/d ${formatDate(coupon.endsAt)}` : 'tanpa batas'}</td>
      <td className="px-4 py-3"><Badge tone={coupon.status === 'ACTIVE' ? 'sage' : 'neutral'}>{coupon.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}</Badge></td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <button className="mr-3 text-xs font-medium text-rose hover:underline disabled:opacity-50" disabled={!!busy} onClick={() => act('toggle')}>{coupon.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}</button>
        <button className="text-xs font-medium text-danger hover:underline disabled:opacity-50" disabled={!!busy} onClick={() => act('delete')}>Hapus</button>
      </td>
    </tr>
  );
}

export function PricingManager({ addOns, coupons }: { addOns: (AddOn & { id: string })[]; coupons: AdminCoupon[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: '10', quota: '', endsAt: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    setBusy(true);
    setError('');
    try {
      await api('admin/coupons', {
        body: {
          code: form.code,
          type: form.type,
          value: Number(form.value),
          quota: form.quota ? Number(form.quota) : null,
          endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:00+07:00`).toISOString() : null,
        },
      });
      setForm({ code: '', type: 'PERCENT', value: '10', quota: '', endsAt: '' });
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-2xl text-ink">Harga komponen</h2>
        <p className="mt-1 text-sm text-ink-soft">Tarif sewa media (Rp/MB/minggu) dan perpanjangan (Rp/minggu) memakai rumus di dokumen rancangan Bagian 7.1.</p>
        <Card className="mt-4 divide-y divide-line overflow-hidden">
          {addOns.map((a) => <AddOnRow key={a.id + a.price + a.name} addOn={a} />)}
        </Card>
      </section>

      <section>
        <h2 className="font-display text-2xl text-ink">Kupon diskon</h2>
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ivory text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr><th className="px-4 py-3 font-medium">Kode</th><th className="px-4 py-3 font-medium">Potongan</th><th className="px-4 py-3 font-medium">Terpakai</th><th className="px-4 py-3 font-medium">Berlaku</th><th className="px-4 py-3 font-medium">Status</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map((c) => <CouponRow key={c.id + c.status} coupon={c} />)}
              {coupons.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">Belum ada kupon.</td></tr>}
            </tbody>
          </table>
        </Card>

        <Card className="mt-5 p-5">
          <h3 className="font-semibold text-ink">Buat kupon baru</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Kode"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="TEMANKU" maxLength={30} /></Field>
            <Field label="Jenis">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="PERCENT">Persen (%)</option>
                <option value="NOMINAL">Nominal (Rp)</option>
              </Select>
            </Field>
            <Field label={form.type === 'PERCENT' ? 'Persen' : 'Rupiah'}><Input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
            <Field label="Kuota" hint="Kosong = tanpa batas"><Input type="number" min={1} value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} /></Field>
            <Field label="Berlaku sampai" hint="Kosong = tanpa batas"><Input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></Field>
          </div>
          {error && <Alert className="mt-4">{error}</Alert>}
          <Button className="mt-4" onClick={create} loading={busy} disabled={!form.code || !form.value}>Buat kupon</Button>
        </Card>
      </section>
    </div>
  );
}
