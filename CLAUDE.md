# WeddingLetter — Project Context

Platform undangan digital (Indonesia). User bisa membuat undangan sendiri dari template berbayar (mulai Rp20.000, self-service) atau memesan jasa custom. Dikerjakan solo (1 orang: dev + desain custom + CS) untuk saat ini.

**Dokumen rancangan lengkap (baca ini dulu kalau butuh detail/rationale):**
https://claude.ai/code/artifact/58f4bc99-4d05-4510-82be-9787128fb533

Dokumen itu berisi 11 bagian: nama & domain, biaya operasional, tech stack, alur pengguna, panel admin, harga template, add-on & kalkulator, skema database, roadmap, log keputusan, kebijakan bisnis (refund/legalitas/hak cipta lagu). File ini (`CLAUDE.md`) adalah ringkasan teknis untuk lanjut coding — kalau ada yang ambigu, cek dokumen di atas dulu sebelum menebak.

## Tech stack & struktur

Monorepo npm workspaces:
```
apps/web/   Next.js (TypeScript + Tailwind) — katalog, editor undangan, halaman publik
apps/api/   NestJS + Prisma 7 + PostgreSQL — auth, order, template builder, payment, RSVP
```
Setup lengkap ada di [README.md](./README.md) — install, jalankan database, migrate, seed, run dev.

## Status implementasi saat ini

Semua fitur inti dari rancangan **sudah diimplementasikan dan diverifikasi**: 113 unit test API, smoke test alur penuh terhadap Postgres sungguhan (`apps/api/scripts/smoke.mjs`, 164 pengecekan: user + admin + job pemeliharaan), dan alur UI dicoba langsung di browser. Cara menjalankan ada di README.

