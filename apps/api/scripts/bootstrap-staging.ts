import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

if (process.env.R2_BUCKET_NAME !== 'weddingletter-staging' || process.env.APP_BASE_URL !== 'https://staging.weddingletter.id') throw new Error('Bootstrap only supports staging');
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Set a valid ADMIN_EMAIL');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  await prisma.user.upsert({ where: { email }, update: { role: 'ADMIN' }, create: { email, name: 'Admin', role: 'ADMIN', emailVerifiedAt: new Date() } });
  console.log('Staging administrator initialized. Sign in with OTP, then publish the local catalog.');
} finally { await prisma.$disconnect(); }
