import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TemplateDemo } from '@/components/template-demo';
import { Badge, Card } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { ADDON_DESC, FX_LABEL, GROUP_LABEL, TIER_LABEL, getAddOns, getTemplate, getTemplates, templateFeatures } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import type { AddOn, Template, TemplateDetail, ThemeGroup } from '@/lib/types';

async function load(id: string) {
  try {
    return await getTemplate(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<'/templates/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const t = await getTemplate(id).catch(() => null);
  return { title: t ? `${t.name} — template undangan` : 'Template' };
}

// Add-on yang relevan untuk template ini (mis. RSVP tidak ditawarkan bila sudah termasuk).
function relevantAddOns(t: TemplateDetail, addOns: AddOn[]) {
  const ids = t.layout.sections.map((s) => s.id);
  return addOns.filter((a) => {
    if (a.code === 'RSVP_ONLINE') return !ids.includes('rsvp');
    if (a.code === 'DIGITAL_ENVELOPE') return !ids.includes('amplop_digital');
    if (a.code === 'CUSTOM_SONG') return t.layout.musik.allowed;
    return true;
  });
}

export default async function TemplateDetailPage({ params }: PageProps<'/templates/[id]'>) {
  const { id } = await params;
  const [t, addOns, all] = await Promise.all([load(id), getAddOns().catch(() => [] as AddOn[]), getTemplates().catch(() => [] as Template[])]);
  // Desain yang sama di paket lain (Basic / Standard / Premium).
  const siblings = all.filter((x) => t.design && x.design?.id === t.design.id).sort((x, y) => x.price - y.price);
  const fx = t.layout.theme.fx;

  const header = (
    <>
      <Link href="/templates" className="text-sm text-ink-soft hover:text-ink">← Semua template</Link>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge tone={t.tier === 'PREMIUM' ? 'gold' : t.tier === 'STANDARD' ? 'rose' : 'neutral'}>{TIER_LABEL[t.tier]}</Badge>
        <Badge>{GROUP_LABEL[t.category as ThemeGroup] ?? t.category}</Badge>
        {fx !== 'none' && <Badge tone="sage">{FX_LABEL[fx]}</Badge>}
      </div>
      <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">{t.design?.name ?? t.name}</h1>
      {t.design?.blurb && <p className="mt-3 max-w-xl text-ink-soft">{t.design.blurb}</p>}
      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-5xl text-rose">{rupiah(t.price)}</span>
        <span className="text-ink-soft">sekali bayar · masa aktif {t.includedWeeks} minggu</span>
      </p>

      {siblings.length > 1 && (
        <div className="mt-6" role="group" aria-label="Pilih paket">
          <p className="text-sm text-ink-soft">Desain ini tersedia di {siblings.length} paket:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {siblings.map((r) => (
              <Link
                key={r.id}
                href={`/templates/${r.id}`}
                aria-current={r.id === t.id ? 'page' : undefined}
                className={`rounded-xl border px-4 py-2 text-sm transition-colors ${r.id === t.id ? 'border-rose bg-rose-soft/50' : 'border-line hover:border-ink/40'}`}
              >
                <span className="block font-semibold text-ink">{TIER_LABEL[r.tier]}</span>
                <span className="tabular-nums text-rose">{rupiah(r.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <TemplateDemo template={t} header={header}>
        <Card className="mt-10 p-6">
          <h2 className="font-semibold text-ink">Sudah termasuk</h2>
          <ul className="mt-4 grid gap-2.5 text-sm text-ink-soft sm:grid-cols-2">
            {templateFeatures(t).map((f) => (
              <li key={f} className="flex gap-2"><span className="text-sage">✓</span>{f}</li>
            ))}
            <li className="flex gap-2"><span className="text-sage">✓</span>Link personal (?to=Nama tamu)</li>
            <li className="flex gap-2"><span className="text-sage">✓</span>Simpan ke Google Calendar</li>
          </ul>
        </Card>

        {addOns.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="font-semibold text-ink">Tambahan opsional</h2>
            <p className="mt-1 text-sm text-ink-soft">Dipilih di editor dan langsung masuk ke total harga.</p>
            <dl className="mt-4 divide-y divide-line">
              {relevantAddOns(t, addOns).map((a) => (
                <div key={a.code} className="flex items-start justify-between gap-6 py-3">
                  <div>
                    <dt className="text-sm font-medium text-ink">{a.name}</dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-ink-soft">{ADDON_DESC[a.code]}</dd>
                  </div>
                  <dd className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {rupiah(a.price)}
                    {a.unit && <span className="font-normal text-ink-soft"> / {a.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </TemplateDemo>
    </div>
  );
}
