import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { DemoPhotosModule } from './demo-photos/demo-photos.module.js';
import { MediaModule } from './media/media.module.js';
import { MusicModule } from './music/music.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TemplatesModule } from './templates/templates.module.js';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    NotificationsModule,
    AuthModule,
    TemplatesModule,
    PricingModule,
    InvitationsModule,
    OrdersModule,
    PaymentsModule,
    MediaModule,
    DemoPhotosModule,
    MusicModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
