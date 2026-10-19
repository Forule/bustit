import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type {
  Database,
  Transaction,
} from '../infrastructure/database/index.js';
import { type User, type UserRole, users } from './users.schema.js';

export type NewUser = {
  /** Already normalized, see `usernameSchema` in `@bustit/shared`. */
  readonly username: string;
  readonly passwordHash: string;
  readonly role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async hasAdmin(tx?: Transaction): Promise<boolean> {
    const [admin] = await (tx ?? this.db)
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);
    return admin !== undefined;
  }

  /** Creates a user with a balance of zero, see `AccountService`. */
  async create(user: NewUser, tx: Transaction): Promise<User> {
    const [created] = await tx.insert(users).values(user).returning();
    return created!;
  }
}
