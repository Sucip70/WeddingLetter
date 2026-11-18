'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client-api';
import type { LegalPolicy, PublicSettings } from '@/lib/legal';

export function useCheckoutTerms() {
  const [policy, setPolicy] = useState<LegalPolicy | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    api<PublicSettings>('settings/public').then((r) => {
      if (!r.policy?.version) throw new Error('Ketentuan belum tersedia');
      if (!disposed) { setPolicy(r.policy); setAccepted(false); }
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, []);
  return { policy, accepted, setAccepted, failed, ready: !!policy && accepted };
}

export function TermsConsent({ terms, extension = false }: { terms: ReturnType<typeof useCheckoutTerms>; extension?: boolean }) {
  const { policy, accepted, setAccepted, failed } = terms;
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-paper p-4" id="checkout-agreement">
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} disabled={!policy}
          className="mt-1 h-4 w-4 shrink-0 accent-rose" aria-label="Saya menyetujui Syarat & Ketentuan" />
        <span>Saya menyetujui <Link href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Syarat &amp; Ketentuan</Link>, termasuk ketentuan masa aktif, pembatalan, dan pengembalian dana.</span>
      </label>
      <p className="text-xs leading-relaxed text-ink-soft">{extension
        ? 'Perpanjangan diterapkan setelah pembayaran. Pengajuan refund dalam 48 jam diperiksa manual dan hanya berlaku jika manfaatnya belum digunakan.'
        : policy ? `Masa aktif mulai saat dipublikasikan. Draf berbayar disimpan ${policy.settings.draftRetentionDays} hari sejak pembayaran. Refund penuh dapat diajukan dalam 48 jam selama belum pernah dipublikasikan.` : 'Memuat ketentuan pemesanan…'}</p>
      <p className="text-xs text-ink-soft">Informasi penggunaan data tersedia dalam <Link href="/kebijakan-privasi" target="_blank" rel="noopener noreferrer" className="underline">Kebijakan Privasi</Link>.</p>
      {failed && <p role="alert" className="text-sm text-rose">Ketentuan belum dapat dimuat. Muat ulang halaman sebelum melanjutkan.</p>}
    </div>
  );
}
