import type { Metadata } from 'next';
import Link from 'next/link';
import { TemplateThumb } from '@/components/template-thumb';
import { Alert, Badge, EmptyState, PageHeader } from '@/components/ui';
import { TIER_LABEL, getTemplates, templateFeatures } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import type { Template } from '@/lib/types';

export const metadata: Metadata = { title: 'Template undangan' };

const CATEGORY_LABEL: Record<string, string> = { rustic: 'Rustic', floral: 'Floral', elegant: 'Elegan', minimalis: 'Minimalis', islami: 'Islami' };
const label = (c: string) => CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1);

function chip(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'border-rose bg-rose text-white' : 'border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink'}`;
}

export default async function TemplatesPage({ searchParams }: PageProps<'/templates'>) {
  const sp = await searchParams;
  const tier = typeof sp.tier === 'string' ? sp.tier.toUpperCase() : undefined;
  const category = typeof sp.category === 'string' ? sp.category : undefined;

  let all: Template[] = [];
  let failed = false;
  try {
    all = await getTemplates();
  } catch {
    failed = true;
  }

  const categories = [...new Set(all.map((t) => t.category))];
  const tiers = (['BASIC', 'STANDARD', 'PREMIUM'] as const).filter((t) => all.some((x) => x.tier === t));
  const items = all.filter((t) => (!tier || t.tier === tier) && (!category || t.category === category));
  const href = (next: { tier?: string; category?: string }) => {
    const q = new URLSearchParams();
    const nt = 'tier' in next ? next.tier : tier?.toLowerCase();
    const nc = 'category' in next ? next.category : category;
    if (nt) q.set('tier', nt);
    if (nc) q.set('category', nc);
    return `/templates${q.size ? `?${q}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader title="Template undangan" subtitle="Semua harga sudah termasuk kuota foto dan masa aktif awal. Butuh lebih? Tambahan dihitung transparan di editor." />

      {failed && <Alert className="mb-6">Daftar template belum bisa dimuat. Pastikan API berjalan, lalu muat ulang halaman.</Alert>}

      {all.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter paket">
            <span className="mr-1 text-sm text-ink-soft">Paket</span>
            <Link href={href({ tier: undefined })} className={chip(!tier)}>Semua</Link>
            {tiers.map((t) => (
              <Link key={t} href={href({ tier: t.toLowerCase() })} className={chip(tier === t)}>{TIER_LABEL[t]}</Link>
            ))}
          </div>
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter gaya">
              <span className="mr-1 text-sm text-ink-soft">Gaya</span>
              <Link href={href({ category: undefined })} className={chip(!category)}>Semua</Link>
              {categories.map((c) => (
                <Link key={c} href={href({ category: c })} className={chip(category === c)}>{label(c)}</Link>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && !failed ? (
        <EmptyState title="Belum ada template yang cocok" description="Coba ubah filter, atau lihat semua template." />
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Link key={t.id} href={`/templates/${t.id}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-paper transition-shadow hover:shadow-xl hover:shadow-ink/5">
              <div className="aspect-[4/5] overflow-hidden">
                <TemplateThumb theme={t.layout.theme} imageUrl={t.thumbnailUrl} className="transition-transform duration-500 group-hover:scale-[1.03]" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{t.name}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      <Badge tone={t.tier === 'PREMIUM' ? 'gold' : t.tier === 'STANDARD' ? 'rose' : 'neutral'}>{TIER_LABEL[t.tier]}</Badge>
                      <Badge>{label(t.category)}</Badge>
                    </div>
                  </div>
                  <p className="font-display text-2xl text-rose">{rupiah(t.price)}</p>
                </div>
                <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
                  {templateFeatures(t).slice(0, 5).map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <span className="mt-5 text-sm font-medium text-rose">Lihat demo & pakai →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
