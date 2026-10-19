import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/**
 * Starts one throwaway Postgres for the whole e2e run and brings it to the
 * latest schema with the committed migrations.
 */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:18-alpine').start();
  const databaseUrl = container.getConnectionUri();
  const db = drizzle(databaseUrl);

  await migrate(db, { migrationsFolder: './drizzle' });
  await db.$client.end();

  project.provide('databaseUrl', databaseUrl);

  return async () => {
    await container.stop();
  };
}
