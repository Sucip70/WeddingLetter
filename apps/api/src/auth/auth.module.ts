import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { MailerService } from './mailer.service.js';
import { TokenService } from './token.service.js';

// Global supaya modul lain (Order, Invitation, Admin) cukup `@UseGuards(AuthGuard)`.
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService, MailerService, AuthGuard],
  exports: [AuthGuard, TokenService],
})
export class AuthModule {}
