import Link from 'next/link';
import type { ReactNode } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Select {
  name: string;
  label: string;
  value?: string;
  options: Option[];
}

// Filter berbasis <form method="get"> murni HTML: tanpa JS, URL bisa dibagikan.
// `selects` = dropdown tambahan; opsi kosong = "Semua <label>".
export function Filters({ q, status, statuses, selects, placeholder }: { q?: string; status?: string; statuses?: Option[]; selects?: Select[]; placeholder: string }) {
  return (
    <form method="get" className="mb-5 flex flex-wrap gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label="Cari"
        className="h-10 min-w-56 flex-1 rounded-xl border border-line bg-paper px-3.5 text-sm placeholder:text-ink-soft/60 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
      />
      {statuses && (
        <select name="status" defaultValue={status ?? ''} aria-label="Status" className="h-10 rounded-xl border border-line bg-paper px-3 text-sm focus:border-rose focus:outline-none">
          <option value="">Semua status</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}
      {selects?.map((s) => (
        <select key={s.name} name={s.name} defaultValue={s.value ?? ''} aria-label={s.label} className="h-10 rounded-xl border border-line bg-paper px-3 text-sm focus:border-rose focus:outline-none">
          <option value="">Semua {s.label.toLowerCase()}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      <button className="h-10 rounded-full bg-ink px-5 text-sm font-medium text-ivory hover:bg-ink/85">Cari</button>
    </form>
  );
}

export function Pager({ base, page, pageSize, total, params }: { base: string; page: number; pageSize: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set('page', String(p));
    return `${base}${q.size ? `?${q}` : ''}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
      <span>{total} data · halaman {page} dari {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className="rounded-full border border-line bg-paper px-4 py-1.5 hover:border-ink/40">← Sebelumnya</Link>}
        {page < pages && <Link href={href(page + 1)} className="rounded-full border border-line bg-paper px-4 py-1.5 hover:border-ink/40">Berikutnya →</Link>}
      </div>
    </div>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-ivory text-left text-xs uppercase tracking-wider text-ink-soft">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export const pickString = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v : undefined);
export const pickPage = (v: string | string[] | undefined) => Math.max(1, Number(pickString(v)) || 1);
