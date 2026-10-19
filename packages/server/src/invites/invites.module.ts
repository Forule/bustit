import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { InvitesService } from './invites.service.js';

@Module({
  imports: [AuthModule],
  providers: [InvitesService],
  exports: [InvitesService],
})
export class InvitesModule {}
