import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, type TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { AccountService } from '../../src/auth/index.js';
import type { Database } from '../../src/infrastructure/database/index.js';
import { ledger } from '../../src/ledger/index.js';
import { UsernameTakenError, users } from '../../src/users/index.js';

describe('AccountService', () => {
  let module: TestingModule;
  let db: Database;
  let service: AccountService;
  let accountCount = 0;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    module.useLogger(false);
    await module.init();

    db = module.get(getDrizzleToken());
    service = module.get(AccountService);
  });

  afterAll(async () => {
    await module.close();
  });

  /** Every test works on a username of its own. */
  function nextUsername(): string {
    return `account_${++accountCount}`;
  }

  async function findUser(username: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  it('creates the user with a hashed password', async () => {
    const username = nextUsername();

    const user = await service.create({
      username,
      password: 'player-password',
      role: 'player',
    });

    expect(user).toMatchObject({
      username,
      role: 'player',
      tokenVersion: 0,
      disabledAt: null,
    });
    expect(user.passwordHash).not.toContain('player-password');
    await expect(
      argon2.verify(user.passwordHash, 'player-password'),
    ).resolves.toBe(true);
  });

  it('books the starting balance', async () => {
    const user = await service.create({
      username: nextUsername(),
      password: 'player-password',
      role: 'player',
    });

    expect(user.balance).toBe(1000);
    expect((await findUser(user.username))!.balance).toBe(1000);
    expect(
      await db.select().from(ledger).where(eq(ledger.userId, user.id)),
    ).toMatchObject([
      { delta: 1000, balanceAfter: 1000, reason: 'signup_bonus' },
    ]);
  });

  it('rejects a username that is taken', async () => {
    const account = {
      username: nextUsername(),
      password: 'player-password',
      role: 'player',
    } as const;

    await service.create(account);

    await expect(service.create(account)).rejects.toThrow(UsernameTakenError);
  });

  it('rejects a username the database does not accept', async () => {
    await expect(
      service.create({
        username: 'Not Normalized',
        password: 'player-password',
        role: 'player',
      }),
    ).rejects.toThrow();
  });

  it('commits and rolls back together with the given transaction', async () => {
    const username = nextUsername();

    await expect(
      db.transaction(async (tx) => {
        await service.create(
          { username, password: 'player-password', role: 'player' },
          tx,
        );
        throw new Error('caller failed');
      }),
    ).rejects.toThrow('caller failed');

    expect(await findUser(username)).toBeUndefined();
  });
});
