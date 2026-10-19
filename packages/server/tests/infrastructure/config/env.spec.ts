import { describe, expect, it } from 'vitest';
import { validateEnv } from '../../../src/infrastructure/config/env.js';

const required = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://user:password@localhost:5432/bustit',
};

describe('validateEnv', () => {
  it('fills in defaults', () => {
    expect(validateEnv(required)).toEqual({
      ...required,
      PORT: 8080,
      LOG_LEVEL: 'info',
      LOG_DIR: './logs',
      STARTING_BALANCE: 1000,
    });
  });

  it('reads numbers from strings', () => {
    expect(
      validateEnv({ ...required, PORT: '3001', STARTING_BALANCE: '2500' }),
    ).toMatchObject({ PORT: 3001, STARTING_BALANCE: 2500 });
  });

  it.each([
    ['a missing database url', { NODE_ENV: 'test' }],
    [
      'a database url of another protocol',
      { ...required, DATABASE_URL: 'mysql://localhost/bustit' },
    ],
    ['a negative starting balance', { ...required, STARTING_BALANCE: '-5' }],
    ['a fractional starting balance', { ...required, STARTING_BALANCE: '1.5' }],
    ['an unknown log level', { ...required, LOG_LEVEL: 'trace' }],
  ])('rejects %s', (_, env) => {
    expect(() => validateEnv(env)).toThrow('Invalid environment configuration');
  });
});
