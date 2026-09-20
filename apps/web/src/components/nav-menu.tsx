'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/client-api';
import type { SessionUser } from '@/lib/types';
import { LinkButton, cn } from './ui';

const LINKS = [
  { href: '/templates', label: 'Template' },
  { href: '/pricing', label: 'Harga' },
  { href: '/#cara-kerja', label: 'Cara kerja' },
];

export function NavMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await authApi('logout');
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  const account = user ? (
    <>
      {user.role === 'ADMIN' && (
        <Link href="/admin" className="text-sm font-medium text-ink-soft hover:text-ink" onClick={() => setOpen(false)}>
          Admin
        </Link>
      )}
      <Link href="/dashboard" className="text-sm font-medium text-ink-soft hover:text-ink" onClick={() => setOpen(false)}>
        Undangan saya
      </Link>
      <button onClick={logout} className="text-sm font-medium text-ink-soft hover:text-rose">
        Keluar
      </button>
    </>
  ) : (
    <LinkButton href={`/login?next=${encodeURIComponent(pathname)}`} variant="secondary" size="sm">
      Masuk
    </LinkButton>
  );

  return (
    <>
      <nav className="hidden items-center gap-7 md:flex" aria-label="Utama">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={cn('text-sm font-medium hover:text-ink', pathname === l.href ? 'text-ink' : 'text-ink-soft')}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="hidden items-center gap-5 md:flex">{account}</div>

      <button className="rounded-lg p-2 text-ink md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-ivory px-4 pb-5 pt-2 shadow-lg md:hidden">
          <div className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="py-1 text-base font-medium text-ink" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col items-start gap-4 border-t border-line pt-4">{account}</div>
          </div>
        </div>
      )}
    </>
  );
}
