import { inject } from 'vitest';

/*
 * Runs before each e2e test file is imported, because the ConfigModule
 * validates the environment as soon as the AppModule is loaded.
 */
process.env.DATABASE_URL = inject('databaseUrl');
