'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { authApi, errorMessage } from '@/lib/client-api';
import type { SessionUser } from '@/lib/types';
import { Alert, Button, Field, Input } from './ui';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleId {
  initialize(config: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

function GoogleButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const render = () => {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onCredential(r.credential) });
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: 300, text: 'continue_with', shape: 'pill', locale: 'id' });
    };
    if (window.google) return render();
    const existing = document.getElementById('gsi-client');
    if (existing) {
      existing.addEventListener('load', render);
      return () => existing.removeEventListener('load', render);
    }
    const script = document.createElement('script');
    script.id = 'gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [onCredential]);
  if (!GOOGLE_CLIENT_ID) return null;
  return <div ref={ref} className="flex justify-center" />;
}

// Login tanpa kata sandi: email + kode OTP (atau Google). Dipakai di halaman /login dan dialog saat checkout,
// jadi user tidak perlu meninggalkan editor (file yang sudah dipilih tidak hilang).
export function LoginPanel({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi('otp-request', { email });
      setStep('code');
      setCooldown(60);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await authApi<{ user: SessionUser }>('otp-verify', { email, code, name: name || undefined });
      onSuccess(user);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  async function google(idToken: string) {
    setError('');
    try {
      const { user } = await authApi<{ user: SessionUser }>('google', { idToken });
      onSuccess(user);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="space-y-5">
      {GOOGLE_CLIENT_ID && step === 'email' && (
        <>
          <GoogleButton onCredential={google} />
          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-line" /> atau dengan kode email <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      {step === 'email' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <Field label="Email" required>
            <Input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label="Nama" hint="Untuk akun baru. Boleh dikosongkan bila sudah pernah daftar.">
            <Input autoComplete="name" placeholder="Nama Anda" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Kirim kode ke email</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p className="text-sm text-ink-soft">
            Kami mengirim kode 6 digit ke <strong className="text-ink">{email}</strong>. Berlaku 10 menit.
          </p>
          <Field label="Kode masuk" required>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-[0.4em]"
              autoFocus
            />
          </Field>
          {process.env.NODE_ENV !== 'production' && <p className="text-xs text-ink-soft">Mode development tanpa layanan email: kode dicetak di log server API.</p>}
          {error && <Alert>{error}</Alert>}
          <Button type="submit" loading={loading} className="w-full" size="lg" disabled={code.length !== 6}>Masuk</Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="text-ink-soft hover:text-ink" onClick={() => { setStep('email'); setCode(''); setError(''); }}>← Ganti email</button>
            <button type="button" className="text-rose disabled:text-ink-soft" disabled={cooldown > 0 || loading} onClick={() => requestCode()}>
              {cooldown > 0 ? `Kirim ulang (${cooldown}d)` : 'Kirim ulang kode'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
