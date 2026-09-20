import { MB } from '../config/constants.js';
import {
  PricingError,
  billableMb,
  couponDiscount,
  quoteExtension,
  quoteNewOrder,
} from './pricing.calculator.js';
import type { MediaDecl, NewOrderInput, Rates } from './pricing.calculator.js';

const rates: Rates = {
  rentalPerMbWeek: 700,
  extendPerWeek: 10_000,
  photoPack: 8_000,
  customSong: 5_000,
  flat: { RSVP_ONLINE: 10_000, DIGITAL_ENVELOPE: 15_000, CUSTOM_DOMAIN: 10_000, TRANSLATION_EN: 10_000 },
};

const base: NewOrderInput = {
  templateName: 'Basic Rustic',
  templatePrice: 20_000,
  includedWeeks: 4,
  maxPhotos: 4,
  maxVideos: 0,
  weeks: 4,
  media: [],
  addOns: [],
  rates,
};

const photo = (id: string, mb: number, role: MediaDecl['role'] = 'gallery', weeks?: number): MediaDecl => ({
  clientId: id,
  type: 'PHOTO',
  role,
  sizeBytes: mb * MB,
  weeks,
});
const video = (id: string, mb: number, weeks?: number): MediaDecl => ({ clientId: id, type: 'VIDEO', role: 'video', sizeBytes: mb * MB, weeks });

describe('sewa media ukuran x durasi (Bagian 7.1)', () => {
  it('video 100 MB 1 minggu = Rp70.000', () => {
    const q = quoteNewOrder({ ...base, includedWeeks: 1, weeks: 1, media: [video('v', 100)] });
    expect(q.mediaCharges[0]).toMatchObject({ included: false, price: 70_000 });
    expect(q.total).toBe(20_000 + 70_000);
  });

  it('video 100 MB 2 minggu = Rp140.000', () => {
    const q = quoteNewOrder({ ...base, includedWeeks: 1, weeks: 2, media: [video('v', 100)] });
    expect(q.mediaCharges[0]!.price).toBe(140_000);
    expect(q.lines.find((l) => l.code === 'MEDIA_RENTAL_WEEK')).toMatchObject({ quantity: 200, unitPrice: 700, amount: 140_000 });
  });

  it('video 200 MB 1 minggu = Rp140.000', () => {
    const q = quoteNewOrder({ ...base, includedWeeks: 1, weeks: 1, media: [video('v', 200)] });
    expect(q.mediaCharges[0]!.price).toBe(140_000);
  });

  it('ukuran dibulatkan ke atas ke MB penuh (minimal 1 MB)', () => {
    expect(billableMb(1)).toBe(1);
    expect(billableMb(MB)).toBe(1);
    expect(billableMb(MB + 1)).toBe(2);
    expect(billableMb(100 * MB)).toBe(100);
  });

  it('lama sewa per file boleh lebih pendek dari masa aktif undangan', () => {
    const q = quoteNewOrder({ ...base, weeks: 8, media: [video('v', 50, 2)] });
    expect(q.mediaCharges[0]).toMatchObject({ rentedWeeks: 2, price: 50 * 2 * 700 });
  });

  it('lama sewa file tidak boleh melebihi masa aktif undangan atau < 1', () => {
    expect(() => quoteNewOrder({ ...base, weeks: 4, media: [video('v', 50, 5)] })).toThrow(PricingError);
    expect(() => quoteNewOrder({ ...base, weeks: 4, media: [video('v', 50, 0)] })).toThrow(PricingError);
  });
});

describe('kuota tier, paket foto, dan foto besar', () => {
  it('template murni tanpa media & add-on = harga template', () => {
    const q = quoteNewOrder(base);
    expect(q.total).toBe(20_000);
    expect(q.addOnTotal).toBe(0);
    expect(q.lines).toHaveLength(1);
  });

  it('foto galeri dalam kuota gratis; foto field selalu gratis (<= 5 MB)', () => {
    const q = quoteNewOrder({
      ...base,
      media: [photo('cover', 3, 'field'), photo('g1', 2), photo('g2', 2), photo('g3', 2), photo('g4', 2)],
    });
    expect(q.total).toBe(20_000);
    expect(q.mediaCharges.every((c) => c.included)).toBe(true);
  });

  it('foto di atas kuota dihitung per paket 5 foto (dibulatkan ke atas)', () => {
    const gallery = Array.from({ length: 4 + 6 }, (_, i) => photo(`g${i}`, 1)); // 6 foto kelebihan -> 2 paket
    const q = quoteNewOrder({ ...base, media: gallery });
    const pack = q.lines.find((l) => l.code === 'PHOTO_PACK_5')!;
    expect(pack).toMatchObject({ quantity: 2, unitPrice: 8_000, amount: 16_000 });
    expect(q.total).toBe(20_000 + 16_000);
  });

  it('foto di atas batas 5 MB tidak memakai kuota, dihitung sewa ukuran x durasi', () => {
    const q = quoteNewOrder({ ...base, weeks: 4, media: [photo('big', 12)] });
    expect(q.mediaCharges[0]).toMatchObject({ included: false, price: 12 * 4 * 700 });
    // foto besar tidak menghabiskan kuota 4 foto galeri
    const q2 = quoteNewOrder({ ...base, media: [photo('big', 12), photo('a', 1), photo('b', 1), photo('c', 1), photo('d', 1)] });
    expect(q2.lines.some((l) => l.code === 'PHOTO_PACK_5')).toBe(false);
  });

  it('video dalam kuota tier (maxVideos) & <= 20 MB gratis, sisanya sewa', () => {
    const q = quoteNewOrder({ ...base, maxVideos: 1, media: [video('a', 15), video('b', 15)] });
    expect(q.mediaCharges[0]).toMatchObject({ included: true, price: 0 });
    expect(q.mediaCharges[1]).toMatchObject({ included: false, price: 15 * 4 * 700 });
  });

  it('video > 20 MB tetap sewa meski masih ada kuota video', () => {
    const q = quoteNewOrder({ ...base, maxVideos: 1, media: [video('a', 25)] });
    expect(q.mediaCharges[0]!.included).toBe(false);
  });

  it('menolak file di atas batas keras', () => {
    expect(() => quoteNewOrder({ ...base, media: [photo('x', 31)] })).toThrow(/Foto maksimal 30 MB/);
    expect(() => quoteNewOrder({ ...base, media: [video('x', 501)] })).toThrow(/Video maksimal 500 MB/);
  });
});

