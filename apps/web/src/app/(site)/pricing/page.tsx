import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, Badge, Card, LinkButton, PageHeader } from '@/components/ui';
import { ADDON_DESC, TIER_LABEL, getAddOns, getTemplates, templateFeatures } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import type { AddOn, Template } from '@/lib/types';
import { RentalCalculator } from './rental-calculator';

export const metadata: Metadata = { title: 'Harga & add-on' };

export default async function PricingPage() {
  let templates: Template[] = [];
  let addOns: AddOn[] = [];
  let failed = false;
  try {
    [templates, addOns] = await Promise.all([getTemplates(), getAddOns()]);
  } catch {
    failed = true;
  }
  const rate = addOns.find((a) => a.code === 'MEDIA_RENTAL_WEEK')?.price ?? 700;
  const extend = addOns.find((a) => a.code === 'EXTEND_ACTIVE_WEEK')?.price ?? 10000;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader title="Harga transparan" subtitle="Semua harga tertulis di sini, sama persis dengan yang muncul di kalkulator editor. Tidak ada biaya tersembunyi." />
      {failed && <Alert className="mb-8">Data harga belum bisa dimuat. Pastikan API berjalan, lalu muat ulang halaman.</Alert>}

      <section aria-labelledby="tpl">
        <h2 id="tpl" className="font-display text-2xl text-ink">Template</h2>
        <p className="mt-1 text-sm text-ink-soft">Sekali bayar. Sudah termasuk kuota foto dan masa aktif awal.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{t.name}</p>
                <Badge tone={t.tier === 'PREMIUM' ? 'gold' : t.tier === 'STANDARD' ? 'rose' : 'neutral'}>{TIER_LABEL[t.tier]}</Badge>
              </div>
              <p className="mt-3 font-display text-4xl text-rose">{rupiah(t.price)}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-soft">
                {templateFeatures(t).map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
              <LinkButton href={`/templates/${t.id}`} variant="secondary" size="sm" className="mt-5">Lihat demo</LinkButton>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-soft">Butuh desain khusus di atas Premium? Pilih <Link href="/#faq" className="font-medium text-rose">jalur custom</Link> (mulai Rp500.000, dikerjakan tim kami).</p>
      </section>

      <section className="mt-16" aria-labelledby="addon">
        <h2 id="addon" className="font-display text-2xl text-ink">Add-on & tambahan</h2>
        <Card className="mt-6 overflow-hidden">
          <dl className="divide-y divide-line">
            {addOns.map((a) => (
              <div key={a.code} className="flex flex-wrap items-start justify-between gap-x-8 gap-y-1 px-6 py-4">
                <div className="max-w-xl">
                  <dt className="font-medium text-ink">{a.name}</dt>
                  <dd className="mt-0.5 text-sm text-ink-soft">{ADDON_DESC[a.code]}</dd>
                </div>
                <dd className="shrink-0 font-semibold tabular-nums text-ink">{rupiah(a.price)}{a.unit && <span className="font-normal text-ink-soft"> / {a.unit}</span>}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2" aria-labelledby="sewa">
        <div>
          <h2 id="sewa" className="font-display text-2xl text-ink">Cara kerja sewa media</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Foto besar dan video dihitung seperti menyewa penyimpanan kami: <strong className="text-ink">ukuran (dibulatkan ke MB) × lama tayang (minggu) × {rupiah(rate)}</strong>. Foto biasa (≤ 5 MB) dalam kuota template, dan video ≤ 20 MB dalam kuota template, tidak dikenai biaya ini. Foto di browser Anda dikompres otomatis agar tetap ringan dan gratis.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            <li>• Lama tayang tiap file bisa lebih pendek dari masa aktif undangan.</li>
            <li>• Perpanjang masa aktif: {rupiah(extend)} per minggu (+ sewa media besar bila ada).</li>
            <li>• Setelah berakhir, data tetap tersimpan 30 hari sebelum dihapus permanen.</li>
          </ul>
        </div>
        <RentalCalculator rate={rate} />
      </section>
    </div>
  );
}
