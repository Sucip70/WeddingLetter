# Publisher katalog lokal ke staging

Katalog lokal menjadi sumber template, harga paket, add-on, foto demo, dan pustaka musik.
Script mengunggah seluruh media tema, foto contoh, dan audio lokal serta objek storage yang
dirujuk katalog. Data pelanggan, order, pembayaran, kupon, dan pengaturan situs tidak disalin.
Database staging yang di-reset kehilangan seluruh data lamanya, termasuk akun dan transaksi uji.

## 1. Ekspor dan periksa katalog lokal

Jalankan dari root repository. Konfigurasi sumber dibaca dari `apps/api/.env`.

```powershell
npm.cmd run catalog:export --workspace apps/api
npm.cmd run catalog:check --workspace apps/api
```

Hasilnya `output/catalog.json`, diabaikan Git. Simpan paket ini bersama salinan folder aset
lokal di penyimpanan kerja yang dibackup. Manifest tidak mengandung kredensial. Referensi media
menggunakan `storage://<key>` dan diterjemahkan oleh API tujuan ke URL bucket tujuan.
Ekspor gagal bila file sumber hilang. Referensi HTTP eksternal yang bukan storage sumber tetap
eksternal dan perlu diperiksa jika ingin seluruh media dimiliki sendiri.

## 2. Sinkronkan R2

Salin `deploy/staging/publisher.env.example` ke `.env.publisher` di root dan isi kredensial
TUJUAN. `TARGET_R2_BUCKET_NAME` wajib `weddingletter-staging`. `TARGET_R2_PUBLIC_URL` harus
sama dengan `R2_PUBLIC_URL` di `api.env` server. Akun/bucket sumber tetap menggunakan `apps/api/.env`.

```powershell
npm.cmd run catalog:sync --workspace apps/api
npm.cmd run catalog:sync --workspace apps/api -- --apply
```

Tanpa `--apply` hanya menampilkan rencana. Copy dilakukan melalui komputer lokal sehingga
kredensial bucket sumber dan tujuan bisa berbeda. Hash SHA-256 dan ukuran diperiksa sebelum
upload dan setelah dibaca kembali dari tujuan. Objek dengan key sama tetapi konten berbeda
menghentikan proses. Objek lain di bucket tujuan tidak dihapus. Perintah aman diulang setelah
terputus. File lokal memakai key berbasis hash konten. Objek R2 sumber mempertahankan key-nya.

## 3. Deploy kode, lalu fresh reset sekali

Deploy perubahan API, web, dan Nginx melalui workflow staging. Workflow ikut mengirim
`reset-database.sh`. Pastikan langkah 1 dan 2 berhasil sebelum reset.

Di VPS, dari direktori Compose staging, jalankan sekali dengan email admin sebenarnya.

```bash
cd ~/weddingletter-staging
export ADMIN_EMAIL='EMAIL_ADMIN_ANDA'
bash reset-database.sh --confirm-weddingletter-staging
```

Script memeriksa domain aplikasi dan nama bucket, membuat backup PostgreSQL format custom,
memverifikasi daftar isi backup, menghentikan web/API, membuat ulang schema public, menjalankan
migrasi, membuat akun admin, lalu menyalakan aplikasi. Jika gagal setelah reset, backup tetap
tersedia di `backups/`. Untuk pemulihan, hentikan API/web lalu gunakan `pg_restore --clean
--if-exists` ke database `weddingletter` dengan backup tersebut dan nyalakan kembali aplikasi.

Bootstrap ini hanya memasang schema dan akun admin. Seeder katalog lama tidak diperlukan.

## 4. Publish dari komputer lokal

Login di staging dengan OTP sebagai admin. Di browser DevTools, Application/Storage > Cookies,
salin nilai cookie `wl_session` ke `PUBLISHER_TOKEN` di `.env.publisher`. Perlakukan nilai itu
sebagai kata sandi dan perbarui ketika sesi kedaluwarsa.

```powershell
npm.cmd run catalog:publish --workspace apps/api
npm.cmd run catalog:publish --workspace apps/api -- --apply
npm.cmd run catalog:verify --workspace apps/api -- --apply
```

Endpoint publisher memakai bearer token dengan pemeriksaan role ADMIN di API, melalui rute
Nginx khusus. Foto demo, musik, dan add-on dipasang sebelum template. ID lokal dipertahankan.
Pengulangan memperbarui entri yang sama. Proses per entri, sehingga jika terputus jalankan lagi.
Manifest artwork dipasang sebagai snapshot pada layout template. ID relasi versi artwork dari
database sumber tidak diimpor. Draft artwork baru tetap dapat dibuat melalui API artwork.

## 5. Verifikasi visual dan lepas gambar dari Git

Periksa thumbnail, semua pilihan sampul, gerbang Premium, halaman isi, foto contoh, musik,
dan mobile. Bandingkan Sekar Keraton dengan versi lokal yang disetujui. Buka juga review route
khusus karena route yang membuat manifest lokal sendiri masih membutuhkan file lokal.

Setelah katalog dan tampilan staging sesuai, jalankan dari komputer lokal.

```powershell
npm.cmd run catalog:retire-local --workspace apps/api
npm.cmd run catalog:retire-local --workspace apps/api -- --apply
git diff --cached --stat
```

Perintah kedua memverifikasi seluruh objek tujuan dan data katalog, memeriksa hash file lokal,
lalu melepas file media paket dari Git index dengan `git rm --cached`. Salinan lokal tetap ada.
Review perubahan dan commit penghapusan pelacakan. Gambar lama masih ada pada riwayat Git.
Folder output dan gambar sumber harus dibackup di luar Git sebelum komputer kerja diganti.

Pembaruan berikutnya cukup ulangi langkah 1, 2, dan 4. Perubahan renderer atau animasi baru
memerlukan deployment kode. Reset database hanya untuk fresh staging ini.

`--file <path>` memilih paket lain. `--api http://localhost:4000` bisa dipakai untuk pengujian
API lokal. Publisher membatasi hostname tujuan ke staging atau localhost.
