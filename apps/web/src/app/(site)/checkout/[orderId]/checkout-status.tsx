'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { OrderLines, OrderStatusBadge } from '@/components/order-summary';
import { Alert, Button, Card, Field, Input, LinkButton } from '@/components/ui';
import { api, errorMessage } from '@/lib/client-api';
import type { OrderDetail } from '@/lib/types';

export function CheckoutStatus({ initial }: { initial: OrderDetail }) {
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [needsTransactionId, setNeedsTransactionId] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Setelah kembali dari halaman bayar, webhook bisa tiba beberapa detik kemudian: pantau statusnya.
  // `payments/.../sync` juga menanyakan langsung ke Midtrans (jaring pengaman kalau webhook tidak pernah
  // sampai, misalnya server dev di localhost tidak bisa dihubungi dari internet).
  useEffect(() => {
    if (order.status !== 'PENDING') return;
    let running = false;
    let disposed = false;
    const tick = async () => {
      if (running) return;
      running = true;
      try {
        const result = await api<{ needsTransactionId?: boolean }>(`payments/${order.id}/sync`, { method: 'POST', body: {} });
        const refreshed = await api<OrderDetail>(`orders/${order.id}`);
        if (!disposed) {
          setNeedsTransactionId(!!result.needsTransactionId);
          setSyncError('');
          setOrder(refreshed);
        }
      } catch (error) {
        if (!disposed) setSyncError(errorMessage(error));
      } finally {
        running = false;
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 4000);
    return () => { disposed = true; clearInterval(id); };
  }, [order.id, order.status]);

  const unuploaded = order.media.some((m) => m.status === 'PENDING');
  const invitationId = order.invitation?.id;

  async function reconcile() {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ needsTransactionId?: boolean }>(`payments/${order.id}/sync`, { method: 'POST', body: { transactionId: transactionId.trim() } });
      setNeedsTransactionId(!!result.needsTransactionId);
      setOrder(await api<OrderDetail>(`orders/${order.id}`));
      if (result.needsTransactionId) setError('Transaksi belum ditemukan. Periksa Transaction ID Midtrans atau hubungi bantuan.');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ status: string; redirectUrl?: string }>(`payments/${order.id}/start`, { method: 'POST', body: {} });
      if (res.status === 'PAID' || !res.redirectUrl) setOrder(await api<OrderDetail>(`orders/${order.id}`));
      else window.location.assign(res.redirectUrl);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Batalkan pesanan ini? Draf undangan dan file yang sudah terunggah akan dihapus.')) return;
    setBusy(true);
    try {
      setOrder(await api<OrderDetail>(`orders/${order.id}/cancel`, { method: 'POST', body: {} }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const heading =
    order.status === 'PAID'
      ? { title: 'Pembayaran diterima', body: order.kind === 'NEW' ? 'Undangan Anda sudah siap diatur. Lengkapi, lalu publikasikan saat Anda siap membagikannya.' : 'Masa aktif undangan Anda sudah diperpanjang.' }
      : order.status === 'PENDING'
        ? { title: 'Menunggu pembayaran', body: 'Selesaikan pembayaran untuk mengaktifkan pesanan. Halaman ini otomatis diperbarui setelah pembayaran tercatat.' }
        : { title: 'Pesanan tidak aktif', body: 'Pesanan ini sudah tidak bisa dibayar. Anda bisa membuat pesanan baru kapan saja.' };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{heading.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{heading.body}</p>
        <div className="mt-4"><OrderStatusBadge status={order.status} /></div>
      </div>

      <Card className="p-6"><OrderLines order={order} /></Card>

      {error && <Alert>{error}</Alert>}

      {order.status === 'PAID' && invitationId && (
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href={`/dashboard/invitations/${invitationId}`} size="lg">{order.kind === 'NEW' ? 'Atur & publikasikan undangan' : 'Lihat undangan'}</LinkButton>
          <LinkButton href="/dashboard" variant="secondary" size="lg">Ke dashboard</LinkButton>
        </div>
      )}

      {order.status === 'PENDING' && (
        <div className="space-y-3">
          {syncError && <Alert tone="warn">Sinkronisasi pembayaran belum berhasil: {syncError}</Alert>}
          {needsTransactionId && <Card className="space-y-3 p-5">
            <p className="text-sm text-ink-soft">Status belum ditemukan melalui nomor pesanan. Untuk BSI/BI-SNAP, mintalah bantuan penjual untuk memeriksa Transaction ID Midtrans. Jangan membayar ulang sebelum status dipastikan.</p>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void reconcile(); }}>
              <Field label="Transaction ID Midtrans" hint="Bukan Order ID atau nomor virtual account. Status dan nominal tetap diverifikasi langsung ke Midtrans.">
                <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} maxLength={128} autoComplete="off" />
              </Field>
              <Button type="submit" variant="secondary" loading={busy} disabled={!transactionId.trim()}>Periksa status pembayaran</Button>
            </form>
          </Card>}
          {unuploaded ? (
            <Alert tone="warn">Ada file yang belum selesai terunggah (mungkin halaman sempat tertutup). Batalkan pesanan ini lalu buat ulang dari editor: isian teks Anda tersimpan otomatis.</Alert>
          ) : (
            <Button size="lg" className="w-full" onClick={pay} loading={busy}>Lanjutkan pembayaran</Button>
          )}
          <div className="flex justify-center">
            <Button variant="ghost" onClick={cancel} disabled={busy}>Batalkan pesanan</Button>
          </div>
        </div>
      )}

      {!['PAID', 'PENDING'].includes(order.status) && (
        <div className="flex justify-center"><LinkButton href="/templates" size="lg">Lihat template</LinkButton></div>
      )}
      <p className="text-center text-sm text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">← Kembali ke dashboard</Link>
      </p>
    </div>
  );
}
