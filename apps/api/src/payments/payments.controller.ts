import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { AuthUser } from '../auth/auth.guard.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':orderId/start')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  start(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.start(user.id, orderId);
  }

  // Jaring pengaman kalau webhook Midtrans tidak sampai (localhost saat dev, atau gagal di production):
  // tanya langsung ke Midtrans lewat Core API. Dipanggil web saat halaman checkout dibuka/polling.
  @Post(':orderId/sync')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  sync(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.syncWithMidtrans(user.id, orderId);
  }

  // Webhook dari Midtrans (tanpa login; keabsahan dicek lewat signature).
  @Post('midtrans/notification')
  @HttpCode(200)
  midtrans(@Body() body: Record<string, string>) {
    return this.payments.handleMidtrans(body);
  }

  @Post('dev/:orderId/confirm')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  devConfirm(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.payments.devConfirm(user.id, orderId);
  }
}
