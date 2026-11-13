# Production — weddingletter.id (shared VPS)

Runbook untuk VPS Ubuntu 24.04, 2 CPU / 2 GB RAM. **Ini konfigurasi yang disiapkan,
bukan bukti production sudah terdeploy.** Build dilakukan di GitHub, bukan di VPS.
Staging dan production punya database, volume, kredensial, dan ingress network berbeda.
Hanya `weddingletter-edge` yang mengikat port host 80/443 setelah cutover.

## Aturan penting

- Jangan reset database staging, menjalankan `down -v`, atau mengganti JWT staging.
- Jangan menjalankan deployment staging dan production bersamaan. Workflow memakai concurrency group yang sama.
- Batas RAM/log bukan jaminan kapasitas: pantau `free -h`, `docker stats --no-stream`, `df -h /` dan uji beban.
- Rilis/recreate dan cutover **belum zero-downtime**. Jadwalkan jendela pemeliharaan singkat.
- Tidak ada penghapusan image/backup otomatis. Pertahankan rilis rollback; bersihkan image tua secara terkontrol.
- Domain canonical saat ini `https://weddingletter.id`, tanpa `www`. Jangan arahkan `www` sebelum sertifikat/redirect disiapkan.
- Jangan simpan secret di Git atau chat. Contoh `.env`, `api.env`, dan publisher harus diisi di tempat yang sesuai.

## 1. Persiapan layanan dan GitHub

Siapkan DNS Cloudflare `weddingletter.id` ke VPS (Proxied, Full strict), bucket R2
`weddingletter-production`, dan custom domain `https://media.weddingletter.id`.
Token aplikasi/publisher harus dibatasi ke bucket production, terpisah dari staging.
CORS bucket:

```json
[{"AllowedOrigins":["https://weddingletter.id"],"AllowedMethods":["PUT","GET","HEAD"],"AllowedHeaders":["*"],"MaxAgeSeconds":3600}]
```

Siapkan live Midtrans key dan notification URL
`https://weddingletter.id/payments/midtrans/notification`, Resend sending-only key
untuk domain terverifikasi, serta Google OAuth origin `https://weddingletter.id`.

GitHub → Settings → Environments → `production`:

| Jenis | Nama | Isi |
|---|---|---|
| Secret | `PRODUCTION_SSH_HOST` | IP VPS |
| Secret | `PRODUCTION_SSH_USER` | `deploy` |
| Secret | `PRODUCTION_SSH_KEY` | Private key khusus production |
| Secret | `PRODUCTION_SSH_KNOWN_HOSTS` | Host key VPS yang sudah diverifikasi |
| Variable | `NEXT_PUBLIC_APP_URL` | `https://weddingletter.id` |
| Variable | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID publik yang sama dengan API |

Batasi deployment environment ke branch `production`; aktifkan reviewer bila paket GitHub mendukungnya.
Workflow hanya `workflow_dispatch`, tidak dipicu push. Agar tombol Run workflow tersedia,
file workflow juga harus ada di default branch repository (saat persiapan ini: `master`).
Merge konfigurasi ke default branch, uji di `staging`, lalu promosikan commit teruji ke branch
`production`. Saat Run workflow, pilih branch `production` dan ketik `DEPLOY PRODUCTION`.
Jangan membuat branch kosong atau langsung menjalankan workflow sebelum bagian 2–4 selesai.

## 2. Folder dan konfigurasi server

Perintah server berikut dijalankan sebagai **user deploy**, bukan root. Jika sedang root:

```bash
sudo -iu deploy
mkdir -p ~/weddingletter-production ~/weddingletter-edge/nginx/templates
mkdir -p ~/weddingletter-edge/certs/staging ~/weddingletter-edge/certs/production
```

Salin file dari checkout repository di laptop menggunakan akses SSH pribadi yang sudah berfungsi.
Contoh PowerShell, dari root repository; ganti `IP_VPS` (key GitHub tidak harus disalin ke laptop):

```powershell
scp deploy/production/docker-compose.yml deploy/production/deploy.sh deploy/production/.env.example deploy/production/api.env.example deploy@IP_VPS:weddingletter-production/
scp deploy/shared-edge/docker-compose.yml deploy@IP_VPS:weddingletter-edge/
scp deploy/shared-edge/nginx/templates/*.template deploy@IP_VPS:weddingletter-edge/nginx/templates/
scp deploy/staging/nginx/cloudflare-realip.conf deploy@IP_VPS:weddingletter-edge/nginx/
scp deploy/staging/docker-compose.shared.yml deploy/staging/deploy.sh deploy@IP_VPS:weddingletter-staging/
```

Di VPS, salin contoh hanya jika file tujuan belum ada, lalu isi nilainya:

