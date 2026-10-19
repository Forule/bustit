import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.e2e-spec.ts'],
    globalSetup: ['tests/setup/postgres.global.ts'],
    setupFiles: ['tests/setup/postgres.env.ts'],
    /*
     * All test files share one database, and every file starts by emptying
     * it. Running them one after another keeps files from changing data
     * another one relies on. Tests for concurrency start concurrent calls
     * themselves.
     */
    fileParallelism: false,
    // Pulling the Postgres image on the first run can take a while.
    hookTimeout: 120_000,
  },
});
