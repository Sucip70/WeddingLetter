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

Sudah ada dan **sudah dites jalan end-to-end** (migrate + seed + API beneran query ke database):
- `apps/api/prisma/schema.prisma` — seluruh entitas: User, Template, AddOn, Coupon, Order, OrderAddOn, Invitation, MediaFile, RsvpGuest.
- `apps/api/src/prisma/` — `PrismaService`/`PrismaModule`, pola koneksi database untuk seluruh modul berikutnya.
- `apps/api/src/templates/` — modul contoh (`GET /templates`, `GET /templates/:id`), **pakai ini sebagai pola** untuk modul Order, AddOn, Coupon, Invitation, RSVP, Auth.
- `apps/api/prisma/seed.ts` — data awal sesuai harga final (tier, add-on, tarif sewa media, 1 kupon contoh).
- `apps/web` — masih scaffold default create-next-app, belum ada halaman custom.

- `apps/api/src/auth/` — Auth selesai: email+OTP (Resend) & Google ID token, JWT bearer via `jose`, validasi body pakai `zod`. Pakai `@UseGuards(AuthGuard)` + `@CurrentUser()` (+ `@Roles('ADMIN')`) di endpoint yang wajib akun; `AuthModule` global. Sudah dites: unit test + HTTP test (Prisma di-mock) dan alur nyata ke Postgres lokal (request OTP → verify → `/auth/me`, kode tidak bisa dipakai ulang); migrasi `20260919100000_auth` sudah ter-apply. Login HP+OTP (WhatsApp/Fonnte) belum ada.

Belum dikerjakan (urutan disarankan, lihat README bagian "Belum dikerjakan"):
1. ~~Auth~~ (lihat di atas)
2. Order + kalkulator harga (formula persis di dokumen Bagian 7.1)
3. Integrasi Midtrans/Xendit
4. Editor undangan di frontend (form dinamis dari `layoutSchema` template + live preview penuh dengan watermark)
5. Panel admin (template builder, kelola harga per komponen, daftar pesanan)
6. Upload media ke Cloudflare R2 + job harian expire/grace period
7. Notifikasi WhatsApp (Fonnte) untuk reminder perpanjangan

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
- Belum ada commit git — semua masih di working directory saat file ini ditulis.
