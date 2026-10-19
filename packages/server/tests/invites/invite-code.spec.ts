import { describe, expect, it } from 'vitest';
import {
  generateInviteCode,
  hashInviteCode,
  normalizeInviteCode,
} from '../../src/invites/invite-code.js';

describe('generateInviteCode', () => {
  it('creates codes like BJ-7KQ4-M9XP-2HTV', () => {
    expect(generateInviteCode()).toMatch(
      /^BJ-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/,
    );
  });

  it('creates a different code every time', () => {
    const codes = new Set(
      Array.from({ length: 1000 }, () => generateInviteCode()),
    );

    expect(codes.size).toBe(1000);
  });

  it('creates codes that are already normalized', () => {
    const code = generateInviteCode();

    expect(normalizeInviteCode(code)).toBe(code);
  });
});

describe('normalizeInviteCode', () => {
  it.each([
    ['BJ-7KQ4-M9XP-2HTV', 'BJ-7KQ4-M9XP-2HTV'],
    ['bj-7kq4-m9xp-2htv', 'BJ-7KQ4-M9XP-2HTV'],
    [' BJ 7KQ4 M9XP 2HTV ', 'BJ-7KQ4-M9XP-2HTV'],
    ['7KQ4M9XP2HTV', 'BJ-7KQ4-M9XP-2HTV'],
    ['BJ-OI1L-0000-0000', 'BJ-0111-0000-0000'],
    ['BJ12-3456-7890', 'BJ-BJ12-3456-7890'],
  ])('reads %j as %j', (input, expected) => {
    expect(normalizeInviteCode(input)).toBe(expected);
  });
});

describe('hashInviteCode', () => {
  it('hashes every spelling of a code alike', () => {
    expect(hashInviteCode('bj-7kq4-m9xp-2htv')).toBe(
      hashInviteCode('BJ-7KQ4-M9XP-2HTV'),
    );
  });

  it('produces a hex SHA-256 digest', () => {
    expect(hashInviteCode('BJ-7KQ4-M9XP-2HTV')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('tells different codes apart', () => {
    expect(hashInviteCode('BJ-7KQ4-M9XP-2HTV')).not.toBe(
      hashInviteCode('BJ-7KQ4-M9XP-2HTW'),
    );
  });
});
