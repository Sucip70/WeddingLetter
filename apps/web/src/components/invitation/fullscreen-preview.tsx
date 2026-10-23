'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Area halaman web yang lazim terlihat di ponsel setelah bilah browser mengambil sebagian tinggi layar.
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 700;
const watermarkSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="150"><text x="20" y="90" font-family="sans-serif" font-size="20" font-weight="700" fill="#000" fill-opacity=".09" transform="rotate(-24 110 75)" letter-spacing="3">PRATINJAU</text></svg>`,
);

function useDesktopScale() {
  const [scale, setScale] = useState<number | null>(null);
  useEffect(() => {
    const fit = () => setScale(window.innerWidth >= 768 ? Math.min((window.innerHeight * 0.92) / PHONE_HEIGHT, (window.innerWidth * 0.9) / PHONE_WIDTH) : null);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

export function FullscreenInvitationPreview({ children, onClose, watermark = false }: { children: ReactNode; onClose: () => void; watermark?: boolean }) {
  const scale = useDesktopScale();
  const phone = scale !== null;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      requestAnimationFrame(() => opener?.focus());
    };
  }, [onClose]);

  return createPortal(
    <div className={`fixed inset-0 z-[100] overflow-hidden bg-[#171210] ${phone ? 'flex flex-col items-center justify-center' : ''}`} role="dialog" aria-modal="true" aria-label="Pratinjau undangan layar penuh">
      <div
        className={phone ? 'relative overflow-hidden rounded-[1.6rem] bg-white shadow-[0_0_80px_rgba(0,0,0,0.55)] ring-8 ring-[#2a221d]' : 'relative mx-auto h-full w-full max-w-[480px] overflow-hidden bg-white shadow-[0_0_80px_rgba(0,0,0,0.55)]'}
        style={phone ? { width: PHONE_WIDTH * scale, height: PHONE_HEIGHT * scale } : undefined}
      >
        <div className="h-full w-full" style={phone ? { width: PHONE_WIDTH, height: PHONE_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}>
          {children}
        </div>
        {watermark && (
          <>
            <div className="pointer-events-none absolute inset-0 z-[110]" style={{ backgroundImage: `url("data:image/svg+xml,${watermarkSvg}")` }} aria-hidden />
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-[115] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold tracking-wider text-white backdrop-blur" aria-hidden>
              PRATINJAU · BELUM DIBELI
            </div>
          </>
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 z-[120] flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/40 bg-black/55 text-2xl leading-none text-white shadow-lg backdrop-blur-md transition hover:bg-black/75 focus-visible:ring-4 focus-visible:ring-white/70"
          style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
          aria-label="Tutup pratinjau"
        >
          &times;
        </button>
      </div>
      {phone && <p className="mt-3 text-xs text-white/60">Ukuran layar ponsel {PHONE_WIDTH}×{PHONE_HEIGHT} (area tampil browser ponsel)</p>}
    </div>,
    document.body,
  );
}
