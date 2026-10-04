# Staging — `staging.weddingletter.id`

Satu VPS (Docker Compose: Postgres + API + Web + Nginx) di belakang Cloudflare. Image dibangun GitHub Actions
(`.github/workflows/staging.yml`) dan disimpan di GHCR; VPS hanya menarik image, tidak membangun.

```
push ke branch staging ─► Actions: tes ─► build image api & web ─► GHCR ─► ssh VPS: compose pull + up
tamu ─► Cloudflare (SSL) ─► Nginx :443 (basic auth, noindex) ─► web:3000 ─► api:4000 ─► postgres
Midtrans ─► /payments/midtrans/notification (tanpa basic auth) ─► api:4000
browser ─► R2 (upload presigned & media publik, langsung)
```

Staging berjalan dengan `NODE_ENV=production`: pembayaran memakai **Midtrans Sandbox** (pembayaran dev palsu
mati), email OTP lewat Resend sungguhan, file di bucket R2 khusus staging.

## Sekali saja: persiapan

### 1. Cloudflare

1. DNS: record `A` `staging` → IP VPS, **Proxied** (awan oranye).
2. SSL/TLS → Overview: mode **Full (strict)**.
3. SSL/TLS → Origin Server → **Create Certificate** (hostname `staging.weddingletter.id`, 15 tahun).
   Simpan hasilnya di VPS sebagai `certs/origin.pem` (certificate) dan `certs/origin.key` (private key).

### 2. Cloudflare R2

1. Buat bucket `weddingletter-staging`.
2. Akses publik: aktifkan `r2.dev` atau hubungkan custom domain (mis. `media-staging.weddingletter.id`).
   Isi URL-nya ke `R2_PUBLIC_URL`.
3. Settings → CORS policy (browser mengunggah langsung ke R2):
   ```json
   [{ "AllowedOrigins": ["https://staging.weddingletter.id"], "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
4. Manage R2 API Tokens → token **Object Read & Write** hanya untuk bucket ini → `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`; Account ID → `R2_ACCOUNT_ID`.

### 3. Layanan lain

- **Midtrans Sandbox** (dashboard.sandbox.midtrans.com): Server Key → `MIDTRANS_SERVER_KEY`.
  Settings → Payment → Notification URL: `https://staging.weddingletter.id/payments/midtrans/notification`.
- **Resend**: verifikasi domain `weddingletter.id`, buat API key → `RESEND_API_KEY`, sesuaikan `MAIL_FROM`.
- **Google login** (opsional): tambahkan `https://staging.weddingletter.id` ke Authorized JavaScript origins.

### 4. VPS (Ubuntu 22.04/24.04, 2 vCPU / 4 GB cukup)

1. Pasang Docker Engine + plugin Compose (ikuti docs.docker.com/engine/install/ubuntu).
2. Buat user deploy yang boleh menjalankan Docker:
   ```bash
   sudo adduser --disabled-password deploy && sudo usermod -aG docker deploy
   ```
3. Firewall: buka 22, 80, 443 (`sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw enable`).
4. Sebagai user `deploy`, siapkan folder (berkas konfigurasi lain dikirim otomatis oleh workflow):
   ```bash
   mkdir -p ~/weddingletter-staging/certs && cd ~/weddingletter-staging
   # salin isi deploy/staging/.env.example -> .env dan api.env.example -> api.env, lalu isi
   nano .env && nano api.env && chmod 600 .env api.env
   # sertifikat dari langkah Cloudflare #3
   nano certs/origin.pem && nano certs/origin.key && chmod 600 certs/origin.key
   # akun basic auth untuk penguji (ulangi dengan >> untuk menambah akun)
   docker run --rm httpd:2.4-alpine htpasswd -nbB penguji 'KATA-SANDI' > htpasswd
   ```
5. Izinkan VPS menarik image privat dari GHCR: buat GitHub Personal Access Token (classic) dengan scope
   `read:packages` saja, lalu `docker login ghcr.io -u Sucip70` (tempel token sebagai password).

### 5. GitHub

1. Settings → Environments → **New environment** `staging`.
2. Environment secrets:
   | Nama | Isi |
   |---|---|
   | `STAGING_SSH_HOST` | IP VPS |
   | `STAGING_SSH_USER` | `deploy` |
   | `STAGING_SSH_KEY` | private key SSH khusus deploy (`ssh-keygen -t ed25519 -f wl-staging -N ""`; public key-nya ke `~deploy/.ssh/authorized_keys`) |
   | `STAGING_SSH_KNOWN_HOSTS` | hasil `ssh-keyscan -t ed25519 <IP VPS>` |
3. Environment variables (ditanam ke image web saat build):
   `NEXT_PUBLIC_APP_URL=https://staging.weddingletter.id`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (opsional),
   `NEXT_PUBLIC_SUPPORT_WHATSAPP` (opsional, format `62812…`).

## Deploy

```bash
git push origin master:staging     # atau: Actions → Staging → Run workflow
```

Deploy pertama: setelah workflow hijau, isi data awal (template, desain, foto demo) dan akun admin pertama:

```bash
cd ~/weddingletter-staging
docker compose run --rm -e ADMIN_EMAIL=email-anda@contoh.com api npm run prisma:seed
```

Lalu buka `https://staging.weddingletter.id` (login basic auth dulu), masuk dengan email admin tadi (OTP via Resend),
dan tambahkan lagu di Admin → Musik.

## Operasional

```bash
cd ~/weddingletter-staging
docker compose ps                         # status & health
docker compose logs -f --tail=100 api     # log API (juga: web, nginx)
TAG=staging-<sha-commit> docker compose up -d api web   # rollback ke build tertentu
docker compose exec postgres pg_dump -U weddingletter weddingletter | gzip > backup-$(date +%F).sql.gz
```

- Migrasi database berjalan otomatis setiap container API start (`prisma migrate deploy`).
- Rentang IP Cloudflare di `nginx/cloudflare-realip.conf` jarang berubah; cek cloudflare.com/ips bila IP tamu
  di log terlihat sebagai IP Cloudflare.
- Uji pembayaran: di halaman Snap sandbox pakai kartu/VA uji dari dokumentasi Midtrans (docs.midtrans.com).