**API (`apps/api/src`)** — pola tiap modul: controller tipis + service + zod (`parseBody`) + `@UseGuards(AuthGuard)`/`@Roles('ADMIN')`.
- `auth/` email+OTP & Google, JWT bearer (dari sesi lain). Sesi 30 hari **bergulir** (`POST /auth/refresh`, dipanggil `session-keepalive.tsx` sekali sehari) supaya OTP email (berbayar) jarang dikirim; batas OTP `OTP_DAILY_LIMIT`/`OTP_PER_EMAIL_DAILY` di API + 10/jam per IP di `app/api/auth/[action]`.
- `templates/themes.ts` (registry 34 desain + palet: `DESIGNS`, `BASIC_PALETTES`, `autoPalettes`). Katalog = desain x paket (`prisma/seed.ts` membangun 69 baris; category = grup tema). Semua paket `musik.allowed = true`; lagu bawaan TIDAK ada di seed/skema template, melainkan dari tabel `MusicTrack` (modul `music/`, Admin → Musik, `minTier` BASIC/STANDARD/PREMIUM) yang digabung lewat `withLibrary()` di `templates.service` dan `pricing.service` (rujukan `preset:<id>`, `findPreset()`). Basic hanya desain `rustic` (8 warna); Standard/Premium semua desain, `theme.fx` = `standard`/`premium`.
- `templates/cover-layouts.ts` — tata letak sampul pilihan pembeli: `GENERIC_COVERS` (9, Standard & Premium) + `THEME_COVERS` (6 khusus tema, Premium; `THEME_COVER_BY_DESIGN`), `availableCoverLayouts(tier, motif)`. Disnapshot ke `layout.coverLayouts` lewat `withCoverLayouts()` dan dipilih pembeli di `data.cover.tata_letak` (FieldType `coverlayout`, divalidasi; Basic = tanpa pilihan).
- `templates/layout.ts` — **template engine berbasis skema** (juga `theme.motif`/`theme.fx`, `palettes`, `applyPalette` untuk warna pilihan pembeli; `GET /templates` sengaja ringan, detail lengkap di `GET /templates/:id`): `SECTION_REGISTRY` (section & field yang dikenali renderer), `normalizeLayout` (toleran skema lama), `effectiveSections` (section + add-on + musik), `validateInvitationData` (mode `lenient` untuk kalkulator), `toAuthoring` (untuk builder admin).
- `demo-photos/` — foto contoh untuk demo template (tabel `DemoPhoto`, slot di `demo-photos.slots.ts`; `GET /demo-photos` publik, `/admin/demo-photos` untuk mengganti). Berkas bawaan = ilustrasi SVG di `apps/api/assets/demo/` (dibuat `scripts/build-demo-photos.mjs`), diunggah ke `assets/demo-<slot>.svg` oleh seed / `npm run demo:photos`. Web: `getDemoPhotos()` -> `sampleView(layout, extra, photos)` mengisi foto mempelai/galeri/sampul (sampul hanya untuk template yang punya `coverLayouts`, yaitu Standard/Premium).
- `pricing/` — `pricing.calculator.ts` murni (rumus Bagian 6/7/7.1, teruji), `pricing.service.ts` (validasi + kupon), `POST /pricing/quote` publik.
- `orders/` (buat order + draf undangan + slot upload; perpanjangan = order `EXTENSION`), `payments/` (Midtrans Snap + webhook bertanda tangan; `DevProvider` hanya non-production), `media/` (presign/confirm/**replace**), `storage/` (R2 via S3 SDK, fallback disk lokal dev), `invitations/` (owner + publik + RSVP, `lifecycle.service.ts` = publish/pause/resume/extend/expire/purge), `admin/`, `jobs/maintenance.service.ts` (tiap jam), `notifications/` (Resend, Fonnte).
- Migrasi: `20260919033052_init`, `20260919100000_auth`, `20260920113934_orders_payments_media`, `20260921053354_music_library`, `20260921144114_demo_photos`.

**Web (`apps/web/src`)** — Next 16 App Router, Tailwind 4, tanpa library UI. Grup rute `(site)` memakai header/footer; `u/[slug]` bare.
- Token sesi di **cookie httpOnly** lewat `app/api/auth/[action]` (login) dan `app/api/backend/[...path]` (proxy ke API). Browser memakai `lib/client-api.ts`; server component memakai `lib/api.ts` + `lib/session.ts`.
- `components/invitation/motifs.ts` (paket motif per desain, kunci = `theme.motif`), `effects.tsx` (partikel, pola, efek sampul, bingkai foto, reveal saat gulir), `ornaments.tsx` (6 jenis ornamen), `gates.tsx` (19 gerbang pembuka Premium: adegan CSS/SVG, fase `closed`→`opening`→dilepas dikendalikan `InvitationView`; kunci = `theme.gate`, bawaan per desain di `DESIGN_GATES` API, hanya dipasang ke template Premium). Animasi digerbangi `theme.fx`; `fx: none` harus tetap tampil seperti desain Basic lama. Pratinjau (editor/dashboard/builder) melewati gerbang (`gate="skip"`) dengan tombol putar ulang; halaman live dan demo template menampilkannya. Untuk memeriksa frame animasi di browser pane: patch `setTimeout` (1400-3000 ms), klik gerbang, lalu `getAnimations({subtree:true})` -> `pause()` + `currentTime`.
- `components/invitation/cover.tsx` (15 layout sampul berfoto; layout `ornamen`/bawaan tetap dirender `InvitationView`), `lib/cover-layouts.ts` (registri web, sinkron dengan API), `components/editor/cover-picker.tsx` (pemilih + ikon sketsa). Layout yang butuh foto (`needs`) kembali ke ornamen bila foto belum ada (`resolveCover`). Pratinjau tidak menyimpan pilihan: editor mengisi bawaan (khusus tema, atau Foto berbingkai).
- `components/invitation/invitation-view.tsx` = renderer undangan (dipakai halaman publik, demo template, editor, dashboard, builder). `phone-frame.tsx` merender pada 390px lalu diskalakan.
- `components/editor/*` editor + checkout; `components/admin/template-builder.tsx`; dashboard di `(site)/dashboard`; admin di `(site)/admin`.

**Belum ada / ide lanjutan**: login HP+OTP (WhatsApp), penambahan file baru setelah beli (saat ini hanya *mengganti*), SEO/OG image, i18n web selain chrome undangan, tes otomatis frontend, CI, deployment (Docker/Nginx), rate limit global.

## Keputusan bisnis penting (jangan diubah tanpa alasan kuat — ini sudah diputuskan user)

- **Harga tier**: Basic Rp20.000, Standard Rp75.000, Premium Rp150.000. **Tidak ada tier Deluxe** — kebutuhan di atas Premium diarahkan ke Custom (mulai Rp500.000, by quotation).
- **Sewa media berukuran besar** (foto tambahan/video): `harga = (ukuran_MB / 100) x durasi_minggu x Rp70.000` = Rp700/MB/minggu. Minimum sewa 1 minggu.
- **Perpanjangan masa aktif undangan**: Rp10.000/minggu, minimum 1 minggu, harga adjustable oleh admin.
- **Grace period**: media/undangan expired disimpan 1 bulan sebelum dihapus permanen. Admin bisa pause status (hitung mundur berhenti, sisa durasi disimpan) untuk kasus user minta tunda tanggal acara, lalu resume nanti.
- **Kupon/diskon**: fitur aktif, dikelola admin (lihat entity `Coupon`).
- **Auth**: browsing & edit tanpa akun; akun wajib saat checkout (perlu identitas persisten untuk reminder perpanjangan).
- **Refund**: penuh hanya sebelum publish (window 24-48 jam); setelah publish final kecuali bug sistem.
- **Legalitas usaha**: mulai individu/UMKM (NIB perorangan), upgrade ke PT Perorangan saat transaksi rutin — bukan PT klasik.
- **Hak cipta lagu upload user**: sediakan library royalty-free default + izinkan upload sendiri dengan disclaimer ToS + batasi pemakaian ke lingkup personal (tidak diindeks publik).
- **Preview**: full preview undangan sebelum bayar (kemungkinan berwatermark), bukan cuma thumbnail.

## Catatan teknis penting (biar tidak mengulang masalah yang sudah dipecahkan)

- **Prisma di-pin ke `7.10.0`**, jangan upgrade ke `8.x` tanpa sengaja — tag `latest` di npm registry saat ini menunjuk ke `8.0.0-rc.x` (release candidate), bukan versi stabil.
- **Prisma 7 wajib driver adapter** — `PrismaService` pakai `@prisma/adapter-pg`, jangan hapus.
- Prisma client digenerate ke `apps/api/src/generated/prisma` (**di dalam `src/`**, bukan di luar) — kalau ini keluar dari `src/`, TypeScript `rootDir` akan error (`TS6059`). Sudah pernah kejadian, sudah diperbaiki, jangan diulang.
- Import path ke generated client dari `src/prisma/` atau `src/templates/` adalah `'../generated/prisma/client.js'` (satu level, bukan dua — sempat salah, sudah diperbaiki).
- Environment aslinya **tidak ada Docker Desktop** terpasang. `docker-compose.yml` tetap disiapkan untuk siapa pun yang punya Docker; alternatif tanpa Docker: `cd apps/api && npx prisma dev` (database Postgres lokal bawaan Prisma, tanpa install apa pun).
- npm di lingkungan pengembangan awal memblokir sebagian install script (`npm warn allow-scripts`) — Prisma tetap berfungsi normal meski begitu (sudah divalidasi), tapi kalau nanti ada package lain yang perilakunya aneh setelah install, cek ini duluan.
- **Hanya satu `next dev` per folder `.next`.** Untuk server kedua pakai `NEXT_DIST_DIR=.next-verify npx next dev -p 3100` (Next akan menyisipkan entri `.next-verify` ke `apps/web/tsconfig.json` dan memformat ulang file itu — jangan di-commit). ESLint sudah mengabaikan `.next-*`.
- Smoke test: API uji harus dijalankan dengan `APP_BASE_URL=http://localhost:4100` (URL upload lokal memakai nilai ini; kalau tertinggal di 4000 upload mengenai server dev dan gagal 403). Browser pane tidak menggambar saat tersembunyi: IntersectionObserver/transition baru berjalan setelah screenshot.
- Tes/verifikasi selalu pakai **database terpisah** (mis. `weddingletter_verify`), jangan database dev pengguna. Saat menyunting timestamp lewat SQL, pakai `(now() at time zone 'utc')` — Prisma menyimpan UTC tanpa zona (sesi Postgres lokal berzona WIB).
- Aturan teknis yang mudah terlewat: nilai tanggal-jam undangan disimpan sebagai waktu setempat WIB `YYYY-MM-DDTHH:mm`; media di `data` undangan dirujuk lewat id (di editor sementara lewat `clientId` lalu di-remap server saat order dibuat); `Invitation.layout` adalah **snapshot** skema saat beli (perubahan template oleh admin tidak merusak undangan yang sudah dibayar); kupon di-reserve atomik saat order dibuat.
- Saat menulis file lewat skrip `node -e`/heredoc di shell ini, backslash regex mudah hilang — pakai tool Edit/Write untuk kode berisi regex (pernah menyebabkan bug validasi tanggal).