```bash
cd ~/weddingletter-production
cp -n .env.example .env
cp -n api.env.example api.env
nano .env
nano api.env
chmod 600 .env api.env
```

Gunakan password database **berbeda** dari staging, hasil `openssl rand -hex 24`.
Gunakan JWT baru, hasil `openssl rand -base64 48`. Isi seluruh key layanan production.
`TAG` boleh kosong saat ini; workflow memberi tag immutable dan menyimpannya setelah deploy sehat.
Jangan menjalankan `docker compose up` production dengan TAG kosong.

User `deploy` harus bisa menjalankan Docker (akses grup Docker setara akses root), dan menarik
image GHCR privat: `docker login ghcr.io -u Sucip70`, gunakan PAT `read:packages` sebagai password.
Jangan menaruh PAT ke perintah dengan argumen password atau commit ke repository.

## 3. Sertifikat, network, dan validasi edge sebelum cutover

Buat Cloudflare Origin Certificate yang mencakup **weddingletter.id**. Sertifikat staging-only
tidak cukup untuk root domain. Simpan sertifikat production di:

```text
/home/deploy/weddingletter-edge/certs/production/origin.pem
/home/deploy/weddingletter-edge/certs/production/origin.key
```

Salin sertifikat staging dan Basic Auth tanpa mengubah aslinya:

```bash
cp ~/weddingletter-staging/certs/origin.pem ~/weddingletter-edge/certs/staging/origin.pem
cp ~/weddingletter-staging/certs/origin.key ~/weddingletter-edge/certs/staging/origin.key
cp ~/weddingletter-staging/htpasswd ~/weddingletter-edge/htpasswd
chmod 600 ~/weddingletter-edge/certs/*/origin.key ~/weddingletter-edge/htpasswd
docker network inspect weddingletter-staging-ingress >/dev/null 2>&1 || docker network create weddingletter-staging-ingress
docker network inspect weddingletter-production-ingress >/dev/null 2>&1 || docker network create weddingletter-production-ingress
cd ~/weddingletter-edge
docker compose config --quiet
docker compose run --rm --no-deps nginx nginx -t
```

`run` di atas tidak memublikasikan port service; staging tetap berjalan. Jangan lanjut jika validasi gagal.
Nginx memakai DNS Docker dinamis sehingga service production boleh belum ada pada tahap ini.

## 4. Cutover pintu masuk (manual, sekali saja)

**Prasyarat:** workflow staging yang BARU beserta `deploy.sh` harus sudah masuk branch staging dan
berhasil dijalankan setidaknya sekali dalam mode lama. Workflow lama akan mencoba menghidupkan
Nginx staging dan merebut port setelah cutover. Jangan lanjut kalau prasyarat ini belum terpenuhi.

Di server, sebagai deploy, backup staging sebelum pergantian (simpan salinan off-server juga):

```bash
cd ~/weddingletter-staging
umask 077
mkdir -p backups
docker compose exec -T postgres pg_dump -U weddingletter -d weddingletter -Fc > "backups/before-shared-edge-$(date -u +%Y%m%dT%H%M%SZ).dump"
grep '^TAG=' .env
```

TAG harus `staging-<40 karakter SHA>` dari deploy sehat terakhir, bukan tag floating `staging`.
Catat juga `docker compose images` untuk rollback. Di `.env` staging, tambahkan tepat satu baris:

```dotenv
COMPOSE_FILE=docker-compose.yml:docker-compose.shared.yml
```

Aktifkan override yang mempertahankan nama project dan volume database lama:

```bash
docker compose config --quiet
docker compose stop nginx
docker compose up -d postgres api web
cd ~/weddingletter-edge
docker compose up -d
docker compose exec nginx nginx -t
docker compose logs --tail=30 nginx
```

Periksa lewat domain Cloudflare: staging `/` tanpa kredensial harus 401; staging manifest harus 200.
Login penguji dan periksa staging normal. Production boleh 502 sampai deployment aplikasi pertama selesai.
Jika stage gagal: hentikan nginx edge (`cd ~/weddingletter-edge && docker compose stop nginx`),
hapus **hanya baris COMPOSE_FILE** dari `.env` staging lewat editor, lalu di folder staging jalankan
`docker compose up -d postgres api web nginx`. Tidak perlu `down`, tidak perlu reset database.

## 5. Deployment production pertama

Setelah cutover staging lolos dan seluruh konfigurasi siap: jalankan workflow Production secara manual
dari branch `production`, dengan konfirmasi yang diminta. Workflow menguji kode/config, membangun image
di GitHub, menyalin konfigurasi aplikasi, lalu menjalankan `deploy.sh` di server. Workflow TIDAK menyalin
secret, tidak mengubah shared edge, dan tidak menyentuh volume staging.

