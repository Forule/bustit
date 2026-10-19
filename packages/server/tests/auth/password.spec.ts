import argon2 from 'argon2';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '../../src/auth/password.js';

describe('hashPassword', () => {
  it('hashes with argon2id', async () => {
    const hash = await hashPassword('correct horse battery');

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(argon2.verify(hash, 'correct horse battery')).resolves.toBe(
      true,
    );
    await expect(argon2.verify(hash, 'wrong password')).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    const [first, second] = await Promise.all([
      hashPassword('same password'),
      hashPassword('same password'),
    ]);

    expect(first).not.toBe(second);
  });
});
