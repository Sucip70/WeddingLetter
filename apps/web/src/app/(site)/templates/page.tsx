import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { BloomSpriteScope } from '@/components/invitation/bloom-parts';
import { motifFor } from '@/components/invitation/motifs';
import { TemplateThumb } from '@/components/template-thumb';
import { Alert, EmptyState, PageHeader } from '@/components/ui';
import { GROUP_LABEL, GROUP_ORDER, getDemoPhotos, getTemplates, groupByDesign } from '@/lib/catalog';
import type { DesignEntry } from '@/lib/catalog';
import type { Template, ThemeGroup } from '@/lib/types';

export const metadata: Metadata = { title: 'Template undangan' };

// Tampilan daftar: kecil (bawaan; 2 kolom ringkas di ponsel, di layar lebar sama dengan besar), besar (kartu penuh, 1 kolom di ponsel), daftar (baris).
type View = 'kecil' | 'besar' | 'daftar';
const VIEWS: { id: View; label: string }[] = [
  { id: 'kecil', label: 'Kecil' },
  { id: 'besar', label: 'Besar' },
  { id: 'daftar', label: 'Daftar' },
];

// Skala miniatur kartu per lebar layar, dipilih supaya lebar logis (lebar kolom / skala) tetap ±350-420px seperti ponsel.
// Kolom: kecil = 2 (ponsel) · 2 (sm) · 4 (lg); besar = 1 · 2 · 4. Tulis utuh agar terbaca Tailwind.
const THUMB_SCALE_SMALL = 'h-[calc(100%/0.5)] w-[calc(100%/0.5)] scale-[0.5] sm:h-[calc(100%/0.8)] sm:w-[calc(100%/0.8)] sm:scale-[0.8] lg:h-[calc(100%/0.65)] lg:w-[calc(100%/0.65)] lg:scale-[0.65]';
const THUMB_SCALE_LARGE = 'h-full w-full scale-100 sm:h-[calc(100%/0.8)] sm:w-[calc(100%/0.8)] sm:scale-[0.8] lg:h-[calc(100%/0.65)] lg:w-[calc(100%/0.65)] lg:scale-[0.65]';

