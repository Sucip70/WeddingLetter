import type { Metadata } from 'next';
import Link from 'next/link';
import { Filters, pickString } from '@/components/admin/list';
import { TemplateThumb } from '@/components/template-thumb';
import { Badge, EmptyState, LinkButton, PageHeader } from '@/components/ui';
import { GROUP_LABEL, GROUP_ORDER, TIER_LABEL } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import { GATE_LABEL } from '@/lib/types';
import type { GateKind, Theme, ThemeGroup, Tier } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin — template' };

interface Row {
  id: string;
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

const STATUS_LABEL: Record<Row['status'], string> = { PUBLISHED: 'Publik', DRAFT: 'Draf', ARCHIVED: 'Arsip' };
const TIERS: Tier[] = ['BASIC', 'STANDARD', 'PREMIUM'];
const NO_GATE = 'none';

export default async function AdminTemplates({ searchParams }: PageProps<'/admin/templates'>) {
  const sp = await searchParams;
  const q = pickString(sp.q)?.trim().toLowerCase();
  const status = pickString(sp.status);
  const tier = pickString(sp.tier);
  const category = pickString(sp.category);
  const gate = pickString(sp.gate);
  // Daftar template kecil (puluhan baris) dan API mengembalikan semuanya, jadi filter cukup di sini.
  const templates = await authedFetch<Row[]>('/admin/templates', '/admin/templates');
  const gateOf = (t: Row) => (t.theme.gate && t.theme.gate !== 'none' ? t.theme.gate : NO_GATE);
  const rows = templates.filter(
    (t) =>
      (!q || t.name.toLowerCase().includes(q) || t.theme.preset.toLowerCase().includes(q)) &&
      (!status || t.status === status) &&
      (!tier || t.tier === tier) &&
      (!category || t.category === category) &&
      (!gate || gateOf(t) === gate),
  );

  const categories = [...GROUP_ORDER, ...new Set(templates.map((t) => t.category))].filter((c, i, all) => all.indexOf(c) === i && templates.some((t) => t.category === c));
  const gates = new Set(templates.map(gateOf));
  const filtered = Boolean(q || status || tier || category || gate);

  return (
    <>
      <PageHeader title="Template" subtitle="Susun template: section, field, tema, kuota media, dan lagu bawaan. Template hanya tampil di katalog saat berstatus Dipublikasikan." actions={<LinkButton href="/admin/templates/new">+ Template baru</LinkButton>} />
      <Filters
        q={pickString(sp.q)}
        placeholder="Cari nama atau desain"
        status={status}
        statuses={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
        selects={[
          { name: 'tier', label: 'Paket', value: tier, options: TIERS.map((t) => ({ value: t, label: TIER_LABEL[t] })) },
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
        <span>Menampilkan {rows.length} dari {templates.length} template</span>
        {filtered && <Link href="/admin/templates" className="font-medium text-rose hover:underline">Hapus filter</Link>}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Tidak ada template yang cocok" description="Coba ubah atau hapus filter." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((t) => (
            <Link key={t.id} href={`/admin/templates/${t.id}`} className="group flex overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-lg hover:shadow-ink/5">
              <div className="w-28 shrink-0"><TemplateThumb theme={t.theme} imageUrl={t.thumbnailUrl} /></div>
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-ink">{t.name}</p>
                  <Badge tone={t.status === 'PUBLISHED' ? 'sage' : t.status === 'DRAFT' ? 'gold' : 'neutral'}>{STATUS_LABEL[t.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{TIER_LABEL[t.tier]} · {GROUP_LABEL[t.category as ThemeGroup] ?? t.category}</p>
                <p className="mt-2 font-display text-xl text-rose">{rupiah(t.price)}</p>
                <p className="mt-2 text-xs text-ink-soft">{t.sections.length} section · {t.includedWeeks} minggu · {t.orders} pesanan</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
