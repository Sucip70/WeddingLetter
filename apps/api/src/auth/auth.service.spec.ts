import { ConflictException, HttpException, UnauthorizedException } from '@nestjs/common';
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
      count: async ({ where }: any) =>
        otps.filter((o) => (!where.email || o.email === where.email) && (!where.createdAt || o.createdAt > where.createdAt.gt)).length,
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

describe('Batas pengiriman kode', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.OTP_DAILY_LIMIT;
    delete process.env.OTP_PER_EMAIL_DAILY;
  });
  afterEach(() => {
    delete process.env.OTP_DAILY_LIMIT;
    delete process.env.OTP_PER_EMAIL_DAILY;
  });

  const fresh = (otps: OtpRow[], n: number, email: string) => {
    for (let i = 0; i < n; i++) otps.push({ id: `x${i}${email}`, email, codeHash: '', attempts: 0, expiresAt: new Date(), consumedAt: null, createdAt: new Date(Date.now() - 3600_000) });
  };

  it('satu email dibatasi 8 kode per 24 jam (bisa diatur), email lain tidak ikut terhalang', async () => {
    const { service, otps } = setup();
    fresh(otps, 8, 'spam@b.com');
    await expect(service.requestOtp('spam@b.com')).rejects.toMatchObject({ status: 429 });
    await expect(service.requestOtp('lain@b.com')).resolves.toMatchObject({ ok: true });

    process.env.OTP_PER_EMAIL_DAILY = '20';
    await expect(service.requestOtp('spam@b.com')).resolves.toMatchObject({ ok: true });
  });

  it('total kode per hari dibatasi (default 90) supaya kuota email tidak habis', async () => {
    const { service, otps } = setup();
    for (let i = 0; i < 90; i++) fresh(otps, 1, `u${i}@b.com`);
    await expect(service.requestOtp('baru@b.com')).rejects.toMatchObject({ status: 429 });

    process.env.OTP_DAILY_LIMIT = '200';
    await expect(service.requestOtp('baru@b.com')).resolves.toMatchObject({ ok: true });
  });

  it('kode lebih dari 24 jam lalu tidak dihitung', async () => {
    const { service, otps } = setup();
    fresh(otps, 8, 'lama@b.com');
    for (const o of otps) o.createdAt = new Date(Date.now() - 25 * 3600_000);
    await expect(service.requestOtp('lama@b.com')).resolves.toMatchObject({ ok: true });
  });
});

describe('Sesi bergulir', () => {
  it('refresh menerbitkan token baru yang valid untuk user yang sama', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { service } = setup();
    const { accessToken } = await service.refresh('user-9');
    expect(await new TokenService().verify(accessToken)).toEqual({ sub: 'user-9' });
  });

  it('masa berlaku bawaan 30 hari, bisa diubah lewat JWT_EXPIRES_IN', async () => {
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.JWT_EXPIRES_IN;
    const tokens = new TokenService();
    const days = (t: string) => {
      const payload = JSON.parse(Buffer.from(t.split('.')[1]!, 'base64url').toString());
      return Math.round((payload.exp - payload.iat) / 86400);
    };
    expect(days(await tokens.sign('u'))).toBe(30);
    process.env.JWT_EXPIRES_IN = '7d';
    expect(days(await tokens.sign('u'))).toBe(7);
    delete process.env.JWT_EXPIRES_IN;
  });
});

describe('AuthService password', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('daftar baru mengirim kode verifikasi, bukan sesi langsung', async () => {
    const { service, users, code } = setup();
    const res = await service.registerWithPassword('a@b.com', 'sandi-aman', 'Andi');
    expect(res).toMatchObject({ ok: true, needsVerification: true });
    expect(users).toHaveLength(1);
    expect(users[0].emailVerifiedAt).toBeUndefined();

    // Kode yang dikirim sama persis yang dipakai endpoint otp/verify.
    const verified = await service.verifyOtp('a@b.com', code());
    expect(verified.accessToken).toBeTruthy();
    expect(verified.user.email).toBe('a@b.com');
  });

  it('daftar dengan email yang sudah punya kata sandi ditolak (409)', async () => {
    const { service } = setup();
    await service.registerWithPassword('a@b.com', 'sandi-aman', 'Andi');
    await expect(service.registerWithPassword('a@b.com', 'lain-lagi', 'Andi')).rejects.toBeInstanceOf(ConflictException);
  });

  it('akun yang sudah terverifikasi (misal via Google) langsung dapat sesi saat set kata sandi', async () => {
    const { service, users } = setup();
    // Simulasikan akun yang sudah ada & terverifikasi lewat Google (tanpa passwordHash).
    users.push({ id: 'u-google', email: 'a@b.com', name: 'Andi', googleId: 'g1', emailVerifiedAt: new Date(), phone: null, role: 'USER' });

    const res = await service.registerWithPassword('a@b.com', 'sandi-aman', 'Andi');
    expect('accessToken' in res).toBe(true);
  });

  it('masuk dengan kata sandi salah atau akun tanpa kata sandi ditolak', async () => {
    const { service, code } = setup();
    await service.requestOtp('otp-only@b.com');
    await service.verifyOtp('otp-only@b.com', code()); // akun lama tanpa passwordHash

    await expect(service.loginWithPassword('otp-only@b.com', 'apapun')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.loginWithPassword('tidak-ada@b.com', 'apapun')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('masuk sebelum verifikasi email ditolak; setelah verifikasi berhasil', async () => {
    const { service, code } = setup();
    await service.registerWithPassword('c@b.com', 'sandi-benar', 'Citra');
    await expect(service.loginWithPassword('c@b.com', 'sandi-benar')).rejects.toBeInstanceOf(UnauthorizedException);

    await service.verifyOtp('c@b.com', code());
    const res = await service.loginWithPassword('c@b.com', 'sandi-benar');
    expect(res.accessToken).toBeTruthy();
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
