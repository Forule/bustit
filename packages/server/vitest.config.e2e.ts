import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.e2e-spec.ts'],
    globalSetup: ['tests/setup/postgres.global.ts'],
    setupFiles: ['tests/setup/postgres.env.ts'],
    // Pulling the Postgres image on the first run can take a while.
    hookTimeout: 120_000,
  },
});
