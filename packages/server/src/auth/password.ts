import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

let dummyHash: Promise<string> | undefined;

/**
 * Takes as long as checking a real password. Running it for unknown users
 * keeps the response time from revealing which usernames exist.
 */
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(32).toString('hex'));
  await verifyPassword(await dummyHash, password);
  return false;
}
