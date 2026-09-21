# WeddingLetter

Platform undangan pernikahan digital (Indonesia). Pengguna membuat undangan sendiri dari template berbayar (mulai Rp20.000) atau memesan jasa custom. Harga transparan dan dihitung sesuai pemakaian: template + masa aktif + add-on + sewa media besar (ukuran × lama tayang).

Rancangan lengkap (biaya, tech stack, alur, skema, kebijakan) ada di dokumen proyek yang tertaut di [CLAUDE.md](./CLAUDE.md).

## Struktur monorepo (npm workspaces)

```
apps/
  api/   NestJS 12 + Prisma 7 + PostgreSQL — auth, template, harga, order, pembayaran, media, undangan, admin, job
  web/   Next.js 16 (App Router) + Tailwind 4 — katalog, editor, checkout, dashboard, halaman undangan, panel admin
docker-compose.yml   PostgreSQL lokal (opsional)
```

## Setup lokal

Prasyarat: Node 24+, PostgreSQL 16 (Docker **atau** instalasi lokal **atau** `npx prisma dev`).

1. Install dependency dari root:
   ```
   npm install
   ```
2. Database — pilih salah satu:
   - Docker: `docker compose up -d` (user/password/db `weddingletter`)
   - Tanpa Docker: `cd apps/api && npx prisma dev` lalu salin connection string yang tercetak
   - PostgreSQL lokal: buat database kosong `weddingletter`
3. Environment:
   ```
   cp apps/api/.env.example apps/api/.env      # sesuaikan DATABASE_URL
   cp apps/web/.env.example apps/web/.env.local
   ```
4. Migrasi + data awal (tier, add-on, tarif, kupon contoh). Untuk membuat **akun admin pertama** isi `ADMIN_EMAIL`:
   ```
   cd apps/api
   npx prisma migrate deploy
   ADMIN_EMAIL=email-anda@contoh.com npx prisma db seed
   ```
5. Jalankan (dua terminal):
   ```
   npm run dev:api    # http://localhost:4000
   npm run dev:web    # http://localhost:3000
   ```

### Mencoba alurnya secara lokal (tanpa kredensial apa pun)

- **Login**: masukkan email → kode OTP 6 digit **dicetak di log server API** (tanpa `RESEND_API_KEY`). Login dengan `ADMIN_EMAIL` di atas untuk membuka `/admin`.
- **Upload media**: tanpa kredensial R2, file disimpan di `apps/api/uploads` (driver disk lokal, khusus development).
- **Pembayaran**: tanpa `MIDTRANS_SERVER_KEY`, checkout diarahkan ke halaman **simulasi bayar** `/dev/pay/...` (dinonaktifkan otomatis di production).
- **Notifikasi** (email/WhatsApp): hanya dicetak di log.

Alur uji: `/templates` → pilih template → isi (harga live di kanan) → Checkout → login → unggah otomatis → simulasi bayar → `/dashboard` → Publikasikan → buka `/u/<slug>?to=Nama+Tamu`.

## Yang sudah ada

**Pengguna**
- Katalog **34 desain x 3 paket** (69 template): dikelompokkan per tema (klasik, suku & budaya, religi, perayaan, kartun, video game, film, musim). Demo interaktif dengan ganti warna dan dengar lagu bawaan; halaman harga + kalkulator sewa media.
- **Basic** = desain Rustic dengan 8 pilihan warna (tanpa animasi). Desain yang sama juga tersedia di Standard & Premium. **Standard** = animasi sedang + 4 lagu rekomendasi; **Premium** = animasi penuh + seluruh pustaka 20 lagu. Warna dipilih pembeli gratis (di editor dan bisa diganti lagi di dashboard).
- Editor berbasis skema template: form dinamis, pratinjau ponsel langsung (berwatermark sebelum bayar), draf otomatis di browser, kompres foto otomatis (≤2000px), kalkulator harga live (server = sumber kebenaran).
- Akun hanya diminta saat checkout (email + OTP, atau Google bila dikonfigurasi) tanpa meninggalkan editor.
- Checkout: buat pesanan → unggah file langsung ke storage (URL bertanda tangan, ukuran diverifikasi server) → bayar (Midtrans Snap).
- Dashboard: daftar undangan/pesanan, publikasi, link personal per tamu (`?to=`) + kirim WhatsApp, edit isi, **ganti foto/video/lagu tanpa biaya**, rekap RSVP + unduh CSV, perpanjang masa aktif / aktifkan kembali dari masa tenggang.
- Halaman undangan publik: sampul, mempelai, cerita, acara + simpan ke Google Calendar, hitung mundur, galeri + lightbox, video, musik latar, RSVP, amplop digital, buku tamu, toggle ID/EN.

**Admin (`/admin`)**
- Ringkasan bisnis, pesanan (cari/filter, tandai lunas manual, refund), undangan (jeda/lanjutkan + bonus hari, perpanjang gratis, atur tanggal berakhir, hapus), pengguna & peran.
- **Template builder**: aktif/urut section, field wajib/label, desain (34 pilihan, per grup) + warna + font + level animasi, palet warna untuk pembeli, kuota foto/video, lagu bawaan (unggah sendiri atau ambil dari pustaka), pratinjau langsung, publish/arsip.
- Harga per komponen (add-on, tarif Rp/MB/minggu, perpanjangan) dan kupon — langsung berlaku.

