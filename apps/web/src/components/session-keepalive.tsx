'use client';

import { useEffect } from 'react';

const KEY = 'wl:session-refreshed';
const EVERY_MS = 24 * 60 * 60 * 1000;

// Memperpanjang sesi (bergulir) paling sering sekali sehari selama user aktif, jadi user yang rutin datang
// tidak perlu minta kode OTP lagi. Gagal diam-diam: paling buruk user diminta login ulang saat sesi habis.
export function SessionKeepAlive() {
  useEffect(() => {
    let last = 0;
    try {
      last = Number(localStorage.getItem(KEY)) || 0;
    } catch {
      /* penyimpanan diblokir: tetap coba refresh */
    }
    if (Date.now() - last < EVERY_MS) return;
    void fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' })
      .then((res) => {
        if (!res.ok) return;
        try {
          localStorage.setItem(KEY, String(Date.now()));
        } catch {
          /* abaikan */
        }
      })
      .catch(() => undefined);
  }, []);
  return null;
}
