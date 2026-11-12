import { Global, Module } from '@nestjs/common';
import { InvitationsController, PublicInvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';
import { LifecycleService } from './lifecycle.service.js';
import { GuestListController, PublicGuestController } from './guest-list.controller.js';
import { GuestListService } from './guest-list.service.js';

@Global()
@Module({
  controllers: [InvitationsController, PublicInvitationsController, GuestListController, PublicGuestController],
  providers: [InvitationsService, LifecycleService, GuestListService],
  exports: [InvitationsService, LifecycleService],
})
export class InvitationsModule {}
