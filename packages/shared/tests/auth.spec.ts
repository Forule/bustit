import { describe, expect, it } from 'vitest';
import {
  loginRequestSchema,
  passwordSchema,
  usernameSchema,
} from '../src/auth.js';

describe('usernameSchema', () => {
  it('normalizes to trimmed lower case', () => {
    expect(usernameSchema.parse('  Max_Power1 ')).toBe('max_power1');
  });

  it.each(['ab', 'a'.repeat(21), 'max power', 'max-power', 'mäx'])(
    'rejects %j',
    (username) => {
      expect(usernameSchema.safeParse(username).success).toBe(false);
    },
  );
});

describe('passwordSchema', () => {
  it('accepts 10 to 256 characters', () => {
    expect(passwordSchema.safeParse('a'.repeat(10)).success).toBe(true);
    expect(passwordSchema.safeParse('a'.repeat(256)).success).toBe(true);
  });

  it.each([9, 257])('rejects %i characters', (length) => {
    expect(passwordSchema.safeParse('a'.repeat(length)).success).toBe(false);
  });
});

describe('loginRequestSchema', () => {
  it('normalizes the username without validating it', () => {
    expect(
      loginRequestSchema.parse({ username: ' A b ', password: 'x' }),
    ).toEqual({ username: 'a b', password: 'x' });
  });

  it('rejects a missing password', () => {
    expect(loginRequestSchema.safeParse({ username: 'admin' }).success).toBe(
      false,
    );
  });
});
