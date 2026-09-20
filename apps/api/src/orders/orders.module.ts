import { Global, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Global()
@Module({ controllers: [OrdersController], providers: [OrdersService], exports: [OrdersService] })
export class OrdersModule {}