describe('lagu custom, add-on flat, masa aktif', () => {
  const song: MediaDecl = { clientId: 's', type: 'SONG', role: 'song', sizeBytes: 4 * MB };

  it('lagu custom = add-on flat Rp5.000, maksimal 1 dan <= 8 MB', () => {
    const q = quoteNewOrder({ ...base, media: [song] });
    expect(q.lines.find((l) => l.code === 'CUSTOM_SONG')).toMatchObject({ amount: 5_000 });
    expect(() => quoteNewOrder({ ...base, media: [song, { ...song, clientId: 's2' }] })).toThrow(/Maksimal 1 lagu/);
    expect(() => quoteNewOrder({ ...base, media: [{ ...song, sizeBytes: 9 * MB }] })).toThrow(/Lagu maksimal 8 MB/);
  });

  it('add-on flat dijumlahkan; duplikat dihitung sekali', () => {
    const q = quoteNewOrder({ ...base, addOns: ['RSVP_ONLINE', 'DIGITAL_ENVELOPE', 'RSVP_ONLINE'] });
    expect(q.addOnTotal).toBe(25_000);
    expect(q.total).toBe(45_000);
  });

  it('minggu tambahan di atas bawaan template x Rp10.000', () => {
    const q = quoteNewOrder({ ...base, weeks: 10 });
    expect(q.extraWeeks).toBe(6);
    expect(q.lines.find((l) => l.code === 'EXTEND_ACTIVE_WEEK')).toMatchObject({ quantity: 6, amount: 60_000 });
    expect(q.total).toBe(80_000);
  });

  it('masa aktif di luar rentang ditolak', () => {
    expect(() => quoteNewOrder({ ...base, weeks: 3 })).toThrow(PricingError);
    expect(() => quoteNewOrder({ ...base, weeks: 53 })).toThrow(PricingError);
    expect(() => quoteNewOrder({ ...base, weeks: 4.5 })).toThrow(PricingError);
  });

  it('skenario gabungan konsisten: total = jumlah semua baris', () => {
    const q = quoteNewOrder({
      ...base,
      templateName: 'Premium Elegant',
      templatePrice: 150_000,
      maxPhotos: 20,
      maxVideos: 1,
      weeks: 8,
      addOns: ['TRANSLATION_EN'],
      media: [photo('cover', 2, 'field'), video('v1', 10), video('v2', 60), song],
    });
    const rental = 60 * 8 * 700;
    expect(q.total).toBe(150_000 + 4 * 10_000 + rental + 5_000 + 10_000);
    expect(q.total).toBe(q.lines.reduce((s, l) => s + l.amount, 0));
  });
});

describe('perpanjangan masa aktif', () => {
  it('hanya minggu x tarif jika tidak ada media sewa', () => {
    const q = quoteExtension({ weeks: 3, rentalMedia: [], rates });
    expect(q.total).toBe(30_000);
  });

  it('memperpanjang media sewa dengan rumus ukuran x minggu', () => {
    const q = quoteExtension({ weeks: 2, rentalMedia: [{ id: 'm1', sizeBytes: 100 * MB }], rates });
    expect(q.mediaCharges).toEqual([{ id: 'm1', price: 140_000 }]);
    expect(q.total).toBe(20_000 + 140_000);
  });

  it('menolak minggu tidak valid', () => {
    expect(() => quoteExtension({ weeks: 0, rentalMedia: [], rates })).toThrow(PricingError);
  });
});

describe('kupon', () => {
  it('persen dibulatkan ke bawah', () => {
    expect(couponDiscount(75_001, { type: 'PERCENT', value: 20 })).toBe(15_000);
  });
  it('nominal tidak melebihi total', () => {
    expect(couponDiscount(20_000, { type: 'NOMINAL', value: 50_000 })).toBe(20_000);
  });
  it('100% membuat total 0, tidak pernah negatif', () => {
    expect(couponDiscount(20_000, { type: 'PERCENT', value: 100 })).toBe(20_000);
    expect(couponDiscount(0, { type: 'NOMINAL', value: 5_000 })).toBe(0);
  });
});
