import { ADDON, LIMITS, MB, PHOTO_PACK_SIZE } from '../config/constants.js';
import type { SelectableAddOn } from '../config/constants.js';

// Kalkulator harga murni (tanpa DB) sesuai dokumen rancangan Bagian 6, 7 dan 7.1:
//   total = harga template
//         + minggu tambahan x tarif perpanjangan
//         + paket foto tambahan
//         + SUM(ukuran_MB x minggu x tarif sewa)   <- media besar / di luar kuota
//         + add-on flat (lagu custom, RSVP, amplop digital, slug custom, terjemahan)
//         - kupon

export class PricingError extends Error {}

export type MediaType = 'PHOTO' | 'VIDEO' | 'SONG';
// Posisi media di undangan: foto di field gambar, foto galeri, video, atau lagu custom.
export type MediaRole = 'field' | 'gallery' | 'video' | 'song';

export interface MediaDecl {
  clientId: string;
  type: MediaType;
  role: MediaRole;
  sizeBytes: number;
  // Lama sewa khusus file ini (1..weeks). Default: sama dengan masa aktif undangan.
  weeks?: number;
}

export interface Rates {
  rentalPerMbWeek: number;
  extendPerWeek: number;
  photoPack: number;
  customSong: number;
  flat: Record<SelectableAddOn, number>;
}

export interface QuoteLine {
  code: string;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface MediaCharge {
  clientId: string;
  included: boolean;
  rentedWeeks: number;
  billableMb: number;
  price: number;
  reason: 'field' | 'quota' | 'pack' | 'rental' | 'song';
}

export interface Quote {
  lines: QuoteLine[];
  templatePrice: number;
  addOnTotal: number;
  total: number;
  weeks: number;
  extraWeeks: number;
  mediaCharges: MediaCharge[];
}

export interface NewOrderInput {
  templateName: string;
  templatePrice: number;
  includedWeeks: number;
  maxPhotos: number;
  maxVideos: number;
  weeks: number;
  media: MediaDecl[];
  addOns: SelectableAddOn[];
  rates: Rates;
}

export function billableMb(sizeBytes: number) {
  return Math.max(1, Math.ceil(sizeBytes / MB));
}

const line = (code: string, label: string, quantity: number, unitPrice: number, amount = quantity * unitPrice): QuoteLine => ({
  code,
  label,
  quantity,
  unitPrice,
  amount,
});

const FLAT_LABELS: Record<SelectableAddOn, string> = {
  RSVP_ONLINE: 'RSVP online',
  DIGITAL_ENVELOPE: 'Amplop digital',
  CUSTOM_DOMAIN: 'Link/slug custom',
  TRANSLATION_EN: 'Terjemahan Indonesia/Inggris',
};

export function quoteNewOrder(input: NewOrderInput): Quote {
  const { rates, weeks } = input;
  if (!Number.isInteger(weeks) || weeks < input.includedWeeks || weeks > LIMITS.maxWeeks) {
    throw new PricingError(`Masa aktif harus ${input.includedWeeks}–${LIMITS.maxWeeks} minggu`);
  }

  const charges: MediaCharge[] = [];
  let galleryQuotaUsed = 0;
  let videoQuotaUsed = 0;
  let extraSmallPhotos = 0;
  let customSongs = 0;

  for (const m of input.media) {
    const mb = billableMb(m.sizeBytes);
    const rentedWeeks = m.weeks ?? weeks;
    if (!Number.isInteger(rentedWeeks) || rentedWeeks < 1 || rentedWeeks > weeks) {
      throw new PricingError(`Lama sewa file harus 1–${weeks} minggu`);
    }
    const rental = (): MediaCharge => ({
      clientId: m.clientId,
      included: false,
      rentedWeeks,
      billableMb: mb,
      price: mb * rentedWeeks * rates.rentalPerMbWeek,
      reason: 'rental',
    });
    const free = (reason: MediaCharge['reason']): MediaCharge => ({
      clientId: m.clientId,
      included: true,
      rentedWeeks: weeks,
      billableMb: mb,
      price: 0,
      reason,
    });

    if (m.role === 'song') {
      if (m.type !== 'SONG') throw new PricingError('Lagu harus berupa file audio');
      if (m.sizeBytes > LIMITS.maxSongMb * MB) throw new PricingError(`Lagu maksimal ${LIMITS.maxSongMb} MB`);
      if (++customSongs > 1) throw new PricingError('Maksimal 1 lagu custom');
      charges.push(free('song'));
    } else if (m.role === 'video') {
      if (m.type !== 'VIDEO') throw new PricingError('Field video harus berisi file video');
      if (m.sizeBytes > LIMITS.maxVideoMb * MB) throw new PricingError(`Video maksimal ${LIMITS.maxVideoMb} MB`);
      if (videoQuotaUsed < input.maxVideos && m.sizeBytes <= LIMITS.includedVideoMb * MB) {
        videoQuotaUsed++;
        charges.push(free('quota'));
      } else charges.push(rental());
    } else {
      if (m.type !== 'PHOTO') throw new PricingError('Field foto harus berisi file gambar');
      if (m.sizeBytes > LIMITS.maxPhotoMb * MB) throw new PricingError(`Foto maksimal ${LIMITS.maxPhotoMb} MB`);
      const small = m.sizeBytes <= LIMITS.includedPhotoMb * MB;
      if (!small) charges.push(rental());
      else if (m.role === 'field') charges.push(free('field'));
      else if (galleryQuotaUsed < input.maxPhotos) {
        galleryQuotaUsed++;
        charges.push(free('quota'));
      } else {
        extraSmallPhotos++;
        charges.push(free('pack')); // biayanya lewat paket foto, bukan per file
      }
    }
  }

  const extraWeeks = weeks - input.includedWeeks;
  const packs = Math.ceil(extraSmallPhotos / PHOTO_PACK_SIZE);
  const rentalCharges = charges.filter((c) => !c.included);
  const rentalMbWeeks = rentalCharges.reduce((sum, c) => sum + c.billableMb * c.rentedWeeks, 0);
  const rentalAmount = rentalCharges.reduce((sum, c) => sum + c.price, 0);

  const lines: QuoteLine[] = [line('TEMPLATE', `Template ${input.templateName}`, 1, input.templatePrice)];
  if (extraWeeks > 0) lines.push(line(ADDON.EXTEND_ACTIVE_WEEK, 'Masa aktif tambahan (minggu)', extraWeeks, rates.extendPerWeek));
  if (packs > 0) lines.push(line(ADDON.PHOTO_PACK_5, `Paket ${PHOTO_PACK_SIZE} foto tambahan`, packs, rates.photoPack));
  if (rentalMbWeeks > 0) lines.push(line(ADDON.MEDIA_RENTAL_WEEK, 'Sewa media besar (MB x minggu)', rentalMbWeeks, rates.rentalPerMbWeek, rentalAmount));
  if (customSongs > 0) lines.push(line(ADDON.CUSTOM_SONG, 'Lagu custom', 1, rates.customSong));
  for (const code of new Set(input.addOns)) lines.push(line(code, FLAT_LABELS[code], 1, rates.flat[code]));

  const templatePrice = input.templatePrice;
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, templatePrice, addOnTotal: total - templatePrice, total, weeks, extraWeeks, mediaCharges: charges };
}

