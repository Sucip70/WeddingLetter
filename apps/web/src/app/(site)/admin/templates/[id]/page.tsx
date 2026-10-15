import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TemplateBuilder } from '@/components/admin/template-builder';
import type { BuilderMeta, TemplateForm } from '@/components/admin/template-builder';
import type { TierRow } from '@/components/admin/tier-panel';
import { ApiError } from '@/lib/api';
import { getDemoPhotos } from '@/lib/catalog';
import { authedFetch } from '@/lib/session';
import type { Theme } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin — template builder' };

interface ListRow {
  id: string;
  designId: string;
  name: string;
  tier: TierRow['tier'];
  price: number;
  status: TierRow['status'];
  orders: number;
  theme: Theme;
}

const TIER_ORDER: Record<TierRow['tier'], number> = { BASIC: 0, STANDARD: 1, PREMIUM: 2 };
export default async function AdminTemplateBuilder({ params }: PageProps<'/admin/templates/[id]'>) {
  const { id } = await params;
  const path = `/admin/templates/${id}`;
  const [meta, photos] = await Promise.all([authedFetch<BuilderMeta>('/admin/builder-meta', path), getDemoPhotos()]);
  const template =
    id === 'new'
      ? null
      : await authedFetch<TemplateForm & { orders: number }>(`/admin/templates/${id}`, path).catch((e) => {
          if (e instanceof ApiError && e.status === 404) notFound();
          throw e;
        });

  // Paket-paket dari tema yang sama (untuk panel harga & ketersediaan di dalam halaman ini).
  let siblings: TierRow[] = [];
  if (template) {
    const all = await authedFetch<ListRow[]>('/admin/templates', path);
    const mine = all.find((r) => r.id === id);
    if (mine) {
      siblings = all
        .filter((r) => r.designId === mine.designId)
        .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.price - b.price)
        .map((r) => ({ id: r.id, name: r.name, tier: r.tier, price: r.price, status: r.status, orders: r.orders }));
    }
  }

  return (
    <div>
      <Link href="/admin/templates" className="text-sm text-ink-soft hover:text-ink">← Template</Link>
      <TemplateBuilder key={template?.id ?? 'new'} meta={meta} initial={template} photos={photos} siblings={siblings} />
    </div>
  );
}
