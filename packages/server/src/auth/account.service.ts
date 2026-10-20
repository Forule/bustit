import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { Env } from '../infrastructure/config/index.js';
import type {
  Database,
  Transaction,
} from '../infrastructure/database/index.js';
import { LedgerService } from '../ledger/index.js';
import { type User, type UserRole, UsersService } from '../users/index.js';
import { hashPassword } from './password.js';

export type NewAccount = {
  /** Already normalized, see `usernameSchema` in `@bustit/shared`. */
  readonly username: string;
  readonly password: string;
  readonly role: UserRole;
};

@Injectable()
export class AccountService {
  private readonly startingBalance: number;

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly usersService: UsersService,
    private readonly ledgerService: LedgerService,
    configService: ConfigService<Env, true>,
  ) {
    this.startingBalance = configService.get('STARTING_BALANCE', {
      infer: true,
    });
  }

  /**
   * Creates the user and books the starting balance in one transaction, so an
   * account never exists without it. Runs inside `tx` when given.
   */
  async create(account: NewAccount, tx?: Transaction): Promise<User> {
    const passwordHash = await hashPassword(account.password);

    const create = async (tx: Transaction): Promise<User> => {
      const user = await this.usersService.create(
        { username: account.username, passwordHash, role: account.role },
        tx,
      );
      const balance = await this.ledgerService.book(
        {
          userId: user.id,
          delta: this.startingBalance,
          reason: 'signup_bonus',
        },
        tx,
      );

      return { ...user, balance };
    };

    return tx ? create(tx) : this.db.transaction(create);
  }
}
