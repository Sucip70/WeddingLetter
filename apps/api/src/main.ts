import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_BASE_URL ?? 'http://localhost:3000' });
  await app.listen(process.env.APP_PORT ?? 4000);
}
await bootstrap();
