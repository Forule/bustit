import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LedgerModule } from '../ledger/index.js';
import { UsersModule } from '../users/index.js';
import { AccountService } from './account.service.js';
import { AdminBootstrapService } from './admin-bootstrap.service.js';
import { AuthTokenService } from './auth-token.service.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';

@Module({
  imports: [UsersModule, LedgerModule],
  controllers: [AuthController],
  providers: [
    AccountService,
    AdminBootstrapService,
    AuthTokenService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AccountService],
})
export class AuthModule {}
