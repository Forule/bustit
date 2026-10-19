import { DrizzleModule } from '@nestjs/drizzle';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Env } from '../config/index.js';

/**
 * Connects to Postgres through a connection pool that is closed on shutdown.
 * The database is injected with `@InjectDrizzle()` anywhere in the app.
 */
@Module({
  imports: [
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        drizzle,
        connection: configService.get('DATABASE_URL', { infer: true }),
        // Tables are declared in camelCase and stored in snake_case.
        casing: 'snake_case' as const,
      }),
    }),
  ],
})
export class DatabaseModule {}
