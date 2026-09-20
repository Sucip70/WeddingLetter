import { Global, Module } from '@nestjs/common';
import { LocalMediaController } from './local-media.controller.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  controllers: [LocalMediaController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
