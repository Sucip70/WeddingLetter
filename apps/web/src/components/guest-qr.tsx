'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';

export function GuestQr({ value, name }: { value: string; name: string }) {
  const [image, setImage] = useState<{ value: string; url: string }>();
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    void import('qrcode').then((qr) => qr.toDataURL(value, { width: 320, margin: 4, errorCorrectionLevel: 'M' })).then((url) => {
      if (!cancelled) setImage({ value, url });
    }).catch(() => { if (!cancelled) setError('QR gagal dibuat. Silakan coba lagi.'); });
    return () => { cancelled = true; };
  }, [value]);
  return <div className="space-y-3 text-center">
    <p className="font-semibold">{name}</p>
    {image?.value === value ? <><img className="mx-auto h-64 w-64 bg-white" src={image.url} alt={`QR kehadiran ${name}`} width={320} height={320} /><a className="inline-block rounded-lg border border-line px-4 py-2 text-sm" download="qr-kehadiran.png" href={image.url}>Unduh QR</a></> : <p role="status">{error || 'Menyiapkan QR…'}</p>}
    <p className="text-xs text-ink-soft">Tunjukkan QR ini kepada petugas saat tiba. Jangan bagikan kepada orang lain.</p>
  </div>;
}
