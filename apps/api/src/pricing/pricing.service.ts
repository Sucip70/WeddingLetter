import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ADDON, ALLOWED_CONTENT_TYPES } from '../config/constants.js';
import type { SelectableAddOn } from '../config/constants.js';
import type { AddOn, Invitation, MediaFile, Template } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { effectiveSections, layoutIncludes, normalizeLayout, validateInvitationData } from '../templates/layout.js';
import type { InvitationData, InvitationFeatures, SectionDef, TemplateLayout } from '../templates/layout.js';
import { PricingError, couponDiscount, quoteExtension, quoteNewOrder } from './pricing.calculator.js';
import type { ExtensionQuote, MediaCharge, MediaDecl, Quote, Rates } from './pricing.calculator.js';
import type { ExtensionOrderInput, OrderInput } from './pricing.dto.js';

export type CouponCheck =
  | { code: string; valid: true; couponId: string; discount: number }
  | { code: string; valid: false; reason: string };

export interface PreparedMedia {
  clientId: string;
  type: 'PHOTO' | 'VIDEO' | 'SONG';
  fileName: string;
  contentType: string;
  sizeBytes: number;
  charge: MediaCharge;
}

export interface PreparedNewOrder {
  template: Template;
  layout: TemplateLayout;
  sections: SectionDef[];
  features: InvitationFeatures;
  data: InvitationData;
  customSlug?: string;
  weeks: number;
  quote: Quote;
  media: PreparedMedia[];
  coupon: CouponCheck | null;
  discount: number;
  total: number;
  addOnRows: Map<string, AddOn>;
}

