import { Global, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { SettingsModule } from '../settings/settings.module.js';

@Global()
@Module({ imports: [SettingsModule], controllers: [OrdersController], providers: [OrdersService], exports: [OrdersService] })
export class OrdersModule {}
