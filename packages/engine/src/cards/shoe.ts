import type { Rng } from '../rng.js';
import { type Card, createDeck } from './card.js';

/**
 * The shuffled cards of all decks in play. The cards never change after the
 * shuffle; drawing only advances `position`, so a draw doesn't copy the
 * whole shoe.
 */
export type Shoe = {
  readonly cards: readonly Card[];
  /** Index of the next card to draw. */
  readonly position: number;
  /** Once `position` reaches this index, the shoe is due for a reshuffle. */
  readonly cutPosition: number;
};

export type ShoeOptions = {
  readonly decks: number;
  /** Share of the shoe dealt before reshuffling, in `(0, 1]`. */
  readonly penetration: number;
};

export function createShoe(options: ShoeOptions, rng: Rng): Shoe {
  const { decks, penetration } = options;

  if (!Number.isInteger(decks) || decks < 1) {
    throw new RangeError(`decks must be a positive integer, got ${decks}`);
  }

  if (!(penetration > 0 && penetration <= 1)) {
    throw new RangeError(`penetration must be in (0, 1], got ${penetration}`);
  }

  const cards = shuffle(
    Array.from({ length: decks }, () => createDeck()).flat(),
    rng,
  );

  return {
    cards,
    position: 0,
    cutPosition: Math.floor(cards.length * penetration),
  };
}

export function draw(shoe: Shoe): { card: Card; shoe: Shoe } {
  const card = shoe.cards[shoe.position];

  if (!card) {
    throw new RangeError('Cannot draw from an empty shoe');
  }

  return { card, shoe: { ...shoe, position: shoe.position + 1 } };
}

export function cardsRemaining(shoe: Shoe): number {
  return shoe.cards.length - shoe.position;
}

/** Reshuffling is only decided between rounds, never in the middle of one. */
export function needsReshuffle(shoe: Shoe): boolean {
  return shoe.position >= shoe.cutPosition;
}

/** Fisher-Yates shuffle, in place on the array it is given. */
function shuffle(cards: Card[], rng: Rng): Card[] {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }

  return cards;
}
