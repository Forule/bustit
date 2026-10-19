import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { AccountService } from '../../src/auth/account.service.js';
import { AdminBootstrapService } from '../../src/auth/admin-bootstrap.service.js';
import type { Env } from '../../src/infrastructure/config/index.js';
import { LedgerService, ledger } from '../../src/ledger/index.js';
import { UsersService, users } from '../../src/users/index.js';
import { type TestApp, createTestApp } from '../utils/test-app.js';

describe('AdminBootstrapService', () => {
  let app: TestApp;
  let config: ConfigService<Env, true>;

  beforeAll(async () => {
    app = await createTestApp();
    config = app.module.get(ConfigService);
  });

  afterAll(async () => {
    await app.module.close();
  });

  it('creates the admin from the environment with the starting balance', async () => {
    const [admin] = await app.db
      .select()
      .from(users)
      .where(eq(users.username, config.get('ADMIN_USERNAME', { infer: true })));

    expect(admin).toMatchObject({ role: 'admin', balance: 1000 });
    expect(
      await app.db.select().from(ledger).where(eq(ledger.userId, admin!.id)),
    ).toMatchObject([{ delta: 1000, reason: 'signup_bonus' }]);
  });

  it('leaves an existing admin alone on the next start', async () => {
    await app.module.get(AdminBootstrapService).onApplicationBootstrap();

    expect(
      await app.db.select().from(users).where(eq(users.role, 'admin')),
    ).toHaveLength(1);
  });

  describe('on a fresh database', () => {
    let fresh: Awaited<ReturnType<typeof createFreshDatabase>>;

    beforeAll(async () => {
      fresh = await createFreshDatabase();
    });

    afterAll(async () => {
      await fresh.$client.end();
    });

    it('creates exactly one admin when instances start at once', async () => {
      const usersService = new UsersService(fresh);
      const accountService = new AccountService(
        fresh,
        usersService,
        new LedgerService(fresh),
        config,
      );

      await Promise.all(
        Array.from({ length: 5 }, () =>
          new AdminBootstrapService(
            fresh,
            usersService,
            accountService,
            config,
          ).onApplicationBootstrap(),
        ),
      );

      expect(
        await fresh.select().from(users).where(eq(users.role, 'admin')),
      ).toHaveLength(1);
    });
  });
});

/**
 * Creates and migrates a database of its own in the test container, since
 * the shared one already has its admin from starting the app.
 */
async function createFreshDatabase() {
  const url = new URL(inject('databaseUrl'));
  const name = `bootstrap_${randomBytes(4).toString('hex')}`;
  const admin = drizzle(url.toString());

  await admin.$client.query(`create database ${name}`);
  await admin.$client.end();

  url.pathname = `/${name}`;
  const db = drizzle(url.toString(), { casing: 'snake_case' });
  await migrate(db, { migrationsFolder: './drizzle' });

  return db;
}
