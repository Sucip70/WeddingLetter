import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { parseBody } from '../auth/auth.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { orderInputSchema } from './pricing.dto.js';
import { PricingService } from './pricing.service.js';
import type { PreparedNewOrder } from './pricing.service.js';

export function quoteResponse(p: PreparedNewOrder) {
  return {
    weeks: p.weeks,
    includedWeeks: p.template.includedWeeks,
    lines: p.quote.lines,
    subtotal: p.quote.total,
    discount: p.discount,
    total: p.total,
    coupon: p.coupon,
    media: p.media.map((m) => m.charge),
  };
}

@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricing: PricingService,
    private readonly prisma: PrismaService,
  ) {}

  // Kalkulator harga live di editor. Terbuka untuk anonim; tidak menyimpan apa pun.
  @Post('quote')
  @HttpCode(200)
  async quote(@Body() body: unknown) {
    const prepared = await this.pricing.prepareNewOrder(parseBody(orderInputSchema, body), { lenient: true });
    return quoteResponse(prepared);
  }

  // Daftar harga add-on yang transparan untuk halaman harga & editor.
  @Get('add-ons')
  async addOns() {
    return this.prisma.addOn.findMany({
      select: { code: true, name: true, type: true, price: true, unit: true },
      orderBy: { price: 'asc' },
    });
  }
}