`deploy.sh` memeriksa target, disk, shared edge, membackup database production yang sudah ada,
menarik image, menjalankan migrasi melalui startup API, dan memeriksa API/web sehat.
TAG disimpan ke `.env` setelah berhasil. Home dan manifest publik harus 200 tanpa Basic Auth.

Jika gagal, periksa `docker compose logs --tail=80 api web`. Jangan menjalankan reset database.
Backup dibuat sebelum migrasi (kecuali deploy pertama yang memang belum punya database).
Backup lokal harus rutin dipindahkan ke storage backup/off-server; belum ada penjadwalan otomatis.

## 6. Admin dan katalog (tanpa seeder server)

Di VPS production, setelah deploy sehat:

```bash
cd ~/weddingletter-production
docker compose exec -T -e ADMIN_EMAIL=EMAIL_ADMIN_ANDA -e BOOTSTRAP_CONFIRM=weddingletter.id api npm run production:bootstrap
```

Ganti `EMAIL_ADMIN_ANDA` dengan email pemilik, login via OTP/Google, lalu ambil admin bearer token
melalui cara publisher yang sudah digunakan di staging. Jangan paste token di chat atau Git.
Database production baru tidak berisi pelanggan, pesanan, atau undangan staging.

Di laptop, salin `deploy/production/publisher.env.example` ke `.env.publisher.production`, isi token/admin
serta kredensial TARGET R2 production. `apps/api/.env` tetap sumber database/aset lokal.
File manifest hasil ekspor boleh dipakai untuk kedua target: URL-nya portable `storage://`.

```powershell
# 1. Ekspor sumber lokal, termasuk perubahan template/aset terbaru
npm.cmd run catalog:export --workspace apps/api
# 2. Validasi manifest
npm.cmd run catalog:check --workspace apps/api
# 3. Sinkronkan dan verifikasi hash aset ke bucket production
npm.cmd run catalog:sync --workspace apps/api -- --env-file .env.publisher.production --target production --apply --confirm-production weddingletter.id
# 4. Publish metadata melalui API admin production
npm.cmd run catalog:publish --workspace apps/api -- --env-file .env.publisher.production --target production --apply --confirm-production weddingletter.id
# 5. Verifikasi ulang metadata dan objek tujuan (read-only)
npm.cmd run catalog:verify --workspace apps/api -- --env-file .env.publisher.production --target production --apply --confirm-production weddingletter.id
```

Untuk simulasi sync/publish tanpa menulis, hilangkan `--apply` dan `--confirm-production ...`.
Perintah staging lama tetap default staging. Jangan jalankan `retire-local` sebagai bagian peluncuran.
Publisher adalah upsert katalog; perubahan katalog lokal dapat menimpa pengaturan katalog tujuan,
termasuk pilihan Home. Ekspor ulang bila sumber berubah; simpan manifest rilis untuk audit.

## 7. Checklist sebelum diumumkan

- Login Google/OTP, email benar-benar diterima, akun admin terbatas ke pemilik.
- Semua thumbnail, sampul, palet, demo dan pratinjau undangan yang DIBELI membawa artwork.
- Pilih tema etalase di Admin → Template → Tampilkan di Home; katalog kosong/etalase belum dipilih bukan tanda deploy gagal.
- Upload media ke R2, penggantian foto, akses mobile dan izin kamera QR.
- Checkout, satu transaksi live terkontrol yang dilakukan pemilik, webhook valid, pesanan tidak diproses ganda.
- Publikasi, masa aktif, link tamu, RSVP, Buku Tamu, daftar tamu, check-in QR.
- Dukungan WhatsApp di Admin → Pengaturan; jangan mengandalkan env build lama untuk nomor bantuan.
- Backup off-server, kebijakan pemulihan, pemantauan disk/RAM, dan uji beban ringan.
- Dokumen harga/ketentuan, kontak, privasi, dan refund ditinjau pemilik sebelum menerima pelanggan nyata.

## Rollback rilis aplikasi

Jangan otomatis membalik migrasi atau merestore database saat pembayaran live masuk.
Catat tag sehat sebelumnya di `.previous-tag` dan pastikan image masih ada lokal/GHCR.
Setelah meninjau kompatibilitas schema, jalankan dari folder production:

```bash
bash deploy.sh "$(cat .previous-tag)"
```

Ini menjalankan rilis lama dengan database saat ini, BUKAN downgrade schema. Bila rilis lama tidak
kompatibel dengan migrasi baru, lakukan forward-fix atau pemulihan terencana yang mempertimbangkan
transaksi sejak backup. Jangan menimpa database live tanpa keputusan pemilik.
Shared edge diperbarui manual: `nginx -t` dahulu, lalu `nginx -s reload`; bukan otomatis tiap deploy.

## Referensi

- https://docs.docker.com/compose/how-tos/networking/
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
