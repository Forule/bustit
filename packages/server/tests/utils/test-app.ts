import { getDrizzleToken } from '@nestjs/drizzle';
import { Test, type TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { AppModule } from '../../src/app.module.js';
import type { Database } from '../../src/infrastructure/database/index.js';
import { InvitesModule } from '../../src/invites/index.js';
import { LedgerModule } from '../../src/ledger/index.js';

export type TestApp = {
  readonly module: TestingModule;
  readonly db: Database;
};

/**
 * The app with every feature module, started against an emptied e2e
 * database. Its startup hooks run as in production, so afterwards the
 * database holds exactly the admin with its starting balance.
 */
export async function createTestApp(): Promise<TestApp> {
  const module = await Test.createTestingModule({
    imports: [AppModule, LedgerModule, InvitesModule],
  }).compile();
  const db: Database = module.get(getDrizzleToken());

  await emptyDatabase(db);

  module.useLogger(false);
  await module.init();

  return { module, db };
}

/**
 * Empties every table of the app. Drizzle's migration bookkeeping lives in a
 * schema of its own and stays, so the schema doesn't have to be migrated
 * again. Tables are looked up rather than listed, so new ones are covered.
 */
async function emptyDatabase(db: Database): Promise<void> {
  const { rows } = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );

  if (rows.length === 0) {
    return;
  }

  const tables = rows.map(({ tablename }) => `"public"."${tablename}"`);
  await db.execute(sql.raw(`truncate ${tables.join(', ')} cascade`));
}
