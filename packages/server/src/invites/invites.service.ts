import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, desc, eq, getTableColumns, gt, isNull, sql } from 'drizzle-orm';
import { AccountService } from '../auth/index.js';
import type { Env } from '../infrastructure/config/index.js';
import type { Database } from '../infrastructure/database/index.js';
import type { User } from '../users/index.js';
import { generateInviteCode, hashInviteCode } from './invite-code.js';
import {
  InvalidInviteError,
  InviteNotFoundError,
  InviteUsedError,
} from './invites.errors.js';
import { type Invite, invites } from './invites.schema.js';

export type CreatedInvite = {
  readonly invite: Invite;
  /** The plain code, only available right after creating the invite. */
  readonly code: string;
};

export type InviteStatus = 'open' | 'used' | 'revoked' | 'expired';

export type InviteWithStatus = Invite & { readonly status: InviteStatus };

/*
 * Derived in the database, so "expired" is judged by the same clock as in
 * redeem. A used invite stays used once it expires.
 */
const status = sql<InviteStatus>`case
  when ${invites.usedAt} is not null then 'used'
  when ${invites.revokedAt} is not null then 'revoked'
  when ${invites.expiresAt} <= now() then 'expired'
  else 'open'
end`;

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

  /** All invites, newest first. */
  list(): Promise<InviteWithStatus[]> {
    return this.db
      .select({ ...getTableColumns(invites), status })
      .from(invites)
      .orderBy(desc(invites.createdAt), desc(invites.id));
  }

  /**
   * Makes an invite unusable. Revoking it again keeps the first revocation.
   *
   * @throws InviteNotFoundError if there is no invite with the id.
   * @throws InviteUsedError if the invite was redeemed already.
   */
  async revoke(id: string): Promise<void> {
    /*
     * A concurrent redemption holds the row lock, so this update waits for it
     * and then finds the invite used.
     */
    const [revoked] = await this.db
      .update(invites)
      .set({ revokedAt: sql`coalesce(${invites.revokedAt}, now())` })
      .where(and(eq(invites.id, id), isNull(invites.usedAt)))
      .returning({ id: invites.id });

    if (revoked) {
      return;
    }

    const [invite] = await this.db
      .select({ id: invites.id })
      .from(invites)
      .where(eq(invites.id, id));

    throw invite ? new InviteUsedError(id) : new InviteNotFoundError(id);
  }

  /**
   * Creates a player account and uses up the invite in one transaction, so a
   * failed registration, e.g. for a taken username, leaves the invite valid.
   *
   * @throws InvalidInviteError if the code is unknown, used, revoked or
   *   expired.
   * @throws UsernameTakenError if another user has the username.
   */
  async redeem(registration: Registration): Promise<User> {
    const { code, username, password } = registration;

    return this.db.transaction(async (tx) => {
      /*
       * The row lock makes concurrent redemptions of one code wait for each
       * other. Once the first commits, Postgres checks the conditions again
       * for the waiting ones, which then find the invite used. The same
       * applies to a concurrent revocation.
       */
      const [invite] = await tx
        .select({ id: invites.id })
        .from(invites)
        .where(
          and(
            eq(invites.codeHash, hashInviteCode(code)),
            isNull(invites.usedAt),
            isNull(invites.revokedAt),
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
