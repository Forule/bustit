import { describe, expect, it } from 'vitest';
import { bearerTokenOf } from '../../src/auth/bearer-token.js';

describe('bearerTokenOf', () => {
  it.each([
    ['Bearer abc.def.ghi', 'abc.def.ghi'],
    ['bearer abc.def.ghi', 'abc.def.ghi'],
    ['Bearer   abc.def.ghi', 'abc.def.ghi'],
  ])('reads the token of %j', (header, token) => {
    expect(bearerTokenOf(header)).toBe(token);
  });

  it.each([
    undefined,
    '',
    'abc.def.ghi',
    'Basic dXNlcjpwYXNz',
    'Bearer',
    'Bearer abc def',
  ])('finds no token in %j', (header) => {
    expect(bearerTokenOf(header)).toBeNull();
  });
});
