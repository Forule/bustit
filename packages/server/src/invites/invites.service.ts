import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { AccountService } from '../auth/index.js';
import type { Env } from '../infrastructure/config/index.js';
import type { Database } from '../infrastructure/database/index.js';
import type { User } from '../users/index.js';
import { generateInviteCode, hashInviteCode } from './invite-code.js';
import { InvalidInviteError } from './invites.errors.js';
import { type Invite, invites } from './invites.schema.js';

export type CreatedInvite = {
  readonly invite: Invite;
  /** The plain code, only available right after creating the invite. */
  readonly code: string;
};

export type Registration = {
  /** As typed by the user, see `normalizeInviteCode`. */
  readonly code: string;
  /** Already normalized, see `usernameSchema` in `@bustit/shared`. */
  readonly username: string;
  readonly password: string;
};

@Injectable()
export class InvitesService {
  private readonly validityDays: number;

  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly accountService: AccountService,
    configService: ConfigService<Env, true>,
  ) {
    this.validityDays = configService.get('INVITE_VALIDITY_DAYS', {
      infer: true,
    });
  }

  async create(createdBy: string): Promise<CreatedInvite> {
    const code = generateInviteCode();
    const [invite] = await this.db
      .insert(invites)
      .values({
        codeHash: hashInviteCode(code),
        createdBy,
        expiresAt: sql`now() + make_interval(days => ${this.validityDays})`,
      })
      .returning();

    return { invite: invite!, code };
  }

  /**
   * Creates a player account and uses up the invite in one transaction, so a
   * failed registration, e.g. for a taken username, leaves the invite valid.
   *
   * @throws InvalidInviteError if the code is unknown, used or expired.
   * @throws UsernameTakenError if another user has the username.
   */
  async redeem(registration: Registration): Promise<User> {
    const { code, username, password } = registration;

    return this.db.transaction(async (tx) => {
      /*
       * The row lock makes concurrent redemptions of one code wait for each
       * other. Once the first commits, Postgres checks the conditions again
       * for the waiting ones, which then find the invite used.
       */
      const [invite] = await tx
        .select({ id: invites.id })
        .from(invites)
        .where(
          and(
            eq(invites.codeHash, hashInviteCode(code)),
            isNull(invites.usedAt),
            gt(invites.expiresAt, sql`now()`),
          ),
        )
        .for('update');

      if (!invite) {
        throw new InvalidInviteError();
      }

      const user = await this.accountService.create(
        { username, password, role: 'player' },
        tx,
      );

      await tx
        .update(invites)
        .set({ usedAt: sql`now()`, usedBy: user.id })
        .where(eq(invites.id, invite.id));

      return user;
    });
  }
}
