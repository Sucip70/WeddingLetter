import { afterEach, describe, expect, it, vi } from 'vitest';
const google = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock('jose', () => ({ createRemoteJWKSet: vi.fn(), jwtVerify: google.verify }));
import { AuthService } from './auth.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { TokenService } from './token.service.js';
import type { MailerService } from './mailer.service.js';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('Google sign-in and legacy pending registration credentials', () => {
  it.each([false, true])('only preserves a pre-existing password if the account was verified=%s', async (verified) => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client');
    google.verify.mockResolvedValue({ payload: { sub: 'google-id', email: 'owner@example.com', email_verified: true } });
    const user = { id: 'owner', email: 'owner@example.com', name: 'Owner', phone: null, role: 'USER', passwordHash: 'old-password-hash', emailVerifiedAt: verified ? new Date() : null };
    const update = vi.fn().mockImplementation(async ({ data }) => Object.assign(user, data));
    const prisma = { user: { findUnique: vi.fn().mockImplementation(async ({ where }) => where.email === user.email ? user : null), update } } as unknown as PrismaService;
    const service = new AuthService(prisma, { sign: vi.fn().mockResolvedValue('owner-session') } as unknown as TokenService, {} as MailerService);
    const result = await service.loginWithGoogle('google-token');
    expect(result.accessToken).toBe('owner-session');
    expect(user.passwordHash).toBe(verified ? 'old-password-hash' : null);
    expect(google.verify).toHaveBeenCalledWith('google-token', undefined, expect.objectContaining({ audience: 'google-client' }));
  });
});
