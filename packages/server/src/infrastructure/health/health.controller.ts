import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import type { HealthResponse } from '@bustit/shared';
import { sql } from 'drizzle-orm';
import type { Database } from '../database/index.js';

/**
 * Reports the server as healthy only while it can reach the database, since
 * it can't serve anything without it.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@InjectDrizzle() private readonly db: Database) {}

  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.db.execute(sql`select 1`);
    } catch (error) {
      this.logger.error('Database is not reachable', error);
      throw new ServiceUnavailableException();
    }

    return { status: 'ok' };
  }
}
