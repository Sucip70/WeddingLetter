import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { InvitationView } from '@/components/invitation/invitation-view';
import { PhoneFrame } from '@/components/invitation/phone-frame';
import { Badge, Card, LinkButton } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { ADDON_DESC, TIER_LABEL, getAddOns, getTemplate, templateFeatures } from '@/lib/catalog';
import { rupiah } from '@/lib/format';
import { sampleView } from '@/lib/sample';
import type { AddOn, TemplateDetail } from '@/lib/types';

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
  const [t, addOns] = await Promise.all([load(id), getAddOns().catch(() => [] as AddOn[])]);
  const view = sampleView(t.layout);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/templates" className="text-sm text-ink-soft hover:text-ink">← Semua template</Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-[auto_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PhoneFrame size="lg">
            <InvitationView view={view} mode="preview" embedded placeholders />
          </PhoneFrame>
          <p className="mt-4 text-center text-xs text-ink-soft">Demo interaktif · gulir di dalam layar ponsel</p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={t.tier === 'PREMIUM' ? 'gold' : t.tier === 'STANDARD' ? 'rose' : 'neutral'}>{TIER_LABEL[t.tier]}</Badge>
            <Badge>{t.category}</Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">{t.name}</h1>
          <p className="mt-5 flex items-baseline gap-2">
            <span className="font-display text-5xl text-rose">{rupiah(t.price)}</span>
            <span className="text-ink-soft">sekali bayar · masa aktif {t.includedWeeks} minggu</span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={`/create/${t.id}`} size="lg">Pakai template ini</LinkButton>
            <LinkButton href="/pricing" variant="secondary" size="lg">Lihat semua harga</LinkButton>
          </div>

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
        </div>
      </div>
    </div>
  );
}
