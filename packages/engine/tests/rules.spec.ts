import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RULES,
  type Outcome,
  type TableRules,
  payout,
} from '../src/rules.js';

describe('payout', () => {
  it.each<[Outcome, number, number]>([
    ['lose', 10, 0],
    ['push', 10, 10],
    ['win', 10, 20],
    ['blackjack', 10, 25],
    ['blackjack', 15, 37],
    ['blackjack', 1, 2],
  ])('%s on %i returns %i', (outcome, stake, expected) => {
    expect(payout(outcome, stake, DEFAULT_RULES)).toBe(expected);
  });

  it.each<[TableRules['blackjackPayout'], number]>([
    [[2, 1], 30],
    [[6, 5], 22],
    [[1, 1], 20],
  ])('pays blackjack at %j', (blackjackPayout, expected) => {
    const rules = { ...DEFAULT_RULES, blackjackPayout };

    expect(payout('blackjack', 10, rules)).toBe(expected);
  });

  it.each([0, -10, 1.5, Number.NaN])('rejects stake %s', (stake) => {
    expect(() => payout('win', stake, DEFAULT_RULES)).toThrow(RangeError);
  });
});
