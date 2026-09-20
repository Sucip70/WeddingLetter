import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { orderInputSchema } from '../pricing/pricing.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Checkout: membuat pesanan (status PENDING) + draft undangan + slot upload untuk tiap file.
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.orders.createNew(user.id, parseBody(orderInputSchema, body));
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.listMine(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.getMine(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.cancel(user.id, id);
  }
}
