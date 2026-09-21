import { Global, Module } from '@nestjs/common';
import { DemoPhotosAdminController, DemoPhotosPublicController } from './demo-photos.controller.js';
import { DemoPhotosService } from './demo-photos.service.js';

@Global()
@Module({
  controllers: [DemoPhotosPublicController, DemoPhotosAdminController],
  providers: [DemoPhotosService],
  exports: [DemoPhotosService],
})
export class DemoPhotosModule {}
