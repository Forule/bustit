import { createHash, randomInt } from 'node:crypto';

/*
 * Crockford's Base32 leaves out I, L, O and U, so a code read aloud or typed
 * from a screenshot can't be mistaken for a similar looking character.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const PREFIX = 'BJ';
const GROUPS = 3;
const GROUP_LENGTH = 4;

/**
 * Creates a code like `BJ-7KQ4-M9XP-2HTV`. The 12 random characters carry 60
 * bits, far beyond guessing for a single-use code that expires.
 */
export function generateInviteCode(): string {
  const groups = Array.from({ length: GROUPS }, () =>
    Array.from(
      { length: GROUP_LENGTH },
      () => ALPHABET[randomInt(ALPHABET.length)],
    ).join(''),
  );

  return [PREFIX, ...groups].join('-');
}

/**
 * Brings a code as typed by a user into the generated form: case, spaces,
 * dashes and the prefix don't matter, and characters Crockford's Base32
 * leaves out are read as the ones they look like.
 */
export function normalizeInviteCode(input: string): string {
  const compact = input.toUpperCase().replace(/[\s-]/g, '');
  // Only a code of full length carries the prefix; a random part may start
  // with the same letters.
  const withoutPrefix =
    compact.length === PREFIX.length + GROUPS * GROUP_LENGTH &&
    compact.startsWith(PREFIX)
      ? compact.slice(PREFIX.length)
      : compact;
  const characters = withoutPrefix.replace(/O/g, '0').replace(/[IL]/g, '1');

  const groups = characters.match(new RegExp(`.{1,${GROUP_LENGTH}}`, 'g'));

  return [PREFIX, ...(groups ?? [])].join('-');
}

/**
 * Codes are stored hashed only, like passwords. A plain hash suffices since
 * the codes are random and long; a slow hash would only slow down lookups.
 */
export function hashInviteCode(code: string): string {
  return createHash('sha256').update(normalizeInviteCode(code)).digest('hex');
}
