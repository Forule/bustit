export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'] as const;

export type Suit = (typeof SUITS)[number];

/*
 * Face cards stay distinct ranks even though they share a value, because side
 * bets such as perfect pairs tell them apart.
 */
export const RANKS = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
] as const;

export type Rank = (typeof RANKS)[number];

export type Card = {
  readonly rank: Rank;
  readonly suit: Suit;
};

/**
 * Returns the value of a card, counting an ace as 1. Whether an ace counts as
 * 11 depends on the rest of the hand, see `evaluateHand`.
 */
export function cardValue(card: Card): number {
  switch (card.rank) {
    case 'A':
      return 1;
    case 'J':
    case 'Q':
    case 'K':
      return 10;
    default:
      return Number(card.rank);
  }
}

/** Returns the 52 cards of a single deck in a fixed order. */
export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}
