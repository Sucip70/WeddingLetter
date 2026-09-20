import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TemplateBuilder } from '@/components/admin/template-builder';
import type { BuilderMeta, TemplateForm } from '@/components/admin/template-builder';
import { ApiError } from '@/lib/api';
import { authedFetch } from '@/lib/session';

export const metadata: Metadata = { title: 'Admin — template builder' };

export default async function AdminTemplateBuilder({ params }: PageProps<'/admin/templates/[id]'>) {
  const { id } = await params;
  const path = `/admin/templates/${id}`;
  const meta = await authedFetch<BuilderMeta>('/admin/builder-meta', path);
  const template =
    id === 'new'
      ? null
      : await authedFetch<TemplateForm & { orders: number }>(`/admin/templates/${id}`, path).catch((e) => {
          if (e instanceof ApiError && e.status === 404) notFound();
          throw e;
        });
  return (
    <div>
      <Link href="/admin/templates" className="text-sm text-ink-soft hover:text-ink">← Template</Link>
      <TemplateBuilder key={template?.id ?? 'new'} meta={meta} initial={template} />
    </div>
  );
}
