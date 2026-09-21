import Link from 'next/link';
import { InvitationView } from '@/components/invitation/invitation-view';
import { PhoneFrame } from '@/components/invitation/phone-frame';
import { TemplateThumb } from '@/components/template-thumb';
import { Badge, LinkButton } from '@/components/ui';
import { GROUP_LABEL, TIER_LABEL, getAddOns, getDemoPhotos, getTemplate, getTemplates, groupByDesign, templateFeatures } from '@/lib/catalog';
import { rupiah, whatsappLink } from '@/lib/format';
import { sampleView } from '@/lib/sample';
import type { AddOn, Template, TemplateDetail, ThemeGroup } from '@/lib/types';

const STEPS = [
  { n: '01', title: 'Pilih template', body: 'Jelajahi desain dengan harga yang tertulis jelas di setiap kartu. Mulai dari Rp20.000.' },
  { n: '02', title: 'Isi data, lihat langsung', body: 'Nama, tanggal, lokasi, foto, dan musik. Pratinjau penuh muncul seketika, lengkap dengan total harga yang selalu terbarui.' },
  { n: '03', title: 'Bayar dengan mudah', body: 'QRIS, virtual account, atau e-wallet. Akun cukup dibuat saat checkout, tanpa kata sandi.' },
  { n: '04', title: 'Publikasikan & bagikan', body: 'Kirim link personal ke WhatsApp tamu (dengan nama mereka), lalu pantau RSVP dari dashboard.' },
];

const FEATURES = [
  ['RSVP online', 'Tamu konfirmasi hadir & jumlah orang. Anda melihat rekapnya real-time.'],
  ['Amplop digital', 'Rekening dan e-wallet dengan tombol salin, untuk tanda kasih dari jauh.'],
  ['Musik & galeri', 'Foto, video, dan lagu latar. Ukuran besar? Bayar sesuai pemakaian.'],
  ['Hitung mundur', 'Menuju hari bahagia, plus tombol simpan ke Google Calendar.'],
  ['Link personal', 'Tambahkan ?to=Nama pada link, dan tamu disapa dengan namanya.'],
  ['Dua bahasa', 'Tombol Indonesia ↔ Inggris untuk keluarga dan tamu dari luar negeri.'],
];

const FAQ = [
  ['Apakah saya harus membuat akun dulu?', 'Tidak. Anda bebas menjelajah dan mengisi undangan tanpa akun. Akun (cukup email + kode OTP) baru dibuat saat checkout, supaya Anda bisa kembali mengedit dan memperpanjang undangan.'],
  ['Bagaimana cara kerja harga "sewa media"?', 'Foto/video di atas kuota template dihitung seperti menyewa penyimpanan: ukuran (MB) × lama tayang (minggu) × Rp700. Contoh: video 100 MB selama 1 minggu = Rp70.000, 2 minggu = Rp140.000. Semua terlihat di kalkulator sebelum Anda membayar.'],
  ['Berapa lama undangan aktif? Bagaimana kalau habis?', 'Setiap template sudah termasuk masa aktif awal. Bisa diperpanjang per minggu. Setelah habis, data tetap disimpan 30 hari, jadi Anda bisa memperpanjang tanpa kehilangan apa pun. Kami kirim pengingat 3 hari sebelum berakhir.'],
  ['Bisakah minta refund?', 'Bisa, selama undangan belum dipublikasikan dan masih dalam 48 jam sejak pembayaran. Setelah dipublikasikan, transaksi bersifat final kecuali ada kendala teknis dari sistem kami.'],
  ['Saya ingin desain sendiri, bisa?', 'Bisa. Untuk kebutuhan di atas template (desain eksklusif, tata letak khusus), pilih jalur custom: kami rancang dari nol dan didampingi sampai selesai. Mulai Rp500.000.'],
];

