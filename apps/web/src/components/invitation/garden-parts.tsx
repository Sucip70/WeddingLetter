// Bingkai berukir untuk desain "Taman Botani": garis rangkap tipis dengan hiasan filigran di keempat sudut (botani-art.ts).
// Dipakai untuk bingkai foto (PhotoFrame 'garden') dan bingkai di tepi sampul. Warna = warna utama tema (--p).
import type { ReactNode } from 'react';
import { FiligreeCorner } from './bloom-parts';

// Bingkai foto: foto di tengah, garis rangkap mengelilingi, hiasan sudut menjorok sedikit keluar.
export function GardenFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative p-3" style={{ color: 'var(--p)' }}>
      <div className="pointer-events-none absolute inset-0 rounded-[10px]" style={{ border: '1.4px solid currentColor' }} aria-hidden />
      <div className="pointer-events-none absolute inset-[5px] rounded-[7px]" style={{ border: '0.8px solid currentColor', opacity: 0.55 }} aria-hidden />
      <div className="relative overflow-hidden rounded-[5px]">{children}</div>
      <FiligreeCorner lines={false} rotate={0} className="pointer-events-none absolute -left-1.5 -top-1.5 w-11" />
      <FiligreeCorner lines={false} rotate={90} className="pointer-events-none absolute -right-1.5 -top-1.5 w-11" />
      <FiligreeCorner lines={false} rotate={180} className="pointer-events-none absolute -bottom-1.5 -right-1.5 w-11" />
      <FiligreeCorner lines={false} rotate={270} className="pointer-events-none absolute -bottom-1.5 -left-1.5 w-11" />
    </div>
  );
}

// Bingkai di tepi sampul (di bawah karangan daun di sudut): garis rangkap + hiasan filigran di sudutnya.
export function GardenPageFrame() {
  return (
    <div className="pointer-events-none absolute inset-[18px]" style={{ color: 'var(--p)' }} aria-hidden>
      <div className="absolute inset-0 rounded-[14px]" style={{ border: '1.4px solid currentColor', opacity: 0.8 }} />
      <div className="absolute inset-[6px] rounded-[10px]" style={{ border: '0.8px solid currentColor', opacity: 0.5 }} />
      <FiligreeCorner lines={false} rotate={0} className="absolute -left-1 -top-1 w-14" />
      <FiligreeCorner lines={false} rotate={90} className="absolute -right-1 -top-1 w-14" />
      <FiligreeCorner lines={false} rotate={180} className="absolute -bottom-1 -right-1 w-14" />
      <FiligreeCorner lines={false} rotate={270} className="absolute -bottom-1 -left-1 w-14" />
    </div>
  );
}
