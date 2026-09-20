import type { Theme } from '@/lib/types';
import { Corner, Divider } from './invitation/ornaments';

const HEADING = { script: 'var(--font-script)', serif: 'var(--font-cormorant)', sans: 'var(--font-jakarta)' } as const;

// Miniatur sampul template (ringan, tanpa JS) untuk kartu katalog.
export function TemplateThumb({ theme, imageUrl, className = '' }: { theme: Theme; imageUrl?: string | null; className?: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center ${className}`}
      style={
        {
          '--p': theme.primary,
          '--s': theme.secondary,
          '--bg': theme.background,
          background: `linear-gradient(165deg, color-mix(in srgb, ${theme.primary} 22%, ${theme.background}), ${theme.background} 52%, color-mix(in srgb, ${theme.primary} 10%, color-mix(in srgb, ${theme.secondary} 12%, ${theme.background})))`,
          color: theme.primary,
        } as React.CSSProperties
      }
    >
      <Corner className="absolute left-1.5 top-1.5 w-14" rotate={0} />
      <Corner className="absolute right-1.5 top-1.5 w-14" rotate={90} />
      <Corner className="absolute bottom-1.5 right-1.5 w-14" rotate={180} />
      <Corner className="absolute bottom-1.5 left-1.5 w-14" rotate={270} />
      <p className="text-[8px] uppercase tracking-[0.3em]" style={{ color: theme.text, opacity: 0.7 }}>Undangan Pernikahan</p>
      <p className="mt-2 text-4xl leading-none" style={{ fontFamily: HEADING[theme.headingFont], fontWeight: theme.headingFont === 'script' ? 400 : 600, fontSize: theme.headingFont === 'script' ? '2.4rem' : '1.7rem' }}>
        Andi & Sinta
      </p>
      <Divider className="mt-3 w-16 opacity-70" />
      <p className="mt-3 text-[9px] tracking-[0.25em]" style={{ color: theme.text, opacity: 0.75 }}>12 . 12 . 2026</p>
      <span className="mt-4 rounded-full px-3 py-1 text-[8px] font-medium tracking-wide text-white" style={{ background: theme.primary }}>Buka Undangan</span>
    </div>
  );
}
