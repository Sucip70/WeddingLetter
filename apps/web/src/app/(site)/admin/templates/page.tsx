import type { Metadata } from 'next';
import Link from 'next/link';
import { Filters, pickString } from '@/components/admin/list';
import type { BuilderMeta } from '@/components/admin/template-builder';
import { TemplateThumb } from '@/components/template-thumb';
import { Badge, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { GROUP_LABEL, GROUP_ORDER, TIER_LABEL } from '@/lib/catalog';
import { authedFetch } from '@/lib/session';
import { GATE_LABEL } from '@/lib/types';
import type { GateKind, Theme, ThemeGroup, Tier } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin — template' };

interface Row {
  id: string;
  designId: string;
  name: string;
  category: string;
  tier: Tier;
  price: number;
  includedWeeks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  thumbnailUrl: string | null;
  orders: number;
  sections: string[];
  theme: Theme;
}

const STATUS_LABEL: Record<Row['status'], string> = { PUBLISHED: 'Tersedia', DRAFT: 'Draf', ARCHIVED: 'Arsip' };
const TIER_ORDER: Record<Tier, number> = { BASIC: 0, STANDARD: 1, PREMIUM: 2 };
const NO_GATE = 'none';
interface DesignCard {
  key: string;
  name: string;
  // Paket tertinggi (editor-nya dibuka dari kartu); paket lain & harga/ketersediaannya diatur di dalam halaman itu.
  main: Row;
  rows: Row[];
  orders: number;
}

export default async function AdminTemplates({ searchParams }: PageProps<'/admin/templates'>) {
  const sp = await searchParams;
  const q = pickString(sp.q)?.trim().toLowerCase();
  const status = pickString(sp.status);
  const category = pickString(sp.category);
  const gate = pickString(sp.gate);
  // Daftar template kecil (puluhan baris) dan API mengembalikan semuanya, jadi pengelompokan & filter cukup di sini.
  const [templates, meta] = await Promise.all([
    authedFetch<Row[]>('/admin/templates', '/admin/templates'),
    authedFetch<BuilderMeta>('/admin/builder-meta', '/admin/templates'),
  ]);
  const gateOf = (t: Row) => (t.theme.gate && t.theme.gate !== 'none' ? t.theme.gate : NO_GATE);

  const byDesign = new Map<string, Row[]>();
  for (const t of templates) {
    const key = t.designId;
    byDesign.set(key, [...(byDesign.get(key) ?? []), t]);
  }
  const designs: DesignCard[] = [...byDesign.entries()].map(([key, list]) => {
    const rows = [...list].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.price - b.price);
    const main = rows[rows.length - 1]!;
    return { key, name: meta.designs.find((d) => d.id === key)?.name ?? main.name, main, rows, orders: rows.reduce((n, r) => n + r.orders, 0) };
  });

  // Kartu cocok bila salah satu paketnya cocok dengan filter.
  const cards = designs.filter(
    (d) =>
      (!q || d.name.toLowerCase().includes(q) || d.key.toLowerCase().includes(q) || d.rows.some((r) => r.name.toLowerCase().includes(q))) &&
      (!status || d.rows.some((r) => r.status === status)) &&
      (!category || d.rows.some((r) => r.category === category)) &&
      (!gate || d.rows.some((r) => gateOf(r) === gate)),
  );

  const categories = [...GROUP_ORDER, ...new Set(templates.map((t) => t.category))].filter((c, i, all) => all.indexOf(c) === i && templates.some((t) => t.category === c));
  const gates = new Set(templates.map(gateOf));
  const filtered = Boolean(q || status || category || gate);

  return (
    <>
      <PageHeader
        title="Template"
        subtitle="Satu kartu per tema. Buka kartu untuk mengatur harga & ketersediaan Basic, Standard, dan Premium, serta menyusun section, tema, kuota media, dan lagu bawaan."
        actions={<LinkButton href="/admin/templates/new">+ Template baru</LinkButton>}
      />
      <Filters
        q={pickString(sp.q)}
        placeholder="Cari nama atau desain"
        status={status}
        statuses={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        selects={[
          { name: 'category', label: 'Tema', value: category, options: categories.map((c) => ({ value: c, label: GROUP_LABEL[c as ThemeGroup] ?? c })) },
          {
            name: 'gate',
            label: 'Gerbang',
            value: gate,
            options: [
              ...(Object.keys(GATE_LABEL) as GateKind[]).filter((g) => gates.has(g)).map((g) => ({ value: g, label: GATE_LABEL[g] })),
              ...(gates.has(NO_GATE) ? [{ value: NO_GATE, label: 'Tanpa gerbang' }] : []),
            ],
          },
        ]}
      />
      <div className="mb-4 flex items-center gap-3 text-sm text-ink-soft">
        <span>Menampilkan {cards.length} dari {designs.length} tema</span>
        {filtered && <Link href="/admin/templates" className="font-medium text-rose hover:underline">Hapus filter</Link>}
      </div>
      {cards.length === 0 ? (
        <EmptyState title="Tidak ada tema yang cocok" description="Coba ubah atau hapus filter." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((d) => (
            <Link key={d.key} href={`/admin/templates/${d.main.id}`} className="group flex overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-lg hover:shadow-ink/5">
              <div className="w-28 shrink-0"><TemplateThumb theme={d.main.theme} imageUrl={d.main.thumbnailUrl} /></div>
              <div className="min-w-0 flex-1 p-4">
                <p className="truncate font-semibold text-ink">{d.name}</p>
                <p className="mt-1 text-sm text-ink-soft">{GROUP_LABEL[d.main.category as ThemeGroup] ?? d.main.category}</p>
                {/* Ketersediaan tiap paket sekilas (tanpa harga; harga diatur di dalam halaman tema). */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.rows.map((r) => (
                    <span key={r.id} title={`${TIER_LABEL[r.tier]}: ${STATUS_LABEL[r.status]}`}>
                      <Badge tone={r.status === 'PUBLISHED' ? 'sage' : r.status === 'DRAFT' ? 'gold' : 'neutral'}>{TIER_LABEL[r.tier]}</Badge>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-ink-soft">{d.rows.length} paket · {d.orders} pesanan</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
