'use client';
import { useSyncExternalStore } from 'react';
import { GuestQr } from './guest-qr';

const subscribe = () => () => undefined;
const browserOrigin = () => window.location.origin;
const serverOrigin = () => '';

export function GuestTicket({ name, token, slug }: { name: string; token: string; slug: string }) {
  const origin = useSyncExternalStore(subscribe, browserOrigin, serverOrigin);
  return (
    <section data-guest-ticket aria-label="QR kehadiran" className="relative z-[1] px-6 pb-24 pt-10 text-center">
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-white p-5 text-ink shadow-sm">
        <h2 className="mb-5 font-display text-2xl">QR Kehadiran</h2>
        {origin ? <GuestQr name={name} value={`${origin}/u/${encodeURIComponent(slug)}?guest=${encodeURIComponent(token)}`} /> : <p role="status">Menyiapkan QR…</p>}
      </div>
    </section>
  );
}
