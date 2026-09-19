import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TemplatesModule } from './templates/templates.module.js';

@Module({
  imports: [PrismaModule, AuthModule, TemplatesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
