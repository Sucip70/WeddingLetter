'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, Card, Field, Input } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';
import type { PublicSettings } from '@/lib/legal';

export function SettingsForm({ initial }: { initial: PublicSettings }) {
  const [saved, setSaved] = useState(initial.supportWhatsapp);
  const [value, setValue] = useState(initial.supportWhatsapp);
  const [legal, setLegal] = useState(initial.legal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api<PublicSettings>('/admin/settings', { method: 'PUT', body: { supportWhatsapp: value, legal } });
      setSaved(res.supportWhatsapp);
      setValue(res.supportWhatsapp);
      setLegal(res.legal);
      setMessage('Pengaturan tersimpan. Identitas dan ketentuan baru berlaku untuk pemesanan berikutnya; bukti persetujuan pesanan lama tidak berubah.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div><h2 className="font-display text-2xl text-ink">Identitas &amp; layanan bantuan</h2><p className="mt-2 text-sm text-ink-soft">Ditampilkan pada halaman ketentuan dan kontak.</p></div>
        <Field label="Nama pengelola"><Input value={legal.ownerName} maxLength={120} required onChange={(e) => setLegal({ ...legal, ownerName: e.target.value })} /></Field>
        <Field label="Tautan profil pengelola"><Input type="url" required value={legal.ownerUrl} onChange={(e) => setLegal({ ...legal, ownerUrl: e.target.value })} /></Field>
        <Field label="Email bantuan"><Input type="email" required value={legal.supportEmail} onChange={(e) => setLegal({ ...legal, supportEmail: e.target.value })} /></Field>
        <Field label="Nomor WhatsApp bantuan" hint="Contoh 0812-3456-7890 atau 6281234567890. Kosongkan untuk menonaktifkan tautan WhatsApp; bantuan email tetap tersedia di halaman kontak.">
          <Input inputMode="tel" placeholder="6281234567890" maxLength={40} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Field label="Hari & jam layanan"><Input required value={legal.serviceHours} onChange={(e) => setLegal({ ...legal, serviceHours: e.target.value })} /></Field>
        <Field label="Target respons awal (hari kerja)"><Input type="number" min={1} max={14} required value={legal.responseBusinessDays} onChange={(e) => setLegal({ ...legal, responseBusinessDays: Number(e.target.value) })} /></Field>
        <div className="border-t border-line pt-5"><h2 className="font-display text-2xl text-ink">Penyimpanan draf berbayar</h2><p className="mt-2 text-sm leading-relaxed text-ink-soft">Hanya untuk undangan yang belum pernah dipublikasikan. Dihitung sejak pembayaran berhasil. Tidak mengubah masa aktif atau masa tenggang 30 hari.</p></div>
        <Field label="Batas penyimpanan draf (hari)" hint="Default 100 hari. Berlaku untuk pesanan baru saja; draf lama tidak diberi tenggat secara retroaktif. Pengingat email H-14 dan H-3."><Input type="number" min={1} max={3650} required value={legal.draftRetentionDays} onChange={(e) => setLegal({ ...legal, draftRetentionDays: Number(e.target.value) })} /></Field>
        <p className="text-sm text-ink-soft">
          Status sekarang: {saved ? <strong className="text-ink">wa.me/{saved}</strong> : <strong className="text-ink">WhatsApp nonaktif</strong>}
        </p>
        {error && <Alert>{error}</Alert>}
        {message && <p className="text-sm text-sage">{message}</p>}
        <Button type="submit" loading={loading}>Simpan</Button>
      </form>
    </Card>
  );
}
