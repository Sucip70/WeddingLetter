'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, Card, Field, Input } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';

export function SettingsForm({ initial }: { initial: string }) {
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api<{ supportWhatsapp: string }>('/admin/settings', { method: 'PUT', body: { supportWhatsapp: value } });
      setSaved(res.supportWhatsapp);
      setValue(res.supportWhatsapp);
      setMessage(res.supportWhatsapp ? 'Tersimpan. Tautan bantuan sekarang membuka WhatsApp.' : 'Nomor dikosongkan. Tautan bantuan menuju halaman "segera hadir". ');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nomor WhatsApp bantuan" hint="Contoh 0812-3456-7890 atau 6281234567890. Kosongkan bila belum ada: tautan bantuan di footer, beranda, dan dashboard akan menuju halaman /kontak yang berisi info segera hadir, bukan ke WhatsApp.">
          <Input inputMode="tel" placeholder="6281234567890" maxLength={40} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <p className="text-sm text-ink-soft">
          Status sekarang: {saved ? <strong className="text-ink">wa.me/{saved}</strong> : <strong className="text-ink">belum diisi (halaman segera hadir)</strong>}
        </p>
        {error && <Alert>{error}</Alert>}
        {message && <p className="text-sm text-sage">{message}</p>}
        <Button type="submit" loading={loading}>Simpan</Button>
      </form>
    </Card>
  );
}
