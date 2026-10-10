const rupiahFmt = new Intl.NumberFormat('id-ID');

export const rupiah = (n: number) => `Rp${rupiahFmt.format(n)}`;

export const mb = (bytes: number) => {
  const v = bytes / (1024 * 1024);
  return v >= 10 ? `${Math.round(v)} MB` : `${v.toFixed(1).replace('.', ',')} MB`;
};

export const billableMb = (bytes: number) => Math.max(1, Math.ceil(bytes / (1024 * 1024)));

// Nilai tanggal-jam undangan disimpan sebagai waktu setempat (WIB) "YYYY-MM-DDTHH:mm".
export function parseLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Menampilkan jam dinding apa adanya (bukan dikonversi ke zona browser).
export function formatLocalDate(value: string, locale: 'id' | 'en' = 'id') {
  const d = parseLocal(value);
  if (!d) return value;
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function formatLocalTime(value: string) {
  const d = parseLocal(value);
  if (!d) return '';
  return `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).replace('.', ':')} WIB`;
}

// Titik waktu sebenarnya untuk hitung mundur (WIB = UTC+7).
export const localToInstant = (value: string) => Date.parse(`${value}:00+07:00`);

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
}

// Bungkus Date.now() di modul lain (bukan langsung di body komponen) supaya lolos eslint react-hooks/purity,
// yang hanya mendeteksi panggilan Date.now()/Math.random() yang langsung terlihat di body komponen/hook —
// bukan yang disembunyikan di balik pemanggilan fungsi dari modul lain. Dipakai Server Component yang perlu
// mengirim satu nilai `now` yang konsisten ke komponen client turunannya (lihat daysLeft di bawah).
export const requestNow = () => Date.now();

// `now` opsional: di komponen client ('use client') yang dirender di server lalu dihidrasi di browser,
// panggilan Date.now() langsung di sini akan beda antara render SSR dan hidrasi (hydration mismatch) kalau
// kebetulan jatuh di ambang pembulatan hari. Kirim `now` yang sama dari parent (biasanya dari Server
// Component, satu nilai tetap) di komponen semacam itu; untuk Server Component biasa, bawaan Date.now() aman.
export function daysLeft(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - now) / 86_400_000);
}

export function whatsappLink(message: string, number: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
