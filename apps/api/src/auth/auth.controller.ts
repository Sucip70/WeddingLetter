import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { googleLoginSchema, parseBody, requestOtpSchema, verifyOtpSchema } from './auth.dto.js';
import { AuthGuard, CurrentUser } from './auth.guard.js';
import type { AuthUser } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('otp/request')
  @HttpCode(200)
  requestOtp(@Body() body: unknown) {
    return this.auth.requestOtp(parseBody(requestOtpSchema, body).email);
  }

  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() body: unknown) {
    const { email, code, name } = parseBody(verifyOtpSchema, body);
    return this.auth.verifyOtp(email, code, name);
  }

  @Post('google')
  @HttpCode(200)
  google(@Body() body: unknown) {
    return this.auth.loginWithGoogle(parseBody(googleLoginSchema, body).idToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
  }
}
