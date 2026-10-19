import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './infrastructure/config/index.js';
import { HealthModule } from './infrastructure/health/index.js';
import { LoggingModule } from './infrastructure/logging/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env',
      ],
      validate: validateEnv,
    }),
    LoggingModule,
    HealthModule,
  ],
})
export class AppModule {}
