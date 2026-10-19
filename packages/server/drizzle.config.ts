import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';

/*
 * drizzle-kit runs outside of Nest, so it loads the same env files as the
 * ConfigModule itself. A loaded file never overrides a variable that is
 * already set, so the first file to set a variable wins, as in the app.
 */
const nodeEnv = process.env.NODE_ENV ?? 'development';

for (const file of [
  `.env.${nodeEnv}.local`,
  `.env.${nodeEnv}`,
  '.env.local',
  '.env',
]) {
  if (existsSync(file)) {
    loadEnvFile(file);
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  dialect: 'postgresql',
  // Each feature module declares its own tables next to its code.
  schema: './src/**/*.schema.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
