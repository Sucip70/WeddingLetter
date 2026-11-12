import Link from 'next/link';
import Image from 'next/image';

export function LogoMark({ className = 'h-8 w-8', light = false }: { className?: string; light?: boolean }) {
  return (
    <Image src={light ? '/brand/logo-mark-light.png' : '/brand/logo-mark.png'}
      width={512} height={512} alt="" aria-hidden unoptimized
      className={`shrink-0 object-contain ${className}`} />
  );
}

export function Logo({ href = '/', light }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="WeddingLetter — beranda">
      <LogoMark light={light} />
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? 'text-ivory' : 'text-[#80051c]'}`}>
        WeddingLetter
      </span>
    </Link>
  );
}
