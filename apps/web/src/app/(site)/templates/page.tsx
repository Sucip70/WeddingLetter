import type { Metadata } from 'next';
import Link from 'next/link';
import { TemplateThumb } from '@/components/template-thumb';
import { Alert, Badge, EmptyState, PageHeader } from '@/components/ui';
import { FX_LABEL, GROUP_LABEL, GROUP_ORDER, TIER_LABEL, getTemplates, groupByDesign } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import { GATE_LABEL } from '@/lib/types';
import type { Template, ThemeGroup, Tier } from '@/lib/types';

export const metadata: Metadata = { title: 'Template undangan' };

const TIERS: Tier[] = ['BASIC', 'STANDARD', 'PREMIUM'];

function chip(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'border-rose bg-rose text-white' : 'border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink'}`;
}

export default async function TemplatesPage({ searchParams }: PageProps<'/templates'>) {
  const sp = await searchParams;
  const tier = typeof sp.tier === 'string' && TIERS.includes(sp.tier.toUpperCase() as Tier) ? (sp.tier.toUpperCase() as Tier) : undefined;
  const group = typeof sp.category === 'string' ? sp.category : undefined;

  let all: Template[] = [];
  let failed = false;
  try {
    all = await getTemplates();
  } catch {
    failed = true;
  }

  const entries = groupByDesign(all);
  const groups = GROUP_ORDER.filter((g) => entries.some((e) => e.group === g));
  const tiers = TIERS.filter((t) => all.some((x) => x.tier === t));
  // Semua template (desain x paket), diurutkan per kelompok tema -> desain -> harga.
  const items = entries.flatMap((e) => e.rows).filter((t) => (!group || t.category === group) && (!tier || t.tier === tier));
  const sections = GROUP_ORDER.map((g) => ({ group: g as string, rows: items.filter((t) => t.category === g) }))
    .concat([{ group: 'lainnya', rows: items.filter((t) => !GROUP_ORDER.includes(t.category as ThemeGroup)) }])
    .filter((x) => x.rows.length > 0);
  const href = (next: { tier?: string; category?: string }) => {
    const q = new URLSearchParams();
    const nt = 'tier' in next ? next.tier : tier?.toLowerCase();
    const nc = 'category' in next ? next.category : group;
    if (nt) q.set('tier', nt);
    if (nc) q.set('category', nc);
    return `/templates${q.size ? `?${q}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Template undangan"
        subtitle="Semua template dalam satu halaman. Basic sederhana dan hemat; Standard dan Premium menambah animasi, tema spesial, dan pilihan musik. Semua harga sudah termasuk kuota foto dan masa aktif awal."
      />

      {failed && <Alert className="mb-6">Daftar template belum bisa dimuat. Pastikan API berjalan, lalu muat ulang halaman.</Alert>}

      {all.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter paket">
            <span className="mr-1 w-12 text-sm text-ink-soft">Paket</span>
            <Link href={href({ tier: undefined })} className={chip(!tier)}>Semua</Link>
            {tiers.map((t) => (
              <Link key={t} href={href({ tier: t.toLowerCase() })} className={chip(tier === t)}>{TIER_LABEL[t]}</Link>
            ))}
          </div>
          {groups.length > 1 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tema">
              <span className="mr-1 w-12 text-sm text-ink-soft">Tema</span>
              <Link href={href({ category: undefined })} className={chip(!group)}>Semua</Link>
              {groups.map((g) => (
                <Link key={g} href={href({ category: g })} className={chip(group === g)}>{GROUP_LABEL[g]}</Link>
              ))}
            </div>
          )}
        </div>
      )}

      {items.length === 0 && !failed ? (
        <EmptyState title="Belum ada template yang cocok" description="Coba ubah filter, atau lihat semua template." />
      ) : (
        <>
          <p className="mb-6 text-sm text-ink-soft">Menampilkan {items.length} dari {all.length} template</p>
          <div className="space-y-14">
            {sections.map(({ group: g, rows }) => (
              <section key={g} aria-labelledby={`grup-${g}`}>
                <h2 id={`grup-${g}`} className="mb-5 font-display text-2xl text-ink">
                  {GROUP_LABEL[g as ThemeGroup] ?? g} <span className="text-base font-normal text-ink-soft">· {rows.length} template</span>
                </h2>
                <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((t) => {
                    const palettes = t.layout.palettes ?? [];
                    const fx = t.layout.theme.fx;
                    const tracks = t.layout.musik.count ?? t.layout.musik.presets.length;
                    return (
                      <Link key={t.id} href={`/templates/${t.id}`} className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-paper transition-shadow hover:shadow-xl hover:shadow-ink/5">
                        <div className="aspect-[4/5] overflow-hidden">
                          <TemplateThumb theme={t.layout.theme} imageUrl={t.thumbnailUrl} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-ink">{t.design?.name ?? t.name}</p>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                <Badge tone={t.tier === 'PREMIUM' ? 'gold' : t.tier === 'STANDARD' ? 'rose' : 'neutral'}>{TIER_LABEL[t.tier]}</Badge>
                                <Badge>{GROUP_LABEL[t.category as ThemeGroup] ?? t.category}</Badge>
                              </div>
                            </div>
                            <p className="shrink-0 font-display text-2xl text-rose">{rupiah(t.price)}</p>
                          </div>
                          {t.design?.blurb && <p className="mt-3 text-xs leading-relaxed text-ink-soft">{t.design.blurb}</p>}
                          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                            {palettes.length > 1 && (
                              <span className="flex items-center gap-1" title={`${palettes.length} pilihan warna`}>
                                {palettes.slice(0, 8).map((p) => (
                                  <span key={p.id} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: p.primary }} />
                                ))}
                              </span>
                            )}
                            {fx !== 'none' && <span>✓ {FX_LABEL[fx]}</span>}
                            {t.layout.theme.gate && t.layout.theme.gate !== 'none' && <span>✓ Gerbang {GATE_LABEL[t.layout.theme.gate].toLowerCase()}</span>}
                            {tracks > 0 && <span>✓ {tracks} pilihan lagu</span>}
                            <span>✓ Galeri {t.layout.galeri.maxPhotos} foto</span>
                          </div>
                          <span className="mt-5 text-sm font-medium text-rose">Lihat demo & pakai →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
