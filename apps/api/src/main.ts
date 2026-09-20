import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Di belakang reverse proxy (Nginx/Cloudflare) set TRUST_PROXY=1 agar req.ip (pembatas RSVP) adalah IP tamu asli.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || true);
  app.enableCors({ origin: process.env.WEB_BASE_URL ?? 'http://localhost:3000' });
  await app.listen(process.env.APP_PORT ?? 4000);
}
await bootstrap();
