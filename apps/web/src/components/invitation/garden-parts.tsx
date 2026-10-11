// Bingkai berukir untuk desain "Taman Botani": garis rangkap tipis dengan hiasan filigran di keempat sudut (botani-art.ts).
// Dipakai untuk bingkai foto (PhotoFrame 'garden') dan bingkai di tepi sampul. Warna = warna utama tema (--p).
import type { ReactNode } from 'react';
import { FiligreeCorner, RoseDivider } from './bloom-parts';

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

// Floral Romantis: bingkai garis emas tipis (rangkap) di seluruh halaman, karangan sudut menutupi garisnya,
// ditambah untaian bunga di tengah tepi atas & bawah (seperti undangan bunga cetak).
export function FloralPageFrame() {
  return (
    <div className="pointer-events-none absolute inset-[16px]" aria-hidden>
      <div className="absolute inset-0" style={{ border: '1.4px solid #c9a24d', opacity: 0.95, boxShadow: '0 0 0 .5px rgba(255,255,255,.5)' }} />
      <div className="absolute inset-[5px]" style={{ border: '0.7px solid #c9a24d', opacity: 0.7 }} />
      <RoseDivider className="absolute -top-3 left-1/2 w-44 -translate-x-1/2 opacity-95" />
      <RoseDivider className="absolute -bottom-3 left-1/2 w-44 -translate-x-1/2 rotate-180 opacity-95" />
    </div>
  );
}
