import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { Database } from '../infrastructure/database/index.js';
import { InvitesService } from '../invites/index.js';
import type { User } from '../users/index.js';
import { AccountService } from './account.service.js';

export type Registration = {
  /** As typed by the user, see `normalizeInviteCode`. */
  readonly inviteCode: string;
  /** Already normalized, see `usernameSchema` in `@bustit/shared`. */
  readonly username: string;
  readonly password: string;
};

@Injectable()
export class RegistrationService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly invitesService: InvitesService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * Creates a player account with an invite code and uses up the invite in
   * one transaction, so a failed registration, e.g. for a taken username,
   * leaves the invite valid.
   *
   * @throws InvalidInviteError if the code is unknown, used, revoked or
   *   expired.
   * @throws UsernameTakenError if another user has the username.
   */
  register(registration: Registration): Promise<User> {
    const { inviteCode, username, password } = registration;

    return this.db.transaction(async (tx) => {
      const invite = await this.invitesService.claim(inviteCode, tx);
      const user = await this.accountService.create(
        { username, password, role: 'player' },
        tx,
      );

      await this.invitesService.markUsed(invite.id, user.id, tx);

      return user;
    });
  }
}
