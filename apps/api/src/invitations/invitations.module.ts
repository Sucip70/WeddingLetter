import { Global, Module } from '@nestjs/common';
import { InvitationsController, PublicInvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';
import { LifecycleService } from './lifecycle.service.js';

@Global()
@Module({
  controllers: [InvitationsController, PublicInvitationsController],
  providers: [InvitationsService, LifecycleService],
  exports: [InvitationsService, LifecycleService],
})
export class InvitationsModule {}
