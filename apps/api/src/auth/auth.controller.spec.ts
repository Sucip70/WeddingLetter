import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';
import { TokenService } from './token.service.js';

describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let token: string;
  const users = [{ id: 'u1', name: 'Andi', email: 'a@b.com', phone: null, role: 'USER', createdAt: new Date() }];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const prisma = {
      user: { findUnique: async ({ where }: any) => users.find((u) => u.id === where.id) ?? null },
    };
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule] })
      .useMocker((t) => (t === PrismaService ? prisma : undefined))
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    token = await moduleRef.get(TokenService).sign('u1');
  });

  afterAll(() => app.close());

  it('GET /auth/me tanpa token -> 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me dengan token palsu -> 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer abc.def.ghi').expect(401);
  });

  it('GET /auth/me dengan token valid -> data user', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.email).toBe('a@b.com');
  });

  it('POST /auth/otp/request dengan email tidak valid -> 400', async () => {
    await request(app.getHttpServer()).post('/auth/otp/request').send({ email: 'bukan-email' }).expect(400);
  });

  it('POST /auth/otp/verify dengan kode bukan 6 digit -> 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ email: 'a@b.com', code: '12' })
      .expect(400);
  });

  it('POST /auth/google tanpa GOOGLE_CLIENT_ID -> 503', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    await request(app.getHttpServer()).post('/auth/google').send({ idToken: 'x' }).expect(503);
  });
});
