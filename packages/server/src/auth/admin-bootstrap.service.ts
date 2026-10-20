import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import type { Env } from '../infrastructure/config/index.js';
import type { Database } from '../infrastructure/database/index.js';
import { UsersService } from '../users/index.js';
import { AccountService } from './account.service.js';

/**
 * Creates the first admin from the environment, so a fresh installation can
 * be administered. Once an admin exists the variables are ignored, so
 * changing them never touches an existing account.
 */
@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly usersService: UsersService,
    private readonly accountService: AccountService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const username = this.configService.get('ADMIN_USERNAME', { infer: true });

    const created = await this.db.transaction(async (tx) => {
      /*
       * Instances starting at the same time would otherwise all see no admin
       * and all create one. The lock lets one check and create at a time and
       * is released with the transaction. Postgres derives the lock's key
       * from its name.
       */
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('admin-bootstrap'))`,
      );

      if (await this.usersService.hasAdmin(tx)) {
        return false;
      }

      await this.accountService.create(
        {
          username,
          password: this.configService.get('ADMIN_PASSWORD', { infer: true }),
          role: 'admin',
        },
        tx,
      );

      return true;
    });

    if (created) {
      this.logger.log(`Created admin ${username}`);
    }
  }
}
