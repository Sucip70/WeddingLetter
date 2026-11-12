'use client';
import { useState } from 'react';
import { Button, Modal } from './ui';
import { GuestQr } from './guest-qr';

export function GuestTicket({ name, token, slug }: { name: string; token: string; slug: string }) {
  const [open, setOpen] = useState(false);
  return <><div className="fixed bottom-24 right-4 z-50"><Button onClick={() => setOpen(true)}>QR Kehadiran</Button></div>
    <Modal title="Tiket kehadiran" open={open} onClose={() => setOpen(false)}>
      {open && <GuestQr name={name} value={`${window.location.origin}/u/${encodeURIComponent(slug)}?guest=${encodeURIComponent(token)}`} />}
    </Modal></>;
}
