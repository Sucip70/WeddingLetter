'use client';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Field, Input, Modal, Select } from './ui';
import { GuestQr } from './guest-qr';
import { QrScanner } from './qr-scanner';
import { api, errorMessage } from '../lib/client-api';
import { guestLink, guestPhone, scannedGuestToken, type InvitedGuest } from '../lib/guest-list';
import { formatDateTime } from '../lib/format';

export function GuestManager({ invitationId, link, checkin = false, active }: { invitationId: string; link: string; checkin?: boolean; active: boolean }) {
  const endpoint = `/invitations/${invitationId}/guest-list`;
  const [guests, setGuests] = useState<InvitedGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<InvitedGuest | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [qr, setQr] = useState<InvitedGuest | null>(null);
  const [candidate, setCandidate] = useState<InvitedGuest | null>(null);
  const [count, setCount] = useState('1');
  const [manualQr, setManualQr] = useState('');
  const reload = useCallback(async () => { setGuests(await api<InvitedGuest[]>(endpoint)); }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController();
    void api<InvitedGuest[]>(endpoint, { signal: controller.signal }).then(setGuests).catch((err) => {
      if (!controller.signal.aborted) setError(errorMessage(err));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint]);
  async function act(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await reload(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const activity = (guest: InvitedGuest, action: string) => api(`${endpoint}/${guest.id}/activity`, { body: { action } });
  async function lookup(raw: string) {
    const token = scannedGuestToken(raw);
    if (!token) { setError('QR tidak dikenali. Gunakan QR tamu WeddingLetter atau cari nama secara manual.'); return; }
    await act(async () => {
      const guest = await api<InvitedGuest>(`${endpoint}/lookup`, { body: { token } });
      setCandidate(guest); setCount(String(guest.partySize));
    });
  }
  const filtered = guests.filter((g) => `${g.name} ${g.phone ?? ''}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'unshared' ? !g.sharedAt : filter === 'shared' ? !!g.sharedAt : !!g.checkedInAt)));
  const arrived = guests.filter((g) => g.checkedInAt).sort((a, b) => b.checkedInAt!.localeCompare(a.checkedInAt!));
  if (loading) return <p role="status">Memuat daftar tamu…</p>;
  return <div className="space-y-5">
    {error && <Alert tone="danger">{error}</Alert>}
    {notice && <Alert>{notice}</Alert>}
    <div className="flex flex-wrap gap-3 text-sm">
      <Badge>{guests.length} nama/keluarga</Badge><Badge tone="sage">{guests.filter((g) => g.sharedAt).length} sudah dibagikan</Badge>
      <Badge>{arrived.length} check-in · {arrived.reduce((n, g) => n + g.checkedInCount, 0)} orang hadir</Badge>
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(async () => undefined)}>Muat ulang</Button>
    </div>
    {!active && <Alert tone="warn">Link tamu dan QR dapat digunakan setelah undangan aktif. Check-in hanya tersedia selama undangan aktif.</Alert>}
    {checkin ? active && <Card className="space-y-4 p-5">
      <h2 className="font-semibold">Scan kehadiran</h2><p className="text-sm text-ink-soft">Periksa nama tamu, lalu konfirmasikan jumlah orang. Memindai QR tidak otomatis mencatat kehadiran.</p>
      {!candidate && !busy && <QrScanner onScan={(text) => void lookup(text)} />}
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void lookup(manualQr); }}>
        <Input aria-label="Link atau kode QR tamu" placeholder="Tempel link atau kode QR" value={manualQr} maxLength={2000} onChange={(e) => setManualQr(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={busy || !manualQr.trim()}>Periksa QR</Button>
      </form>
    </Card> : <Card className="p-5">
      <h2 className="mb-4 font-semibold">{editing ? 'Edit tamu' : 'Tambah tamu'}</h2>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void act(async () => {
        await api(editing ? `${endpoint}/${editing.id}` : endpoint, { method: editing ? 'PATCH' : 'POST', body: { name, phone, partySize: Number(partySize) } });
        setEditing(null); setName(''); setPhone(''); setPartySize('1');
      }); }}>
        <Field label="Nama tamu / keluarga" required><Input required value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="WhatsApp (opsional)" hint="Contoh 0812… atau +62812…"><Input type="tel" value={phone} maxLength={24} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="Perkiraan jumlah orang"><Input type="number" min={1} max={50} required value={partySize} onChange={(e) => setPartySize(e.target.value)} /></Field>
        <div className="flex items-end gap-2"><Button type="submit" loading={busy}>{editing ? 'Simpan' : 'Tambah tamu'}</Button>{editing && <Button variant="secondary" onClick={() => { setEditing(null); setName(''); setPhone(''); setPartySize('1'); }}>Batal</Button>}</div>
      </form>
    </Card>}
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap gap-3"><Input aria-label="Cari nama tamu" placeholder="Cari nama atau WhatsApp…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Filter tamu" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Semua tamu</option><option value="unshared">Belum dibagikan</option><option value="shared">Sudah dibagikan</option><option value="arrived">Sudah check-in</option></Select></div>
      {!checkin && <p className="text-xs text-ink-soft">Salin link dan membuka WhatsApp dicatat sebagai aktivitas. Tandai “Sudah dibagikan” setelah pesan benar-benar dikirim.</p>}
      {!filtered.length && <p className="text-sm text-ink-soft">Belum ada tamu yang cocok.</p>}
      {filtered.map((guest) => <div key={guest.id} className="space-y-3 border-t border-line py-4">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{guest.name}</h3><Badge tone={guest.sharedAt ? 'sage' : 'neutral'}>{guest.sharedAt ? 'Sudah dibagikan' : 'Belum dibagikan'}</Badge>{guest.checkedInAt && <Badge tone="sage">Sudah check-in · {guest.checkedInCount} orang</Badge>}</div>
        <p className="text-xs text-ink-soft">{guest.phone || 'Tanpa nomor WhatsApp'} · perkiraan {guest.partySize} orang{guest.sharedAt ? ` · dibagikan ${formatDateTime(guest.sharedAt)}` : ''}</p>
        {guest.lastCopiedAt && <p className="text-xs text-ink-soft">Link disalin {formatDateTime(guest.lastCopiedAt)}</p>}
        {guest.lastWhatsappOpenedAt && <p className="text-xs text-ink-soft">WhatsApp dibuka {formatDateTime(guest.lastWhatsappOpenedAt)}</p>}
        {guest.checkedInAt && <p className="text-xs text-ink-soft">Tiba {formatDateTime(guest.checkedInAt)}</p>}
        <div className="flex flex-wrap items-center gap-2">
          {checkin ? <Button size="sm" variant="secondary" disabled={busy || !active} onClick={() => void lookup(guest.token)}>Periksa / check-in manual</Button> : <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(async () => { await navigator.clipboard.writeText(guestLink(link, guest.token)); await activity(guest, 'copied'); setNotice('Link tersalin.'); })}>Salin link</Button>
            <a className="rounded-lg border border-line px-3 py-2 text-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${guestPhone(guest.phone)}?text=${encodeURIComponent(`Kepada Yth. ${guest.name},\n\nKami mengundang Anda ke hari bahagia kami. Buka undangan dan QR kehadiran melalui tautan berikut:\n${guestLink(link, guest.token)}`)}`} onClick={() => void act(async () => { await activity(guest, 'whatsapp'); })}>WhatsApp</a>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(async () => { await activity(guest, guest.sharedAt ? 'unshared' : 'shared'); })}>{guest.sharedAt ? 'Tandai belum dibagikan' : 'Tandai sudah dibagikan'}</Button>
            <Button size="sm" variant="secondary" onClick={() => { setEditing(guest); setName(guest.name); setPhone(guest.phone ?? ''); setPartySize(String(guest.partySize)); }}>Edit</Button>
            {!guest.checkedInAt && <Button size="sm" variant="secondary" disabled={busy} onClick={() => { if (window.confirm(`Hapus ${guest.name} dari daftar? Link dan QR tamu ini akan dinonaktifkan.`)) void act(async () => { await api(`${endpoint}/${guest.id}`, { method: 'DELETE' }); }); }}>Hapus</Button>}
          </>}
          <Button size="sm" variant="secondary" onClick={() => setQr(guest)}>Lihat QR</Button>
        </div>
      </div>)}
    </Card>
    {checkin && <Card className="space-y-3 p-5"><h2 className="font-semibold">Riwayat kedatangan</h2>{arrived.length ? arrived.map((g) => <p key={g.id} className="text-sm">{g.name} · {g.checkedInCount} orang · {formatDateTime(g.checkedInAt!)}</p>) : <p className="text-sm text-ink-soft">Belum ada tamu check-in. Data ini terpisah dari RSVP.</p>}</Card>}
    <Modal title="QR tamu" open={!!qr} onClose={() => setQr(null)}>{qr && <GuestQr value={guestLink(link, qr.token)} name={qr.name} />}</Modal>
    <Modal title="Konfirmasi kedatangan" open={!!candidate} onClose={() => setCandidate(null)}>{candidate && <div className="space-y-4">
      <h3 className="text-lg font-semibold">{candidate.name}</h3>
      {candidate.checkedInAt ? <Alert tone="warn">Sudah check-in pada {formatDateTime(candidate.checkedInAt)} sebanyak {candidate.checkedInCount} orang. Tidak dihitung ulang.</Alert> : <>
        <Field label="Jumlah orang yang datang"><Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <Button loading={busy} onClick={() => void act(async () => {
          const result = await api<{ guest: InvitedGuest; alreadyCheckedIn: boolean }>(`${endpoint}/check-in`, { body: { token: candidate.token, count: Number(count) } });
          setNotice(result.alreadyCheckedIn ? `${result.guest.name} sudah check-in sebelumnya. Tidak dihitung ulang.` : `${result.guest.name} berhasil check-in, ${result.guest.checkedInCount} orang.`); setCandidate(null);
        })}>Konfirmasi check-in</Button>
      </>}
    </div>}</Modal>
  </div>;
}
