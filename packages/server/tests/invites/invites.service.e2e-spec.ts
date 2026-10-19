import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import type { Database } from '../../src/infrastructure/database/index.js';
import {
  InvalidInviteError,
  InviteNotFoundError,
  InviteUsedError,
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

  async function expire(inviteId: string): Promise<void> {
    await db
      .update(invites)
      .set({ expiresAt: sql`now() - interval '1 second'` })
      .where(eq(invites.id, inviteId));
  }

  describe('list', () => {
    it('lists invites newest first with their status', async () => {
      const open = await service.create(adminId);
      const used = await service.create(adminId);
      const revoked = await service.create(adminId);
      const expired = await service.create(adminId);

      await service.redeem({
        code: used.code,
        username: nextUsername(),
        password: PASSWORD,
      });
      await service.revoke(revoked.invite.id);
      await expire(expired.invite.id);

      const ids = [open, used, revoked, expired].map(({ invite }) => invite.id);
      const listed = (await service.list()).filter(({ id }) =>
        ids.includes(id),
      );

      expect(listed.map(({ id, status }) => ({ id, status }))).toEqual([
        { id: expired.invite.id, status: 'expired' },
        { id: revoked.invite.id, status: 'revoked' },
        { id: used.invite.id, status: 'used' },
        { id: open.invite.id, status: 'open' },
      ]);
    });

    it('keeps a used invite used once it expires', async () => {
      const { invite, code } = await service.create(adminId);
      await service.redeem({
        code,
        username: nextUsername(),
        password: PASSWORD,
      });
      await expire(invite.id);

      const listed = (await service.list()).find(({ id }) => id === invite.id);

      expect(listed?.status).toBe('used');
    });
  });

  describe('revoke', () => {
    it('makes the code unusable', async () => {
      const { invite, code } = await service.create(adminId);

      await service.revoke(invite.id);

      expect((await inviteOf(code))!.revokedAt).toBeInstanceOf(Date);
      await expect(
        service.redeem({ code, username: nextUsername(), password: PASSWORD }),
      ).rejects.toThrow(InvalidInviteError);
    });

    it('keeps the first revocation when revoked again', async () => {
      const { invite, code } = await service.create(adminId);
      await service.revoke(invite.id);
      const { revokedAt } = (await inviteOf(code))!;

      await service.revoke(invite.id);

      expect((await inviteOf(code))!.revokedAt).toEqual(revokedAt);
    });

    it('rejects a used invite', async () => {
      const { invite, code } = await service.create(adminId);
      await service.redeem({
        code,
        username: nextUsername(),
        password: PASSWORD,
      });

      await expect(service.revoke(invite.id)).rejects.toThrow(InviteUsedError);
      expect((await inviteOf(code))!.revokedAt).toBeNull();
    });

    it('rejects an unknown invite', async () => {
      await expect(
        service.revoke('00000000-0000-7000-8000-000000000000'),
      ).rejects.toThrow(InviteNotFoundError);
    });

    it('lets either a concurrent redemption or the revocation win', async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        const { invite, code } = await service.create(adminId);

        const [redemption, revocation] = await Promise.allSettled([
          service.redeem({
            code,
            username: nextUsername(),
            password: PASSWORD,
          }),
          service.revoke(invite.id),
        ]);
        const stored = (await inviteOf(code))!;

        if (redemption.status === 'fulfilled') {
          expect(revocation).toMatchObject({ status: 'rejected' });
          expect((revocation as PromiseRejectedResult).reason).toBeInstanceOf(
            InviteUsedError,
          );
          expect(stored.revokedAt).toBeNull();
        } else {
          expect(redemption.reason).toBeInstanceOf(InvalidInviteError);
          expect(revocation.status).toBe('fulfilled');
          expect(stored.usedAt).toBeNull();
        }
      }
    });
  });
});