export interface PreparedExtension {
  invitation: Invitation & { mediaFiles: MediaFile[] };
  template: Template;
  weeks: number;
  quote: ExtensionQuote;
  coupon: CouponCheck | null;
  discount: number;
  total: number;
  addOnRows: Map<string, AddOn>;
}

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async loadAddOns() {
    const rows = await this.prisma.addOn.findMany();
    return new Map(rows.map((r) => [r.code, r]));
  }

  ratesFrom(rows: Map<string, AddOn>): Rates {
    const price = (code: string) => {
      const row = rows.get(code);
      if (!row) throw new ServiceUnavailableException(`Harga add-on ${code} belum diatur`);
      return row.price;
    };
    return {
      rentalPerMbWeek: price(ADDON.MEDIA_RENTAL_WEEK),
      extendPerWeek: price(ADDON.EXTEND_ACTIVE_WEEK),
      photoPack: price(ADDON.PHOTO_PACK_5),
      customSong: price(ADDON.CUSTOM_SONG),
      flat: {
        RSVP_ONLINE: price(ADDON.RSVP_ONLINE),
        DIGITAL_ENVELOPE: price(ADDON.DIGITAL_ENVELOPE),
        CUSTOM_DOMAIN: price(ADDON.CUSTOM_DOMAIN),
        TRANSLATION_EN: price(ADDON.TRANSLATION_EN),
      },
    };
  }

  async checkCoupon(rawCode: string, amount: number): Promise<CouponCheck> {
    const code = rawCode.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    const now = new Date();
    if (!coupon || coupon.status !== 'ACTIVE') return { code, valid: false, reason: 'Kode kupon tidak ditemukan' };
    if (coupon.startsAt && coupon.startsAt > now) return { code, valid: false, reason: 'Kupon belum berlaku' };
    if (coupon.endsAt && coupon.endsAt < now) return { code, valid: false, reason: 'Kupon sudah kedaluwarsa' };
    if (coupon.quota !== null && coupon.usedCount >= coupon.quota) return { code, valid: false, reason: 'Kuota kupon sudah habis' };
    return { code, valid: true, couponId: coupon.id, discount: couponDiscount(amount, coupon) };
  }

  private async applyCoupon(couponCode: string | undefined, amount: number, lenient: boolean) {
    if (!couponCode) return { coupon: null, discount: 0 };
    const coupon = await this.checkCoupon(couponCode, amount);
    if (!coupon.valid) {
      if (lenient) return { coupon, discount: 0 };
      throw new BadRequestException(coupon.reason);
    }
    return { coupon, discount: coupon.discount };
  }

  // Menyiapkan (dan memvalidasi) seluruh perhitungan pembelian template baru. `lenient` = mode kalkulator
  // saat user masih mengisi form: field wajib yang kosong / rujukan file yang belum lengkap diabaikan.
  async prepareNewOrder(input: OrderInput, options: { lenient: boolean }): Promise<PreparedNewOrder> {
    const { lenient } = options;
    const template = await this.prisma.template.findFirst({ where: { id: input.templateId, status: 'PUBLISHED' } });
    if (!template) throw new NotFoundException('Template tidak ditemukan');
    const layout = normalizeLayout(template.layoutSchema, template.category);

    const addOns = [...new Set(input.addOns)] as SelectableAddOn[];
    if (addOns.includes('RSVP_ONLINE') && layoutIncludes(layout, 'rsvp')) throw new BadRequestException('RSVP sudah termasuk di template ini');
    if (addOns.includes('DIGITAL_ENVELOPE') && layoutIncludes(layout, 'amplop_digital')) {
      throw new BadRequestException('Amplop digital sudah termasuk di template ini');
    }
    if (input.customSlug && !addOns.includes('CUSTOM_DOMAIN')) {
      throw new BadRequestException('Link custom membutuhkan add-on "Link/slug custom"');
    }
    if (addOns.includes('CUSTOM_DOMAIN') && !input.customSlug && !lenient) {
      throw new BadRequestException('Isi link custom yang diinginkan');
    }

    const features: InvitationFeatures = {
      rsvp: addOns.includes('RSVP_ONLINE'),
      envelope: addOns.includes('DIGITAL_ENVELOPE'),
      english: addOns.includes('TRANSLATION_EN'),
    };
    const sections = effectiveSections(layout, features);

    const declared = new Map<string, OrderInput['media'][number]>();
    for (const m of input.media) {
      if (declared.has(m.clientId)) throw new BadRequestException('clientId file duplikat');
      if (!ALLOWED_CONTENT_TYPES[m.type].includes(m.contentType)) {
        throw new BadRequestException(`Tipe file ${m.contentType} tidak didukung untuk ${m.type.toLowerCase()}`);
      }
      declared.set(m.clientId, m);
    }

    const validated = validateInvitationData(sections, layout, input.data, (raw) => raw, { lenient });
    const refs = validated.mediaRefs;
    const fieldPhotos = refs.photos.filter((id) => !refs.galleryPhotos.includes(id));
    const ordered: { id: string; role: MediaDecl['role'] }[] = [
      ...fieldPhotos.map((id) => ({ id, role: 'field' as const })),
      ...refs.galleryPhotos.map((id) => ({ id, role: 'gallery' as const })),
      ...refs.videos.map((id) => ({ id, role: 'video' as const })),
      ...refs.songs.map((id) => ({ id, role: 'song' as const })),
    ];

    const ids = ordered.map((o) => o.id);
    if (!lenient) {
      if (ids.some((id) => !declared.has(id))) throw new BadRequestException('Undangan merujuk file yang tidak dideklarasikan');
      if (new Set(ids).size !== ids.length) throw new BadRequestException('Satu file hanya boleh dipakai di satu tempat');
      const unused = [...declared.values()].find((m) => !ids.includes(m.clientId));
      if (unused) throw new BadRequestException(`File "${unused.fileName}" tidak dipakai di undangan`);
    }

    const decls: MediaDecl[] = ordered
      .filter((o) => declared.has(o.id))
      .map((o) => {
        const m = declared.get(o.id)!;
        return { clientId: m.clientId, type: m.type, role: o.role, sizeBytes: m.sizeBytes, weeks: m.weeks };
      });

    const addOnRows = await this.loadAddOns();
    let quote: Quote;
    try {
      quote = quoteNewOrder({
        templateName: template.name,
        templatePrice: template.price,
        includedWeeks: template.includedWeeks,
        maxPhotos: layout.galeri.maxPhotos,
        maxVideos: layout.galeri.maxVideos,
        weeks: input.weeks,
        media: decls,
        addOns,
        rates: this.ratesFrom(addOnRows),
      });
    } catch (error) {
      if (error instanceof PricingError) throw new BadRequestException(error.message);
      throw error;
    }

    const { coupon, discount } = await this.applyCoupon(input.couponCode, quote.total, lenient);
    const media: PreparedMedia[] = quote.mediaCharges.map((charge) => {
      const m = declared.get(charge.clientId)!;
      return { clientId: m.clientId, type: m.type, fileName: m.fileName, contentType: m.contentType, sizeBytes: m.sizeBytes, charge };
    });

    return {
      template,
      layout,
      sections,
      features,
      data: validated.data,
      customSlug: input.customSlug,
      weeks: input.weeks,
      quote,
      media,
      coupon,
      discount,
      total: quote.total - discount,
      addOnRows,
    };
  }

  async prepareExtension(invitationId: string, userId: string, input: ExtensionOrderInput): Promise<PreparedExtension> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, order: { userId } },
      include: { mediaFiles: true, template: true },
    });
    if (!invitation || invitation.status === 'DELETED') throw new NotFoundException('Undangan tidak ditemukan');
    if (!invitation.publishedAt) throw new BadRequestException('Undangan belum dipublikasikan, belum perlu diperpanjang');

    const rentalMedia = invitation.mediaFiles.filter(
      (m) => !m.included && ['ACTIVE', 'PAUSED', 'EXPIRED_GRACE'].includes(m.status),
    );
    const addOnRows = await this.loadAddOns();
    let quote: ExtensionQuote;
    try {
      quote = quoteExtension({
        weeks: input.weeks,
        rentalMedia: rentalMedia.map((m) => ({ id: m.id, sizeBytes: m.sizeBytes })),
        rates: this.ratesFrom(addOnRows),
      });
    } catch (error) {
      if (error instanceof PricingError) throw new BadRequestException(error.message);
      throw error;
    }
    const { coupon, discount } = await this.applyCoupon(input.couponCode, quote.total, false);
    const { template, ...rest } = invitation;
    return { invitation: rest, template, weeks: input.weeks, quote, coupon, discount, total: quote.total - discount, addOnRows };
  }
}
