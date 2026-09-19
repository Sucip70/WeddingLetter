import { HttpException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { MailerService } from './mailer.service.js';
import { TokenService } from './token.service.js';

interface OtpRow {
  id: string;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

function setup() {
  const otps: OtpRow[] = [];
  const users: any[] = [];
  let sentCode = '';

  const prisma: any = {
    otpCode: {
      findFirst: async ({ where }: any) =>
        otps
          .filter(
            (o) =>
              o.email === where.email &&
              (where.consumedAt === undefined || o.consumedAt === where.consumedAt) &&
              (!where.expiresAt || o.expiresAt > where.expiresAt.gt),
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
      create: async ({ data }: any) => {
        const row = { id: `otp${otps.length}`, attempts: 0, consumedAt: null, createdAt: new Date(), ...data };
        otps.push(row);
        return row;
      },
      update: async ({ where, data }: any) => {
        const row = otps.find((o) => o.id === where.id)!;
        row.attempts += data.attempts.increment;
        return row;
      },
      updateMany: async ({ where, data }: any) => {
        const row = otps.find((o) => o.id === where.id && o.consumedAt === where.consumedAt);
        if (row) row.consumedAt = data.consumedAt;
        return { count: row ? 1 : 0 };
      },
    },
    user: {
      findUnique: async ({ where }: any) => users.find((u) => u.email === where.email) ?? null,
      create: async ({ data }: any) => {
        const u = { id: `u${users.length}`, phone: null, role: 'USER', ...data };
        users.push(u);
        return u;
      },
      update: async ({ where, data }: any) => Object.assign(users.find((u) => u.id === where.id), data),
    },
  };
  const mailer = { sendOtp: async (_e: string, code: string) => void (sentCode = code) } as unknown as MailerService;
  const service = new AuthService(prisma, new TokenService(), mailer);
  return { service, otps, users, code: () => sentCode };
}

describe('AuthService OTP', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('login dengan kode benar membuat user baru dan mengembalikan token', async () => {
    const { service, users, code } = setup();
    await service.requestOtp('a@b.com');
    const res = await service.verifyOtp('a@b.com', code(), 'Andi');

    expect(res.accessToken).toBeTruthy();
    expect(res.user.email).toBe('a@b.com');
    expect(users).toHaveLength(1);
    expect(users[0].emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('kode hanya bisa dipakai sekali', async () => {
    const { service, code } = setup();
    await service.requestOtp('a@b.com');
    const c = code();
    await service.verifyOtp('a@b.com', c);
    await expect(service.verifyOtp('a@b.com', c)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('kode salah ditolak dan diblokir setelah 5 percobaan, bahkan dengan kode benar', async () => {
    const { service, code } = setup();
    await service.requestOtp('a@b.com');
    const wrong = code() === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      await expect(service.verifyOtp('a@b.com', wrong)).rejects.toBeInstanceOf(UnauthorizedException);
    }
    await expect(service.verifyOtp('a@b.com', code())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('kode kedaluwarsa ditolak', async () => {
    const { service, otps, code } = setup();
    await service.requestOtp('a@b.com');
    otps[0].expiresAt = new Date(Date.now() - 1000);
    await expect(service.verifyOtp('a@b.com', code())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('minta kode lagi dalam cooldown ditolak (429)', async () => {
    const { service } = setup();
    await service.requestOtp('a@b.com');
    await expect(service.requestOtp('a@b.com')).rejects.toMatchObject({ status: 429 });
    await expect(service.requestOtp('a@b.com')).rejects.toBeInstanceOf(HttpException);
  });

  it('user yang sudah ada tidak diduplikasi', async () => {
    const { service, users, otps, code } = setup();
    await service.requestOtp('a@b.com');
    await service.verifyOtp('a@b.com', code());
    otps[0].createdAt = new Date(Date.now() - 120_000); // lewati cooldown
    await service.requestOtp('a@b.com');
    await service.verifyOtp('a@b.com', code());
    expect(users).toHaveLength(1);
  });
});

describe('TokenService', () => {
  it('sign lalu verify mengembalikan user id; token rusak/secret lain ditolak', async () => {
    process.env.JWT_SECRET = 'secret-1';
    const tokens = new TokenService();
    const token = await tokens.sign('user-1');
    expect(await tokens.verify(token)).toEqual({ sub: 'user-1' });
    expect(await tokens.verify(token + 'x')).toBeNull();

    process.env.JWT_SECRET = 'secret-2';
    expect(await tokens.verify(token)).toBeNull();
  });
});