export interface ExtensionInput {
  weeks: number;
  // Media milik undangan yang kena tarif sewa (included = false).
  rentalMedia: { id: string; sizeBytes: number }[];
  rates: Pick<Rates, 'rentalPerMbWeek' | 'extendPerWeek'>;
}

export interface ExtensionQuote {
  lines: QuoteLine[];
  total: number;
  weeks: number;
  mediaCharges: { id: string; price: number }[];
}

export function quoteExtension(input: ExtensionInput): ExtensionQuote {
  const { weeks, rates } = input;
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > LIMITS.maxWeeks) {
    throw new PricingError(`Perpanjangan harus 1–${LIMITS.maxWeeks} minggu`);
  }
  const mediaCharges = input.rentalMedia.map((m) => ({ id: m.id, price: billableMb(m.sizeBytes) * weeks * rates.rentalPerMbWeek }));
  const rentalMbWeeks = input.rentalMedia.reduce((sum, m) => sum + billableMb(m.sizeBytes) * weeks, 0);
  const lines: QuoteLine[] = [line(ADDON.EXTEND_ACTIVE_WEEK, 'Perpanjangan masa aktif (minggu)', weeks, rates.extendPerWeek)];
  if (rentalMbWeeks > 0) {
    lines.push(
      line(ADDON.MEDIA_RENTAL_WEEK, 'Perpanjangan sewa media besar (MB x minggu)', rentalMbWeeks, rates.rentalPerMbWeek, mediaCharges.reduce((s, c) => s + c.price, 0)),
    );
  }
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), weeks, mediaCharges };
}

export interface CouponRule {
  type: 'PERCENT' | 'NOMINAL';
  value: number;
}

// Potongan tidak pernah melebihi total (tidak ada total negatif).
export function couponDiscount(amount: number, coupon: CouponRule): number {
  const raw = coupon.type === 'PERCENT' ? Math.floor((amount * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, amount));
}
