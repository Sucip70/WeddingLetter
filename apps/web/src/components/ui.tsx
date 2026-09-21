'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sage';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-rose text-white hover:bg-rose-dark shadow-sm shadow-rose/20',
  secondary: 'bg-paper text-ink border border-line hover:border-ink/40 hover:bg-ivory',
  ghost: 'text-ink-soft hover:text-ink hover:bg-ink/5',
  danger: 'bg-danger text-white hover:opacity-90',
  sage: 'bg-sage text-white hover:opacity-90',
};
const SIZES = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

interface ButtonStyleProps {
  variant?: Variant;
  size?: keyof typeof SIZES;
  className?: string;
}

const buttonClass = ({ variant = 'primary', size = 'md', className }: ButtonStyleProps) =>
  cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export function Button({ variant, size, className, loading, children, ...rest }: ButtonStyleProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button {...rest} disabled={rest.disabled || loading} className={buttonClass({ variant, size, className })}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant, size, className, children, external }: ButtonStyleProps & { href: string; children: ReactNode; external?: boolean }) {
  const cls = buttonClass({ variant, size, className });
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const fieldBase =
  'w-full rounded-xl border border-line bg-paper px-3.5 text-sm text-ink placeholder:text-ink-soft/60 transition-colors focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20 disabled:bg-ivory disabled:text-ink-soft';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  // suppressHydrationWarning: pengelola sandi / autofill menyisipkan atribut ke kolom isian sebelum hidrasi.
  return <input suppressHydrationWarning {...rest} className={cx(fieldBase, 'h-10', className)} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={cx(fieldBase, 'py-2.5 min-h-24 resize-y', className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(fieldBase, 'h-10 pr-8', className)}>
      {children}
    </select>
  );
}

// Label membungkus kontrol (asosiasi implisit) sehingga input otomatis terhubung ke labelnya.
export function Field({ label, hint, error, required, children, className, group }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string; group?: boolean }) {
  const Wrapper = group ? 'div' : 'label';
  return (
    <Wrapper className={cx('block space-y-1.5', className)} {...(group ? { role: 'group', 'aria-label': label } : {})}>
      <span className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-rose">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </Wrapper>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-paper shadow-[0_1px_2px_rgba(43,36,32,0.04)]', className)}>{children}</div>;
}

type Tone = 'neutral' | 'rose' | 'sage' | 'gold' | 'danger';
const TONES: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink-soft',
  rose: 'bg-rose-soft text-rose-dark',
  sage: 'bg-sage-soft text-sage',
  gold: 'bg-gold-soft text-[#8a6d2f]',
  danger: 'bg-danger-soft text-danger',
};
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)}>{children}</span>;
}

export function Alert({ tone = 'danger', children, className }: { tone?: 'danger' | 'info' | 'success' | 'warn'; children: ReactNode; className?: string }) {
  const map = {
    danger: 'bg-danger-soft text-danger border-danger/20',
    info: 'bg-rose-soft/60 text-rose-dark border-rose/20',
    success: 'bg-sage-soft text-sage border-sage/20',
    warn: 'bg-gold-soft text-[#7a5f22] border-gold/30',
  };
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('rounded-xl border px-4 py-3 text-sm', map[tone], className)}>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl outline-none sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-ink-soft">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-sage' : 'bg-ink/20')}
    >
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}

export const cn = cx;
