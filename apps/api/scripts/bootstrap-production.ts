import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

if (process.env.BOOTSTRAP_CONFIRM !== 'weddingletter.id'
  || process.env.R2_BUCKET_NAME !== 'weddingletter-production'
  || process.env.APP_BASE_URL !== 'https://weddingletter.id'
  || new URL(process.env.DATABASE_URL ?? '').pathname !== '/weddingletter_production') {
  throw new Error('Use the production database/domain/bucket and BOOTSTRAP_CONFIRM=weddingletter.id');
}
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set a valid ADMIN_EMAIL');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  await prisma.user.upsert({ where: { email }, update: { role: 'ADMIN' }, create: { email, name: 'Admin', role: 'ADMIN', emailVerifiedAt: new Date() } });
  console.log('Production administrator initialized. Sign in using OTP or Google.');
} finally { await prisma.$disconnect(); }
