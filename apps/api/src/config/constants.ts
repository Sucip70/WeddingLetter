// Aturan bisnis yang sudah diputuskan (lihat dokumen rancangan Bagian 6, 7, 7.1, 11).
// Harga (tier, add-on, tarif sewa) TIDAK di sini: itu master data di DB yang diatur admin.

export const MB = 1024 * 1024;

// Kode add-on di tabel `add_ons` yang punya arti khusus di kalkulator.
export const ADDON = {
  MEDIA_RENTAL_WEEK: 'MEDIA_RENTAL_WEEK', // Rp per MB per minggu (sewa media besar)
  EXTEND_ACTIVE_WEEK: 'EXTEND_ACTIVE_WEEK', // Rp per minggu masa aktif tambahan
  PHOTO_PACK_5: 'PHOTO_PACK_5', // paket 5 foto tambahan (di atas kuota tier)
  CUSTOM_SONG: 'CUSTOM_SONG',
  RSVP_ONLINE: 'RSVP_ONLINE',
  DIGITAL_ENVELOPE: 'DIGITAL_ENVELOPE',
  CUSTOM_DOMAIN: 'CUSTOM_DOMAIN',
  TRANSLATION_EN: 'TRANSLATION_EN',
} as const;

// Add-on flat yang dipilih user (satu kali, tanpa jumlah).
export const USER_SELECTABLE_ADDONS = [
  ADDON.RSVP_ONLINE,
  ADDON.DIGITAL_ENVELOPE,
  ADDON.CUSTOM_DOMAIN,
  ADDON.TRANSLATION_EN,
] as const;
export type SelectableAddOn = (typeof USER_SELECTABLE_ADDONS)[number];

export const PHOTO_PACK_SIZE = 5;

// Batas ukuran per file. Foto/video di bawah batas "termasuk" bisa gratis (kuota tier / paket foto);
// di atasnya dihitung sewa ukuran x durasi.
export const LIMITS = {
  includedPhotoMb: 5,
  includedVideoMb: 20,
  maxPhotoMb: 30,
  maxVideoMb: 500,
  maxSongMb: 8,
  maxWeeks: 52,
  maxMediaPerInvitation: 60,
} as const;

export const ALLOWED_CONTENT_TYPES: Record<'PHOTO' | 'VIDEO' | 'SONG', readonly string[]> = {
  PHOTO: ['image/jpeg', 'image/png', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm'],
  SONG: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'],
};

export const GRACE_DAYS = 30; // masa tenggang sebelum data dihapus permanen
export const REFUND_WINDOW_HOURS = 48; // refund penuh hanya sebelum publish & dalam jendela ini
export const PENDING_ORDER_TTL_HOURS = 24;
export const REMINDER_DAYS_BEFORE_EXPIRY = 3;

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
