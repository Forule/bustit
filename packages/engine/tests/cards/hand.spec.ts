import { describe, expect, it } from 'vitest';
import type { Card, Rank } from '../../src/cards/card.js';
import { evaluateHand, isBlackjack } from '../../src/cards/hand.js';

function hand(...ranks: Rank[]): Card[] {
  return ranks.map((rank) => ({ rank, suit: 'spades' }));
}

describe('evaluateHand', () => {
  it.each<[Rank[], number, boolean, boolean]>([
    [[], 0, false, false],
    [['2', '3'], 5, false, false],
    [['10', 'K'], 20, false, false],
    [['J', 'Q', '2'], 22, false, true],
    [['A', '6'], 17, true, false],
    [['A', 'K'], 21, true, false],
    [['A', '6', '10'], 17, false, false],
    [['A', 'A'], 12, true, false],
    [['A', 'A', '9'], 21, true, false],
    [['A', 'A', 'K'], 12, false, false],
    [['A', 'A', 'A', 'A', '7'], 21, true, false],
    [['A', '5', '5', 'K'], 21, false, false],
    [['9', '7', 'A', '5'], 22, false, true],
  ])('%j is %i (soft: %s, bust: %s)', (ranks, total, soft, bust) => {
    expect(evaluateHand(hand(...ranks))).toEqual({ total, soft, bust });
  });
});

describe('isBlackjack', () => {
  it.each<Rank>(['10', 'J', 'Q', 'K'])('accepts an ace with %s', (rank) => {
    expect(isBlackjack(hand('A', rank))).toBe(true);
    expect(isBlackjack(hand(rank, 'A'))).toBe(true);
  });

  it('rejects 21 with more than two cards', () => {
    expect(isBlackjack(hand('7', '7', '7'))).toBe(false);
    expect(isBlackjack(hand('A', '5', '5'))).toBe(false);
  });

  it('rejects two cards below 21', () => {
    expect(isBlackjack(hand('A', '9'))).toBe(false);
  });
});
