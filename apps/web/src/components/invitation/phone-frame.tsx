import type { ReactNode } from 'react';

// Undangan dirancang untuk lebar ponsel ±390px. Bingkai ini merender pada ukuran logis 390x810 lalu
// menskalakannya, jadi tampilan di pratinjau sama persis dengan di ponsel sungguhan.
const W = 390;
const H = 810;
const SCALE = { sm: 0.6, md: 0.72, lg: 0.88 } as const;

const watermarkSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="150"><text x="20" y="90" font-family="sans-serif" font-size="20" font-weight="700" fill="#000" fill-opacity=".09" transform="rotate(-24 110 75)" letter-spacing="3">PRATINJAU</text></svg>`,
);

export function PhoneFrame({ children, size = 'md', watermark, className = '' }: { children: ReactNode; size?: keyof typeof SCALE; watermark?: boolean; className?: string }) {
  const k = SCALE[size];
  return (
    <div className={`relative mx-auto w-fit rounded-[2.4rem] bg-[#1d1815] p-2.5 shadow-[0_24px_60px_-12px_rgba(43,36,32,0.45)] ${className}`}>
      <div className="absolute left-1/2 top-3.5 z-30 h-4 w-16 -translate-x-1/2 rounded-full bg-[#1d1815]" aria-hidden />
      <div className="relative overflow-hidden rounded-[1.9rem] bg-white" style={{ width: W * k, height: H * k }}>
        <div style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
        {watermark && (
          <>
            <div className="pointer-events-none absolute inset-0 z-20" style={{ backgroundImage: `url("data:image/svg+xml,${watermarkSvg}")` }} aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 top-[26px] z-20 bg-ink/80 py-1 text-center text-[10px] font-medium tracking-wider text-white" aria-hidden>
              PRATINJAU · BELUM DIBELI
            </div>
          </>
        )}
      </div>
    </div>
  );
}
