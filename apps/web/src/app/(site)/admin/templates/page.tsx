import type { Metadata } from 'next';
import Link from 'next/link';
import { TemplateThumb } from '@/components/template-thumb';
import { Badge, LinkButton, PageHeader } from '@/components/ui';
import { TIER_LABEL } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import { authedFetch } from '@/lib/session';
import type { Theme, Tier } from '@/lib/types';

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
}

const THEME: Record<string, Theme> = {
  rustic: { preset: 'rustic', primary: '#8a5a3c', secondary: '#c9a27e', background: '#fbf6ef', text: '#3b2a20', headingFont: 'serif', bodyFont: 'sans' },
  floral: { preset: 'floral', primary: '#c4587a', secondary: '#e9b7c6', background: '#fff7f9', text: '#4a2c38', headingFont: 'script', bodyFont: 'sans' },
  elegant: { preset: 'elegant', primary: '#b08d3c', secondary: '#1f2a44', background: '#f7f5f0', text: '#1f2a44', headingFont: 'serif', bodyFont: 'serif' },
};

export default async function AdminTemplates() {
  const templates = await authedFetch<Row[]>('/admin/templates', '/admin/templates');
  return (
    <>
      <PageHeader title="Template" subtitle="Susun template: section, field, tema, kuota media, dan lagu bawaan. Template hanya tampil di katalog saat berstatus Dipublikasikan." actions={<LinkButton href="/admin/templates/new">+ Template baru</LinkButton>} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <Link key={t.id} href={`/admin/templates/${t.id}`} className="group flex overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-lg hover:shadow-ink/5">
            <div className="w-28 shrink-0"><TemplateThumb theme={THEME[t.category] ?? THEME.rustic!} imageUrl={t.thumbnailUrl} /></div>
            <div className="min-w-0 flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold text-ink">{t.name}</p>
                <Badge tone={t.status === 'PUBLISHED' ? 'sage' : t.status === 'DRAFT' ? 'gold' : 'neutral'}>{t.status === 'PUBLISHED' ? 'Publik' : t.status === 'DRAFT' ? 'Draf' : 'Arsip'}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{TIER_LABEL[t.tier]} · {t.category}</p>
              <p className="mt-2 font-display text-xl text-rose">{rupiah(t.price)}</p>
              <p className="mt-2 text-xs text-ink-soft">{t.sections.length} section · {t.includedWeeks} minggu · {t.orders} pesanan</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
