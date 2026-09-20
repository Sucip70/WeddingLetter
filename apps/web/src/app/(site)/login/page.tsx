import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { safeNext } from '@/lib/nav';
import { getUser } from '@/lib/session';
import { LoginClient } from './login-client';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Masuk ke WeddingLetter</h1>
        <p className="mt-3 text-ink-soft">Tanpa kata sandi. Cukup email dan kode 6 digit. Akun baru dibuat otomatis.</p>
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-8">
        <LoginClient next={next} />
      </div>
    </div>
  );
}
