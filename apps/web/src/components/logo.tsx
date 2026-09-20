import Link from 'next/link';

export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <rect x="2.5" y="6.5" width="27" height="19" rx="3.5" fill="#b4533c" />
      <path d="M4 9.5l12 9 12-9" stroke="#fbf7f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 22.4c-2.9-1.9-4.4-3.4-4.4-5.1a2.3 2.3 0 0 1 4.4-.9 2.3 2.3 0 0 1 4.4.9c0 1.7-1.5 3.2-4.4 5.1Z" fill="#fbf7f1" opacity="0" />
    </svg>
  );
}

export function Logo({ href = '/', light }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="WeddingLetter — beranda">
      <LogoMark />
      <span className={`font-display text-xl tracking-tight ${light ? 'text-ivory' : 'text-ink'}`}>
        Wedding<span className="text-rose">Letter</span>
      </span>
    </Link>
  );
}
