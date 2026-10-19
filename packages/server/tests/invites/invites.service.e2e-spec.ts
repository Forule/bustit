import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import type { Database } from '../../src/infrastructure/database/index.js';
import {
  InvalidInviteError,
  InvitesModule,
  InvitesService,
  hashInviteCode,
  invites,
} from '../../src/invites/index.js';
import { ledger } from '../../src/ledger/index.js';
import { UsernameTakenError, users } from '../../src/users/index.js';

const PASSWORD = 'player-password';

describe('InvitesService', () => {
  let module: TestingModule;
  let db: Database;
  let service: InvitesService;
  let adminId: string;
  let usernameCount = 0;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule, InvitesModule],
    }).compile();
    module.useLogger(false);
    await module.init();

    db = module.get(getDrizzleToken());
    service = module.get(InvitesService);

    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'));
    adminId = admin!.id;
  });

  afterAll(async () => {
    await module.close();
  });

  /** Every test registers usernames of its own. */
  function nextUsername(): string {
    return `invited_${++usernameCount}`;
  }

  async function inviteOf(code: string) {
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.codeHash, hashInviteCode(code)));
    return invite;
  }

  describe('create', () => {
    it('stores only the hash of the code', async () => {
      const { invite, code } = await service.create(adminId);

      expect(invite.codeHash).toBe(hashInviteCode(code));
      expect(JSON.stringify(await inviteOf(code))).not.toContain(code);
    });

    it('expires after the configured days', async () => {
      const { invite } = await service.create(adminId);
      const days =
        (invite.expiresAt.getTime() - invite.createdAt.getTime()) /
        (24 * 60 * 60 * 1000);

      expect(days).toBeCloseTo(7);
      expect(invite).toMatchObject({
        createdBy: adminId,
        usedAt: null,
        usedBy: null,
      });
    });
  });

  describe('redeem', () => {
    it('creates a player with the starting balance and uses up the invite', async () => {
      const { code } = await service.create(adminId);
      const username = nextUsername();

      const user = await service.redeem({ code, username, password: PASSWORD });

      expect(user).toMatchObject({ username, role: 'player', balance: 1000 });
      expect(
        await db.select().from(ledger).where(eq(ledger.userId, user.id)),
      ).toMatchObject([{ delta: 1000, reason: 'signup_bonus' }]);
      expect(await inviteOf(code)).toMatchObject({ usedBy: user.id });
      expect((await inviteOf(code))!.usedAt).toBeInstanceOf(Date);
    });

    it('accepts the code as typed by a user', async () => {
      const { code } = await service.create(adminId);
      const typed = code.replace(/^BJ-/, '').replaceAll('-', ' ').toLowerCase();

      await expect(
        service.redeem({
          code: typed,
          username: nextUsername(),
          password: PASSWORD,
        }),
      ).resolves.toMatchObject({ role: 'player' });
    });

    it('accepts a code only once', async () => {
      const { code } = await service.create(adminId);
      await service.redeem({
        code,
        username: nextUsername(),
        password: PASSWORD,
      });

      await expect(
        service.redeem({ code, username: nextUsername(), password: PASSWORD }),
      ).rejects.toThrow(InvalidInviteError);
    });

    it('rejects an unknown code', async () => {
      await expect(
        service.redeem({
          code: 'BJ-0000-0000-0000',
          username: nextUsername(),
          password: PASSWORD,
        }),
      ).rejects.toThrow(InvalidInviteError);
    });

    it('rejects an expired code', async () => {
      const { invite, code } = await service.create(adminId);
      await db
        .update(invites)
        .set({ expiresAt: sql`now() - interval '1 second'` })
        .where(eq(invites.id, invite.id));

      await expect(
        service.redeem({ code, username: nextUsername(), password: PASSWORD }),
      ).rejects.toThrow(InvalidInviteError);
    });

    it('keeps the invite valid when the username is taken', async () => {
      const { code } = await service.create(adminId);
      const { code: firstCode } = await service.create(adminId);
      const username = nextUsername();
      await service.redeem({ code: firstCode, username, password: PASSWORD });

      await expect(
        service.redeem({ code, username, password: PASSWORD }),
      ).rejects.toThrow(UsernameTakenError);
      expect(await inviteOf(code)).toMatchObject({
        usedAt: null,
        usedBy: null,
      });

      await expect(
        service.redeem({ code, username: nextUsername(), password: PASSWORD }),
      ).resolves.toMatchObject({ role: 'player' });
    });

    it('lets only one of concurrent redemptions of a code through', async () => {
      const { code } = await service.create(adminId);
      const usernames = Array.from({ length: 5 }, () => nextUsername());

      const results = await Promise.allSettled(
        usernames.map((username) =>
          service.redeem({ code, username, password: PASSWORD }),
        ),
      );

      expect(
        results.filter(({ status }) => status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results
          .filter(
            (result): result is PromiseRejectedResult =>
              result.status === 'rejected',
          )
          .every(({ reason }) => reason instanceof InvalidInviteError),
      ).toBe(true);

      const created = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`${users.username} in ${usernames}`);
      expect(created).toHaveLength(1);
    });
  });
});
