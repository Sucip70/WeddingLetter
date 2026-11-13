import { Body, Controller, Delete, Get, Header, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { parseBody } from '../auth/auth.dto.js';
import { GuestListService, guestActivity, guestCheckin, guestInput, guestLookup, guestToken } from './guest-list.service.js';

@Controller('invitations/:id/guest-list')
@UseGuards(AuthGuard)
export class GuestListController {
  constructor(private readonly guests: GuestListService) {}
  @Get() list(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.guests.list(user.id, id); }
  @Post() create(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) { return this.guests.create(user.id, id, parseBody(guestInput, body)); }
  @Post('lookup') lookup(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) { return this.guests.lookup(user.id, id, parseBody(guestLookup, body).token); }
  @Post('check-in') checkin(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) { return this.guests.checkin(user.id, id, parseBody(guestCheckin, body)); }
  @Patch(':guestId') update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('guestId') guestId: string, @Body() body: unknown) { return this.guests.update(user.id, id, guestId, parseBody(guestInput, body)); }
  @Delete(':guestId') remove(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('guestId') guestId: string) { return this.guests.remove(user.id, id, guestId); }
  @Post(':guestId/activity') activity(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('guestId') guestId: string, @Body() body: unknown) { return this.guests.activity(user.id, id, guestId, parseBody(guestActivity, body).action); }
}

@Controller('public/invitations/:slug/guest')
export class PublicGuestController {
  constructor(private readonly guests: GuestListService) {}
  @Get(':token')
  @Header('Cache-Control', 'no-store')
  publicGuest(@Param('slug') slug: string, @Param('token') token: string) { return this.guests.publicGuest(slug, parseBody(guestToken, token)); }
}
