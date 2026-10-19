import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/index.js';
import { UsersModule } from '../users/index.js';
import { AccountService } from './account.service.js';
import { AdminBootstrapService } from './admin-bootstrap.service.js';

@Module({
  imports: [UsersModule, LedgerModule],
  providers: [AccountService, AdminBootstrapService],
  exports: [AccountService],
})
export class AuthModule {}