**Sistem**
- Siklus hidup: `DRAFT → ACTIVE → EXPIRED_GRACE (30 hari) → DELETED`, `PAUSED` menyimpan sisa hari. Job tiap jam (idempotent): kedaluwarsa, hapus permanen (file storage ikut), tutup pesanan >24 jam (kupon dikembalikan), pengingat H-3 (email + WhatsApp Fonnte).
- Kupon di-reserve atomik saat order dibuat, dikembalikan bila batal/kedaluwarsa.
- Pembayaran idempoten; webhook Midtrans diverifikasi signature + nominal.

## Testing

```
npm test --workspace apps/api          # 81 unit test (kalkulator harga, skema/validasi, webhook, storage, dst.)
```

Smoke test alur penuh (user + admin + job) terhadap API & **database khusus tes** — script ini membuat user/order, jangan arahkan ke database dev Anda:

```
cd apps/api && npm run build
DATABASE_URL=postgresql://.../weddingletter_test JWT_SECRET=smoke-secret APP_PORT=4100 APP_BASE_URL=http://localhost:4100 node dist/main.js   # terminal 1 (setelah migrate deploy + seed di DB tes)
API_URL=http://localhost:4100 DATABASE_URL=postgresql://.../weddingletter_test JWT_SECRET=smoke-secret node scripts/smoke.mjs   # terminal 2
```

## Konfigurasi production

| Variabel (apps/api) | Fungsi |
|---|---|
| `DATABASE_URL`, `JWT_SECRET` | wajib; `JWT_SECRET` harus diganti dari `change-me` |
| `WEB_BASE_URL`, `APP_BASE_URL` | asal web (CORS + link) & URL publik API |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION` | pembayaran. Set URL notifikasi Midtrans ke `POST {APP_BASE_URL}/payments/midtrans/notification` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | storage media (Cloudflare R2). Aktifkan CORS bucket: `PUT` dari `WEB_BASE_URL`, header `Content-Type`. |
| `RESEND_API_KEY`, `MAIL_FROM` | email OTP & notifikasi |
| `FONNTE_TOKEN` | WhatsApp (pengingat perpanjangan) |
| `GOOGLE_CLIENT_ID` (+ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` di web) | login Google |
| `TRUST_PROXY=1` | bila di belakang Nginx/Cloudflare (IP tamu asli untuk pembatas RSVP) |
| `DISABLE_JOBS=true` | matikan job berkala (mis. bila dijalankan di instance terpisah) |

Web: `API_URL` (alamat API dari server Next), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP`.

Di production tanpa kredensial Midtrans/R2/Resend, endpoint terkait **menolak** (503), bukan jatuh ke mode simulasi.

## Asumsi yang perlu dikonfirmasi

- **Masa aktif termasuk per template** (`Template.includedWeeks`, default 4 minggu, bisa diubah di builder). Perpanjangan Rp10.000/minggu (dapat diubah admin).
- **Publikasi eksplisit**: setelah bayar undangan berstatus draf; masa aktif mulai saat "Publikasikan" (selaras kebijakan refund: penuh hanya sebelum publish & ≤48 jam). Refund dieksekusi admin; pengembalian uang manual di dashboard Midtrans.
- **Batas gratis per file**: foto ≤5 MB, video ≤20 MB dalam kuota template; di atasnya sewa ukuran×minggu. Lagu custom flat, maks. 8 MB. Batas keras foto 30 MB / video 500 MB.
- Lagu bawaan (preset) belum ada isinya — unggah dari template builder (butuh lagu berlisensi/royalty-free).
- Waktu acara diperlakukan sebagai WIB.

## Catatan teknis

- **Prisma dipin di `7.10.0`** (tag `latest` npm menunjuk `8.0.0-rc.x`). Prisma 7 wajib driver adapter (`@prisma/adapter-pg`). Client digenerate ke `apps/api/src/generated/prisma` (harus di dalam `src/`).
- **Tema & animasi**: satu desain = entri di `apps/api/src/templates/themes.ts` (warna, font, lagu rekomendasi) + paket motif di `apps/web/src/components/invitation/motifs.ts` (ornamen, pola, partikel, bingkai foto, gaya hitung mundur, efek sampul, teks pengganti), kuncinya sama dengan id desain. Level animasi ada di `theme.fx` (`none` / `standard` / `premium`) dan diatur per template. Menambah desain baru: tambahkan di kedua file itu lalu `npx prisma db seed` (idempotent; harga yang sudah diubah admin tidak ditimpa).
- Tema kartun/game/film hanya **terinspirasi gaya umum** (palet, ornamen, teks) dan tidak memakai karakter, logo, atau nama berhak cipta. Jangan menambahkan nama/karakter merek dagang ke desain.
- **Lagu bawaan** (20 trek) dibuat orisinal lewat kode: `npm run music -w web` menghasilkan `apps/web/public/audio/*.mp3` (hasilnya di-commit, ±4,7 MB). Daftar id ada di `apps/api/src/templates/music-library.ts`. Lagu berlisensi lain bisa ditambahkan admin lewat builder.
- Hanya satu server `next dev` per folder `.next`. Untuk server kedua: `NEXT_DIST_DIR=.next-verify npx next dev -p 3100` (Next akan menambah entri `.next-verify` ke `tsconfig.json`; jangan di-commit).
- npm di mesin dev awal memblokir sebagian install script (`allow-scripts`); Prisma tetap berfungsi.
