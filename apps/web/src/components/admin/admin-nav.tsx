'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../ui';

const ITEMS = [
  { href: '/admin', label: 'Ringkasan', exact: true },
  { href: '/admin/orders', label: 'Pesanan' },
  { href: '/admin/invitations', label: 'Undangan' },
  { href: '/admin/templates', label: 'Template' },
  { href: '/admin/pricing', label: 'Harga & kupon' },
  { href: '/admin/users', label: 'Pengguna' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible lg:sticky lg:top-24 lg:self-start">
      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-widest text-ink-soft lg:block">Panel admin</p>
      {ITEMS.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? 'page' : undefined}
            className={cn('whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors', active ? 'bg-rose text-white' : 'text-ink-soft hover:bg-ink/5 hover:text-ink')}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
