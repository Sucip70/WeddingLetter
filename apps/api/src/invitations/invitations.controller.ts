import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { parseBody } from '../auth/auth.dto.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { OrdersService } from '../orders/orders.service.js';
import { extensionInputSchema } from '../pricing/pricing.dto.js';
import { InvitationsService, rsvpSchema } from './invitations.service.js';

const updateSchema = z.object({ data: z.record(z.string(), z.unknown()) });

@Controller('invitations')
@UseGuards(AuthGuard)
export class InvitationsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly orders: OrdersService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.invitations.listMine(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invitations.getMine(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.invitations.updateData(user.id, id, parseBody(updateSchema, body).data);
  }

  @Get(':id/preview')
  preview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invitations.previewView(user.id, id);
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invitations.publish(user.id, id);
  }

  @Get(':id/rsvp')
  rsvp(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invitations.guests(user.id, id);
  }

  @Post(':id/extension-quote')
  @HttpCode(200)
  extensionQuote(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.invitations.extensionQuote(user.id, id, parseBody(extensionInputSchema, body));
  }

  // Perpanjangan = pesanan baru (kind EXTENSION); dibayar lewat POST /payments/:orderId/start.
  @Post(':id/extension-order')
  extensionOrder(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    return this.orders.createExtension(user.id, id, parseBody(extensionInputSchema, body));
  }
}

// Halaman undangan untuk tamu: tanpa login.
@Controller('public/invitations')
export class PublicInvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get(':slug')
  view(@Param('slug') slug: string) {
    return this.invitations.publicView(slug);
  }

  @Post(':slug/rsvp')
  @HttpCode(200)
  rsvp(@Param('slug') slug: string, @Body() body: unknown, @Req() req: Request) {
    return this.invitations.submitRsvp(slug, parseBody(rsvpSchema, body), req.ip ?? 'unknown');
  }
}
