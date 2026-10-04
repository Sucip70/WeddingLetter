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

type Mode = 'login' | 'register' | 'otp';
type Step = 'form' | 'code';

// Login & daftar: Google, atau email + kata sandi (akun baru diverifikasi lewat kode 6 digit ke email).
// Akun lama yang dibuat sebelum ada kata sandi (daftar/masuk hanya lewat kode email) tetap bisa masuk lewat
// tab "Masuk tanpa kata sandi". Dipakai di halaman /login dan dialog saat checkout.
export function LoginPanel({ onSuccess }: { onSuccess: (user: SessionUser) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  function switchMode(next: Mode) {
    setMode(next);
    setStep('form');
    setError('');
    setCode('');
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await authApi<{ user: SessionUser }>('login', { email, password });
      onSuccess(user);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  async function register(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi<{ user: SessionUser } | { needsVerification: true }>('register', { email, password, name });
      if ('user' in result) {
        // Sudah terverifikasi sebelumnya (misal pernah masuk via Google) — langsung masuk.
        onSuccess(result.user);
        return;
      }
      setStep('code');
      setCooldown(60);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyRegistration(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await authApi<{ user: SessionUser }>('otp-verify', { email, code, name });
      onSuccess(user);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  async function resendCode() {
    setError('');
    try {
      await authApi('otp-request', { email });
      setCooldown(60);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function requestOtpCode(e: FormEvent) {
    e.preventDefault();
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

  async function verifyOtpLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await authApi<{ user: SessionUser }>('otp-verify', { email, code });
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

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? 'bg-rose text-white' : 'text-ink-soft hover:text-ink'}`;

  return (
    <div className="space-y-5">
      <GoogleButton onCredential={google} />
      {GOOGLE_CLIENT_ID && (
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="h-px flex-1 bg-line" /> atau dengan email <span className="h-px flex-1 bg-line" />
        </div>
      )}

      {step === 'form' && (
        <div className="flex gap-1 rounded-full bg-paper p-1">
          <button type="button" className={tabClass(mode === 'login')} onClick={() => switchMode('login')}>Masuk</button>
          <button type="button" className={tabClass(mode === 'register')} onClick={() => switchMode('register')}>Daftar</button>
        </div>
      )}

      {mode === 'login' && step === 'form' && (
        <form onSubmit={login} className="space-y-4">
          <Field label="Email" required>
            <Input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label="Kata sandi" required>
            <Input type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Masuk</Button>
          <p className="text-center text-sm text-ink-soft">
            Daftar sebelum ada kata sandi, atau masuk lewat Google?{' '}
            <button type="button" className="text-rose hover:underline" onClick={() => switchMode('otp')}>Masuk tanpa kata sandi</button>
          </p>
        </form>
      )}

      {mode === 'register' && step === 'form' && (
        <form onSubmit={register} className="space-y-4">
          <Field label="Nama" required>
            <Input required autoComplete="name" placeholder="Nama Anda" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Email" required>
            <Input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Kata sandi" required hint="Minimal 8 karakter.">
            <Input type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" loading={loading} className="w-full" size="lg">Buat akun</Button>
        </form>
      )}

      {mode === 'register' && step === 'code' && (
        <form onSubmit={verifyRegistration} className="space-y-4">
          <p className="text-sm text-ink-soft">
            Kami mengirim kode verifikasi 6 digit ke <strong className="text-ink">{email}</strong>. Berlaku 10 menit.
          </p>
          <Field label="Kode verifikasi" required>
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
          <Button type="submit" loading={loading} className="w-full" size="lg" disabled={code.length !== 6}>Verifikasi &amp; masuk</Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="text-ink-soft hover:text-ink" onClick={() => { setStep('form'); setCode(''); setError(''); }}>← Kembali</button>
            <button type="button" className="text-rose disabled:text-ink-soft" disabled={cooldown > 0} onClick={resendCode}>
              {cooldown > 0 ? `Kirim ulang (${cooldown}d)` : 'Kirim ulang kode'}
            </button>
          </div>
        </form>
      )}

      {mode === 'otp' && (
        <div className="space-y-4">
          <button type="button" className="text-sm text-ink-soft hover:text-ink" onClick={() => switchMode('login')}>← Kembali ke masuk dengan kata sandi</button>
          {step === 'form' ? (
            <form onSubmit={requestOtpCode} className="space-y-4">
              <Field label="Email" required hint="Untuk akun lama yang belum punya kata sandi.">
                <Input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              </Field>
              {error && <Alert>{error}</Alert>}
              <Button type="submit" loading={loading} className="w-full" size="lg">Kirim kode ke email</Button>
            </form>
          ) : (
            <form onSubmit={verifyOtpLogin} className="space-y-4">
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
                <button type="button" className="text-ink-soft hover:text-ink" onClick={() => { setStep('form'); setCode(''); setError(''); }}>← Ganti email</button>
                <button type="button" className="text-rose disabled:text-ink-soft" disabled={cooldown > 0} onClick={resendCode}>
                  {cooldown > 0 ? `Kirim ulang (${cooldown}d)` : 'Kirim ulang kode'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
