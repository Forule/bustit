import { Module } from '@nestjs/common';
import { BocInvitesController } from './boc-invites.controller.js';
import { InvitesService } from './invites.service.js';

@Module({
  controllers: [BocInvitesController],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
