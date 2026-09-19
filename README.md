# WeddingLetter

Platform undangan digital — user bisa bangun undangan sendiri dari template berbayar (mulai Rp20.000) atau minta jasa custom. Rancangan lengkap (biaya operasional, tech stack, alur pengguna, skema database, roadmap, kebijakan bisnis) ada di dokumen proyek: lihat link yang dibagikan di percakapan Claude.

## Struktur monorepo

```
WeddingLetter/
├── apps/
│   ├── web/   Next.js (TypeScript + Tailwind) — katalog template, editor undangan, halaman publik
│   └── api/   NestJS + Prisma + PostgreSQL — auth, template builder, order, payment, RSVP
├── docker-compose.yml   PostgreSQL lokal
└── package.json         npm workspaces root
```

## Setup awal

1. Install dependencies (dari root, workspaces otomatis meng-cover kedua app):
   ```
   npm install
   ```
2. Siapkan database lokal — pilih salah satu:
   - **Docker** (disarankan, sama dengan setup produksi di Bagian 2 & 3 dokumen):
     ```
     docker compose up -d
     ```
   - **Tanpa Docker** (pakai database lokal bawaan Prisma):
     ```
     cd apps/api
     npx prisma dev
     ```
     Salin connection string yang tercetak ke `DATABASE_URL` di `apps/api/.env`.
3. Copy env contoh lalu isi kredensial nyata (Midtrans/Xendit, Cloudflare R2, Fonnte, dll) saat sudah tersedia:
   ```
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
4. Jalankan migrasi & seed data awal (tier template, add-on, tarif sewa media, contoh kupon — sesuai harga yang sudah diputuskan):
   ```
   cd apps/api
   npx prisma migrate deploy
   npx prisma db seed
   ```
5. Jalankan kedua app (dari root, dua terminal terpisah):
   ```
   npm run dev:api   # http://localhost:4000
   npm run dev:web   # http://localhost:3000
   ```
6. Cek API sudah nyambung ke database:
   ```
   curl http://localhost:4000/templates
   ```
   Harus mengembalikan 3 template hasil seed (Basic Rustic, Standard Floral, Premium Elegant).

## Yang sudah ada

- Skema database (`apps/api/prisma/schema.prisma`) mencakup seluruh entitas dari dokumen: User, Template, AddOn, Coupon, Order, OrderAddOn, Invitation, MediaFile, RsvpGuest — lengkap dengan status pause/expired_grace untuk fitur sewa media berdurasi.
- Modul `PrismaService` (koneksi database, driver adapter `@prisma/adapter-pg` sesuai Prisma 7) dan modul `Templates` (endpoint `GET /templates`, `GET /templates/:id`) sebagai contoh pola untuk modul-modul berikutnya (Auth, Order, AddOn, Coupon, Invitation, RSVP).
- Seed data mengikuti harga final: tier Basic/Standard/Premium, add-on flat, tarif sewa media Rp700/MB/minggu, perpanjangan Rp10.000/minggu, kupon contoh `TEMANKELUARGA`.

## Belum dikerjakan (langkah berikutnya)

Urutan yang disarankan, mengikuti roadmap Bagian 9 di dokumen:
1. Modul Auth (registrasi/login email+OTP atau Google, sesuai keputusan Bagian 4 — anonim sampai checkout)
2. Modul Order + kalkulator harga (tier + add-on + sewa media ukuran×durasi + kupon, formula persis di Bagian 7.1)
3. Integrasi Midtrans/Xendit untuk pembayaran
4. Editor undangan di frontend (form dinamis berdasar `layoutSchema` template, live preview)
5. Panel admin (template builder, kelola harga, daftar pesanan — Bagian 5)
6. Upload media ke Cloudflare R2 + job harian untuk expire/grace period media (Bagian 7.1 & 8)
7. Notifikasi WhatsApp (Fonnte) untuk reminder perpanjangan

## Catatan teknis

- Prisma di-pin ke versi stabil `7.10.0` (bukan `8.0.0-rc.x` yang jadi tag `latest` di npm saat ini) supaya tidak jalan di atas release candidate.
- Prisma 7 mewajibkan driver adapter (`@prisma/adapter-pg`) — sudah di-set di `PrismaService` dan `prisma/seed.ts`.
- npm di mesin ini memblokir sebagian install script secara default (pesan `npm warn allow-scripts`). Prisma tetap berfungsi normal (sudah divalidasi end-to-end: migrate, seed, dan endpoint API), tapi kalau nanti ada package lain yang butuh postinstall script dan terasa "rusak", itu kemungkinan penyebabnya — jalankan `npm approve-scripts` untuk review manual.
