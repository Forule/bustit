import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/** Starts one throwaway Postgres for the whole e2e run. */
export default async function setup(project: TestProject) {
  const container = await new PostgreSqlContainer('postgres:18-alpine').start();

  project.provide('databaseUrl', container.getConnectionUri());

  return async () => {
    await container.stop();
  };
}
