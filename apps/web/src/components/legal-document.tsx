import type { LegalPolicy } from '@/lib/legal';

export function LegalDocument({ policy, acceptedAt }: { policy: LegalPolicy; acceptedAt?: string | null }) {
  const { settings } = policy;
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-rose">WeddingLetter</p>
      <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">Syarat &amp; Ketentuan</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">WeddingLetter dikelola oleh <a href={settings.ownerUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline">{settings.ownerName}</a>. Ketentuan ini mengatur penggunaan dan pembelian layanan undangan digital.</p>
      <p className="mt-3 break-all text-xs text-ink-soft">Versi {policy.version}{acceptedAt && ` · Disetujui ${new Date(acceptedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`}</p>
      <div className="my-8 grid gap-4 rounded-2xl border border-line bg-paper p-5 text-sm sm:grid-cols-3">
        <div><p className="font-semibold text-ink">Masa aktif</p><p className="mt-1 text-ink-soft">Mulai saat dipublikasikan</p></div>
        <div><p className="font-semibold text-ink">Draf berbayar</p><p className="mt-1 text-ink-soft">{settings.draftRetentionDays} hari sejak pembayaran</p></div>
        <div><p className="font-semibold text-ink">Refund undangan baru</p><p className="mt-1 text-ink-soft">≤48 jam, belum dipublikasikan</p></div>
      </div>
      <div className="space-y-8">
        {policy.sections.map((s, i) => <section key={s.title}>
          <h2 className="font-display text-2xl text-ink">{i + 1}. {s.title}</h2>
          {s.paragraphs.map((p) => <p key={p} className="mt-3 text-sm leading-7 text-ink-soft">{p}</p>)}
        </section>)}
      </div>
      <section className="mt-10 rounded-2xl border border-line bg-paper p-6 text-sm leading-7 text-ink-soft">
        <h2 className="font-display text-2xl text-ink">Hubungi kami</h2>
        {policy.supportWhatsapp && <p>WhatsApp: <a href={`https://wa.me/${policy.supportWhatsapp}`} className="underline">{policy.supportWhatsapp}</a></p>}
        <p>Email: <a href={`mailto:${settings.supportEmail}`} className="underline">{settings.supportEmail}</a></p>
        <p>{settings.serviceHours}</p>
        <p>Target respons awal: paling lambat {settings.responseBusinessDays} hari kerja.</p>
      </section>
    </article>
  );
}