export default async function HomePage() {
  let templates: Template[] = [];
  let addOns: AddOn[] = [];
  let photos: Record<string, string> = {};
  let heroA: TemplateDetail | undefined;
  let heroB: TemplateDetail | undefined;
  try {
    [templates, addOns, photos] = await Promise.all([getTemplates(), getAddOns(), getDemoPhotos()]);
    // Daftar katalog sengaja ringan (tanpa field & lagu), jadi demo hero mengambil detail lengkapnya.
    const premium = templates.filter((t) => t.tier === 'PREMIUM');
    const pick = (design: string) => premium.find((t) => t.design?.id === design) ?? premium[0] ?? templates[templates.length - 1];
    const [a, b] = [pick('sakura-anime'), pick('jawa')];
    [heroA, heroB] = await Promise.all([a ? getTemplate(a.id) : undefined, b ? getTemplate(b.id) : undefined]);
  } catch {
    // API belum jalan: halaman tetap tampil tanpa bagian yang butuh data.
  }

  // Satu contoh desain per grup tema untuk etalase.
  const showcase = (['suku', 'kartun', 'game', 'film', 'perayaan', 'musim'] as const)
    .map((g) => groupByDesign(templates).find((e) => e.group === g))
    .filter((e): e is NonNullable<typeof e> => !!e);

  const tiers = (['BASIC', 'STANDARD', 'PREMIUM'] as const)
    .map((tier) => templates.find((t) => t.tier === tier))
    .filter((t): t is Template => !!t);
  const rentalRate = addOns.find((a) => a.code === 'MEDIA_RENTAL_WEEK')?.price ?? 700;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-rose-soft/70 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-64 h-[26rem] w-[26rem] rounded-full bg-sage-soft/70 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="animate-fade-up">
            <Badge tone="rose" className="mb-5">Undangan digital · mulai Rp20.000</Badge>
            <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
              Undangan pernikahan yang <em className="text-rose not-italic">cantik</em>, dengan harga yang jujur.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Pilih template, isi data, dan lihat hasilnya langsung. Setiap rupiah tertulis jelas sebelum Anda membayar, dan Anda hanya membayar untuk yang benar-benar dipakai.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/templates" size="lg">Lihat template</LinkButton>
              <LinkButton href="#cara-kerja" variant="secondary" size="lg">Cara kerja</LinkButton>
            </div>
            <ul className="mt-10 grid max-w-xl gap-3 text-sm text-ink-soft sm:grid-cols-3">
              {['Harga transparan', 'Bayar sesuai pemakaian', 'Bisa desain custom'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-soft text-sage">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex justify-center lg:justify-end" aria-hidden={false}>
            {heroA && heroB ? (
              <div className="relative h-[560px] w-[500px] max-w-full scale-[0.82] sm:scale-100">
                <div className="absolute left-0 top-10 -rotate-[5deg]">
                  <PhoneFrame size="md">
                    <InvitationView view={sampleView(heroB.layout, {}, photos)} mode="preview" embedded placeholders />
                  </PhoneFrame>
                </div>
                <div className="absolute right-0 top-0 rotate-[4deg]">
                  <PhoneFrame size="md">
                    <InvitationView view={sampleView(heroA.layout, {}, photos)} mode="preview" embedded placeholders />
                  </PhoneFrame>
                </div>
              </div>
            ) : (
              <div className="h-80 w-56 overflow-hidden rounded-3xl border border-line shadow-xl">
                <TemplateThumb theme={{ preset: 'floral', motif: 'floral', fx: 'none', primary: '#c4587a', secondary: '#e9b7c6', background: '#fff7f9', text: '#4a2c38', headingFont: 'script', bodyFont: 'sans' }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="scroll-mt-20 border-y border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-rose">Cara kerja</p>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Dari pilih template sampai tersebar di WhatsApp, kurang dari 15 menit.</h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-line bg-ivory p-6">
                <span className="font-display text-3xl text-rose/70">{s.n}</span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Template */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-rose">Template</p>
              <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Pilih tema yang paling menggambarkan Anda berdua: budaya, religi, perayaan, kartun, game, film, atau musim.</h2>
            </div>
            <LinkButton href="/templates" variant="secondary">Semua template →</LinkButton>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((e) => {
              const first = e.rows[0]!;
              return (
                <Link key={e.key} href={`/templates/${first.id}`} className="group overflow-hidden rounded-3xl border border-line bg-paper transition-shadow hover:shadow-xl hover:shadow-ink/5">
                  <div className="aspect-[4/5] overflow-hidden">
                    <TemplateThumb theme={first.layout.theme} imageUrl={first.thumbnailUrl} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-semibold text-ink">{e.name}</p>
                      <p className="text-sm text-ink-soft">{GROUP_LABEL[e.group as ThemeGroup] ?? e.group} · {e.rows.map((r) => TIER_LABEL[r.tier]).join(' / ')}</p>
                    </div>
                    <p className="text-right text-sm text-ink-soft">mulai<br /><span className="font-display text-xl text-rose">{rupiah(first.price)}</span></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Harga */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-rose">Harga transparan</p>
            <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Bayar untuk yang dipakai. Tidak ada biaya tersembunyi.</h2>
            <p className="mt-5 leading-relaxed text-ink-soft">
              Harga template sudah termasuk kuota foto dan masa aktif awal. Butuh lebih? Foto, video, dan masa aktif tambahan dihitung seperti menyewa penyimpanan: ukuran × lama tayang. Kalkulator di editor menunjukkan total Anda secara langsung.
            </p>
            <div className="mt-6 rounded-2xl border border-line bg-ivory p-5">
              <p className="text-sm font-semibold text-ink">Contoh sewa video</p>
              <dl className="mt-3 space-y-2 text-sm">
                {[[100, 1], [100, 2], [200, 1]].map(([size, weeks]) => (
                  <div key={`${size}-${weeks}`} className="flex justify-between gap-3 border-b border-line/70 pb-2 last:border-0 last:pb-0">
                    <dt className="text-ink-soft">{size} MB · {weeks} minggu</dt>
                    <dd className="font-medium tabular-nums text-ink">{rupiah(size! * weeks! * rentalRate)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <LinkButton href="/pricing" variant="secondary" className="mt-6">Lihat daftar harga lengkap</LinkButton>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {tiers.map((t, i) => (
              <div key={t.id} className={`rounded-3xl border p-6 ${i === 1 ? 'border-rose bg-rose-soft/40 shadow-lg shadow-rose/10' : 'border-line bg-ivory'}`}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink">{TIER_LABEL[t.tier]}</p>
                  {i === 1 && <Badge tone="rose">Populer</Badge>}
                </div>
                <p className="mt-4 font-display text-3xl text-ink">{rupiah(t.price)}</p>
                <ul className="mt-5 space-y-2 text-sm text-ink-soft">
                  {templateFeatures(t).map((f) => (
                    <li key={f} className="flex gap-2"><span className="text-sage">✓</span>{f}</li>
                  ))}
                </ul>
                <LinkButton href={`/templates/${t.id}`} variant={i === 1 ? 'primary' : 'secondary'} size="sm" className="mt-6 w-full">Pilih {TIER_LABEL[t.tier]}</LinkButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-rose">Fitur</p>
          <h2 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Semua yang dibutuhkan undangan modern.</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-paper p-6">
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Custom */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-ink px-8 py-14 text-ivory sm:px-14">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold">Desain custom</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl">Punya konsep sendiri? Kami rancang dari nol.</h2>
              <p className="mt-4 max-w-xl leading-relaxed text-ivory/75">
                Ceritakan tema, warna, dan referensi Anda. Kami buatkan penawaran, kerjakan desainnya, dan revisi sampai Anda puas. Mulai Rp500.000.
              </p>
            </div>
            <div className="md:text-right">
              <LinkButton href={whatsappLink('Halo WeddingLetter, saya ingin memesan desain undangan custom.')} external size="lg" className="bg-ivory text-ink hover:bg-white">
                Konsultasi via WhatsApp
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center font-display text-3xl text-ink sm:text-4xl">Pertanyaan yang sering diajukan</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-paper">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                {q}
                <span className="text-rose transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <LinkButton href="/templates" size="lg">Mulai buat undangan</LinkButton>
        </div>
      </section>
    </>
  );
}
