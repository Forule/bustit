import { ServiceUnavailableException } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from '../../../src/infrastructure/health/health.controller.js';

describe('HealthController', () => {
  const db = { execute: vi.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    db.execute.mockReset();

    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: getDrizzleToken(), useValue: db }],
    }).compile();

    module.useLogger(false);
    controller = module.get(HealthController);
  });

  it('reports ok while the database is reachable', async () => {
    db.execute.mockResolvedValue({ rows: [] });

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });

  it('reports unavailable when the database is not reachable', async () => {
    db.execute.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
