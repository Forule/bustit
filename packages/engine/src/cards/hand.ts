import { type Card, cardValue } from './card.js';

export const BLACKJACK = 21;

/*
 * Counting a second ace as 11 would always exceed 21, so at most one ace is
 * ever promoted from 1 to 11.
 */
const ACE_BONUS = 10;

export type HandValue = {
  readonly total: number;
  /** An ace is counted as 11, so the hand can't bust on the next card. */
  readonly soft: boolean;
  readonly bust: boolean;
};

export function evaluateHand(cards: readonly Card[]): HandValue {
  const hardTotal = cards.reduce((sum, card) => sum + cardValue(card), 0);
  const hasAce = cards.some((card) => card.rank === 'A');
  const soft = hasAce && hardTotal + ACE_BONUS <= BLACKJACK;
  const total = soft ? hardTotal + ACE_BONUS : hardTotal;

  return { total, soft, bust: total > BLACKJACK };
}

/**
 * Checks for a natural: 21 with the first two cards. A two-card 21 on a hand
 * created by a split is not a blackjack, which only the round knows about.
 */
export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && evaluateHand(cards).total === BLACKJACK;
}