function chip(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'border-rose bg-rose text-white' : 'border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink'}`;
}

// Kartu per halaman. Setiap kartu adalah Client Component (miniatur sampul) yang ikut dikirim & dihidrasi di browser,
// jadi katalog yang tumbuh ke ratusan template tidak boleh dirender sekaligus. 24 = kelipatan 2 dan 3 kolom.
const PAGE_SIZE = 24;

// Nomor halaman yang ditampilkan: selalu halaman pertama, terakhir, dan tetangga halaman aktif; celahnya "…".
function pageList(page: number, pages: number): (number | '…')[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push('…');
    out.push(n);
    prev = n;
  }
  return out;
}

export default async function TemplatesPage({ searchParams }: PageProps<'/templates'>) {
  const sp = await searchParams;
  const group = typeof sp.category === 'string' ? sp.category : undefined;
  const view: View = VIEWS.some((v) => v.id === sp.view) ? (sp.view as View) : 'kecil';

  let all: Template[] = [];
  let failed = false;
  let photos: Record<string, string> = {};
  try {
    [all, photos] = await Promise.all([getTemplates(), getDemoPhotos()]);
  } catch {
    failed = true;
  }

  const entries = groupByDesign(all);
  const groups = GROUP_ORDER.filter((g) => entries.some((e) => e.group === g));
  // Satu kartu per DESAIN (bukan per desain x paket): paket & harganya dibandingkan di halaman detail. Kartu menaut ke baris
  // template paket tertinggi (demo terlengkap: animasi & gerbang). Tidak ada filter paket (disengaja, agar daftar tema mudah dikelola).
  interface Card { entry: DesignEntry; t: Template }
  const items: Card[] = entries
    .filter((e) => !group || e.group === group)
    .map((e) => ({ entry: e, t: e.rows[e.rows.length - 1]! }));
  // Paginasi: hanya potongan halaman ini yang dirender. Nomor di luar rentang (mis. dari tautan lama) dirapikan.
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const requested = Number(typeof sp.page === 'string' ? sp.page : 1);
  const page = Number.isFinite(requested) ? Math.min(pages, Math.max(1, Math.floor(requested))) : 1;
  const first = (page - 1) * PAGE_SIZE;
  const pageItems = items.slice(first, first + PAGE_SIZE);
  const groupOf = (c: Card) => (GROUP_ORDER.includes(c.entry.group as ThemeGroup) ? c.entry.group : 'lainnya');
  const groupTotal = (g: string) => items.filter((c) => groupOf(c) === g).length;
  const sections = [...GROUP_ORDER, 'lainnya']
    .map((g) => ({ group: g as string, rows: pageItems.filter((c) => groupOf(c) === g) }))
    .filter((x) => x.rows.length > 0)
    // Kelompok yang terbelah di batas halaman ditandai "lanjutan" di halaman berikutnya.
    .map((x) => ({ ...x, continued: items.findIndex((c) => groupOf(c) === x.group) < first }));
  // Kartu desain bunga memuat ±400 KB SVG yang sama persis per kartu; bila ada di halaman ini, gambarnya didefinisikan sekali
  // (sprite) dan kartu hanya merujuknya. Halaman tanpa kartu bunga tidak membawa sprite sama sekali.
  const hasBloom = pageItems.some(({ t }) => {
    const motif = motifFor(t.layout.theme.motif ?? t.layout.theme.preset);
    return motif.skin === 'bloom' || motif.ornament === 'romantic' || motif.ornament === 'botani';
  });
  const SpriteScope = hasBloom ? BloomSpriteScope : Fragment;
  // Mengganti filter mengembalikan ke halaman 1; mengganti tampilan mempertahankan halaman; tautan pager menyebut halamannya.
  const href = (next: { category?: string; view?: string; page?: number }) => {
    const q = new URLSearchParams();
    const nc = 'category' in next ? next.category : group;
    if (nc) q.set('category', nc);
    const nv = 'view' in next ? next.view : view;
    if (nv && nv !== 'kecil') q.set('view', nv);
    const np = 'page' in next ? next.page : 'view' in next ? page : 1;
    if (np && np > 1) q.set('page', String(np));
    return `/templates${q.size ? `?${q}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Template undangan"
        subtitle="Pilih desain yang kamu suka. Tiap desain tersedia di beberapa paket (Basic, Standard, Premium); perbandingan fitur dan harganya ada di halaman detail."
      />

      {failed && <Alert className="mb-6">Daftar template belum bisa dimuat. Pastikan API berjalan, lalu muat ulang halaman.</Alert>}

      {all.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tampilan daftar">
            <span className="mr-1 w-12 text-sm text-ink-soft">Tampil</span>
            {VIEWS.map((v) => (
              <Link key={v.id} href={href({ view: v.id })} className={chip(view === v.id)} scroll={false}>{v.label}</Link>
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
        <EmptyState title="Belum ada template yang cocok" description="Coba ubah filter, atau lihat semua desain." />
      ) : (
        <>
          <p className="mb-6 text-sm text-ink-soft">
            Menampilkan {first + 1}–{first + pageItems.length} dari {items.length} desain{items.length !== entries.length && ` (total ${entries.length})`}
          </p>
          <SpriteScope>
          <div className="space-y-14">
            {sections.map(({ group: g, rows, continued }) => (
              <section key={g} aria-labelledby={`grup-${g}`}>
                <h2 id={`grup-${g}`} className="mb-5 font-display text-2xl text-ink">
                  {GROUP_LABEL[g as ThemeGroup] ?? g} <span className="text-base font-normal text-ink-soft">· {groupTotal(g)} desain{continued && ' (lanjutan)'}</span>
                </h2>
                <div className={view === 'daftar' ? 'space-y-3' : view === 'kecil' ? 'grid grid-cols-2 gap-3 sm:gap-7 lg:grid-cols-4' : 'grid gap-7 sm:grid-cols-2 lg:grid-cols-4'}>
                  {rows.map(({ entry, t }) => {
                    const palettes = t.layout.palettes ?? [];
                    const small = view === 'kecil';
                    const row = view === 'daftar';
                    const thumb = (
                      <TemplateThumb
                        theme={t.layout.theme}
                        imageUrl={t.thumbnailUrl}
                        coverLayouts={t.layout.coverLayouts}
                        coverDefault={t.layout.coverDefault}
                        photos={photos}
                        samplePhotos={t.layout.samplePhotos}
                        seed={t.id}
                        phone={!row}
                        className="transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    );
                    const name = entry.name;
                    if (row) {
                      // Baris: miniatur kecil (dirender selebar 293px lalu diperkecil, supaya isinya utuh) + nama.
                      return (
                        <Link key={t.id} href={`/templates/${t.id}`} className="group flex gap-4 overflow-hidden rounded-2xl border border-line bg-paper p-3 transition-shadow hover:shadow-lg hover:shadow-ink/5">
                          <div className="relative h-[110px] w-[88px] shrink-0 overflow-hidden rounded-xl">
                            <div className="absolute left-0 top-0 aspect-[4/5] w-[293px] origin-top-left scale-[0.3]">{thumb}</div>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <p className="truncate font-semibold text-ink">{name}</p>
                            {palettes.length > 1 && (
                              <span className="mt-2 flex items-center gap-1" title={`${palettes.length} pilihan warna`}>
                                {palettes.slice(0, 5).map((p) => (
                                  <span key={p.id} className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.primary }} />
                                ))}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    }
                    return (
                      <Link key={t.id} href={`/templates/${t.id}`} className={`group flex flex-col overflow-hidden border border-line bg-paper transition-shadow hover:shadow-xl hover:shadow-ink/5 ${small ? 'rounded-2xl sm:rounded-3xl' : 'rounded-3xl'}`}>
                        {/* Pratinjau berbentuk layar ponsel (rasio 390x810, sama dengan PhoneFrame). Miniatur dirender pada lebar logis
                            ±390px lalu diperkecil: lebar/tinggi logisnya = 100%/skala, jadi isinya utuh dan proporsional di tiap lebar kolom. */}
                        <div className="relative aspect-[390/680] overflow-hidden">
                          <div className={`absolute left-0 top-0 origin-top-left ${small ? THUMB_SCALE_SMALL : THUMB_SCALE_LARGE}`}>{thumb}</div>
                        </div>
                        <div className={`flex flex-1 flex-col ${small ? 'p-3 sm:p-5' : 'p-5'}`}>
                          <div className="min-w-0">
                            <p className={`font-semibold text-ink ${small ? 'text-sm leading-snug sm:text-base' : ''}`}>{name}</p>
                          </div>
                          <div className={small ? 'max-sm:hidden' : undefined}>
                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                              {palettes.length > 1 && (
                                <span className="flex items-center gap-1" title={`${palettes.length} pilihan warna`}>
                                  {palettes.slice(0, 8).map((p) => (
                                    <span key={p.id} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: p.primary }} />
                                  ))}
                                </span>
                              )}
                            </div>
                            <span className="mt-5 block text-sm font-medium text-rose">Lihat demo & pilih paket →</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          </SpriteScope>

          {pages > 1 && (
            <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Halaman daftar template">
              {page > 1 && <Link href={href({ page: page - 1 })} className={chip(false)} rel="prev">← Sebelumnya</Link>}
              {pageList(page, pages).map((n, i) =>
                n === '…' ? (
                  <span key={`gap-${i}`} className="px-1 text-ink-soft" aria-hidden>…</span>
                ) : (
                  <Link key={n} href={href({ page: n })} className={chip(n === page)} aria-current={n === page ? 'page' : undefined} aria-label={`Halaman ${n}`}>{n}</Link>
                ),
              )}
              {page < pages && <Link href={href({ page: page + 1 })} className={chip(false)} rel="next">Berikutnya →</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
