import { Module } from '@nestjs/common';
import { MaintenanceService } from '../jobs/maintenance.service.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  controllers: [AdminController],
  providers: [AdminService, MaintenanceService],
})
export class AdminModule {}
