import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, type TestingModule } from '@nestjs/testing';
import { asc, eq, sum } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module.js';
import type { Database } from '../../src/infrastructure/database/index.js';
import {
  InsufficientBalanceError,
  LedgerModule,
  LedgerService,
  ledger,
} from '../../src/ledger/index.js';
import { users } from '../../src/users/index.js';

describe('LedgerService', () => {
  let module: TestingModule;
  let db: Database;
  let service: LedgerService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule, LedgerModule],
    }).compile();
    await module.init();

    db = module.get(getDrizzleToken());
    service = module.get(LedgerService);
  });

  afterAll(async () => {
    await module.close();
  });

  /** Every test works on a user of its own, so tests never share balances. */
  async function createUser(): Promise<string> {
    const [user] = await db
      .insert(users)
      .values({})
      .returning({ id: users.id });
    return user!.id;
  }

  async function balanceOf(userId: string): Promise<number> {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId));
    return user!.balance;
  }

  async function entriesOf(userId: string) {
    return db
      .select()
      .from(ledger)
      .where(eq(ledger.userId, userId))
      .orderBy(asc(ledger.createdAt), asc(ledger.id));
  }

  it('credits and debits the balance and records every booking', async () => {
    const userId = await createUser();

    await expect(
      service.book({ userId, delta: 1000, reason: 'signup_bonus' }),
    ).resolves.toBe(1000);
    await expect(
      service.book({ userId, delta: -250, reason: 'bet', ref: 'round-1' }),
    ).resolves.toBe(750);

    expect(await balanceOf(userId)).toBe(750);
    expect(await entriesOf(userId)).toMatchObject([
      {
        delta: 1000,
        balanceAfter: 1000,
        reason: 'signup_bonus',
        ref: null,
      },
      { delta: -250, balanceAfter: 750, reason: 'bet', ref: 'round-1' },
    ]);
  });

  it('rejects a debit beyond the balance and changes nothing', async () => {
    const userId = await createUser();
    await service.book({ userId, delta: 100, reason: 'signup_bonus' });

    await expect(
      service.book({ userId, delta: -101, reason: 'bet' }),
    ).rejects.toThrow(InsufficientBalanceError);

    expect(await balanceOf(userId)).toBe(100);
    expect(await entriesOf(userId)).toHaveLength(1);
  });

  it('allows a debit down to exactly zero', async () => {
    const userId = await createUser();
    await service.book({ userId, delta: 100, reason: 'signup_bonus' });

    await expect(
      service.book({ userId, delta: -100, reason: 'bet' }),
    ).resolves.toBe(0);
  });

  it.each([0, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    'rejects a delta of %s',
    async (delta) => {
      const userId = await createUser();

      await expect(
        service.book({ userId, delta, reason: 'admin_adjust' }),
      ).rejects.toThrow(RangeError);
    },
  );

  it('fails for an unknown user', async () => {
    await expect(
      service.book({
        userId: '00000000-0000-7000-8000-000000000000',
        delta: 100,
        reason: 'admin_adjust',
      }),
    ).rejects.toThrow('No user');
  });

  it('commits and rolls back together with the given transaction', async () => {
    const userId = await createUser();

    await expect(
      db.transaction(async (tx) => {
        await service.book({ userId, delta: 500, reason: 'signup_bonus' }, tx);
        throw new Error('caller failed');
      }),
    ).rejects.toThrow('caller failed');

    expect(await balanceOf(userId)).toBe(0);
    expect(await entriesOf(userId)).toHaveLength(0);

    await db.transaction(async (tx) => {
      await service.book({ userId, delta: 500, reason: 'signup_bonus' }, tx);
    });

    expect(await balanceOf(userId)).toBe(500);
  });

  it('never overdraws under concurrent debits', async () => {
    const userId = await createUser();
    await service.book({ userId, delta: 100, reason: 'signup_bonus' });

    const results = await Promise.allSettled(
      Array.from({ length: 30 }, () =>
        service.book({ userId, delta: -10, reason: 'bet' }),
      ),
    );

    const succeeded = results.filter(({ status }) => status === 'fulfilled');
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    expect(succeeded).toHaveLength(10);
    expect(
      rejected.every(
        ({ reason }) => reason instanceof InsufficientBalanceError,
      ),
    ).toBe(true);
    expect(await balanceOf(userId)).toBe(0);

    const balancesAfter = (await entriesOf(userId))
      .map(({ balanceAfter }) => balanceAfter)
      .sort((a, b) => b - a);
    expect(balancesAfter).toEqual([100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]);
  });

  it('keeps the balance equal to the sum of the ledger', async () => {
    const userId = await createUser();
    const deltas = [1000, -300, 450, -1150, 20, -20, 5];

    for (const delta of deltas) {
      await service.book({ userId, delta, reason: 'admin_adjust' });
    }

    const [{ total }] = (await db
      .select({ total: sum(ledger.delta).mapWith(Number) })
      .from(ledger)
      .where(eq(ledger.userId, userId))) as [{ total: number }];

    expect(await balanceOf(userId)).toBe(total);
    expect(total).toBe(5);
  });
});
