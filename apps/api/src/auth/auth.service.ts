import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailerService } from './mailer.service.js';
import { TokenService } from './token.service.js';

const OTP_TTL_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly mailer: MailerService,
  ) {}

  async requestOtp(email: string) {
    const last = await this.prisma.otpCode.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    if (last) {
      const waitMs = OTP_RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - last.createdAt.getTime());
      if (waitMs > 0) {
        throw new HttpException(
          `Tunggu ${Math.ceil(waitMs / 1000)} detik sebelum minta kode lagi`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.otpCode.create({
      data: {
        email,
        codeHash: this.hashCode(email, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });
    await this.mailer.sendOtp(email, code, OTP_TTL_MINUTES);

    // Respons sama untuk email terdaftar maupun baru (tidak membocorkan keberadaan akun).
    return { ok: true, expiresInSeconds: OTP_TTL_MINUTES * 60 };
  }

  async verifyOtp(email: string, code: string, name?: string) {
    const invalid = new UnauthorizedException('Kode salah atau sudah kedaluwarsa');

    const otp = await this.prisma.otpCode.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) throw invalid;

    const expected = Buffer.from(otp.codeHash, 'hex');
    const actual = Buffer.from(this.hashCode(email, code), 'hex');
    if (!timingSafeEqual(expected, actual)) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw invalid;
    }

    // Consume atomik: dua request paralel dengan kode benar tidak bisa sama-sama lolos.
    const consumed = await this.prisma.otpCode.updateMany({
      where: { id: otp.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) throw invalid;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
        })
      : await this.prisma.user.create({
          data: { email, name: name ?? email.split('@')[0], emailVerifiedAt: new Date() },
        });

    return this.session(user);
  }

  async loginWithGoogle(idToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new ServiceUnavailableException('Login Google belum dikonfigurasi');

    let claims;
    try {
      ({ payload: claims } = await jwtVerify(idToken, googleJwks, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: clientId,
      }));
    } catch {
      throw new UnauthorizedException('Token Google tidak valid');
    }

    const googleId = claims.sub;
    const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : undefined;
    if (!googleId || !email || claims.email_verified !== true) {
      throw new UnauthorizedException('Email Google belum terverifikasi');
    }

    const byGoogleId = await this.prisma.user.findUnique({ where: { googleId } });
    // Email Google sudah terverifikasi, jadi aman menautkan ke akun OTP yang sudah ada.
    const existing = byGoogleId ?? (await this.prisma.user.findUnique({ where: { email } }));
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { googleId, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
        })
      : await this.prisma.user.create({
          data: {
            email,
            googleId,
            name: typeof claims.name === 'string' ? claims.name : email.split('@')[0],
            emailVerifiedAt: new Date(),
          },
        });

    return this.session(user);
  }

  private async session(user: { id: string; name: string; email: string; phone: string | null; role: string }) {
    return {
      accessToken: await this.tokens.sign(user.id),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    };
  }

  private hashCode(email: string, code: string) {
    const secret = process.env.JWT_SECRET ?? '';
    return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
  }
}
