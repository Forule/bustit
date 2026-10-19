import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../src/rng.js';
import { type Card, createDeck } from '../../src/cards/card.js';
import {
  cardsRemaining,
  createShoe,
  draw,
  needsReshuffle,
} from '../../src/cards/shoe.js';

const key = (card: Card) => `${card.rank}-${card.suit}`;

describe('createShoe', () => {
  it('contains every card once per deck', () => {
    const shoe = createShoe(
      { decks: 6, penetration: 0.75 },
      createSeededRng('a'),
    );

    expect(shoe.cards).toHaveLength(312);

    const counts = new Map<string, number>();
    for (const card of shoe.cards) {
      counts.set(key(card), (counts.get(key(card)) ?? 0) + 1);
    }

    expect(counts.size).toBe(52);
    expect([...counts.values()].every((count) => count === 6)).toBe(true);
  });

  it('shuffles the cards', () => {
    const shoe = createShoe({ decks: 1, penetration: 1 }, createSeededRng('a'));

    expect(shoe.cards.map(key)).not.toEqual(createDeck().map(key));
  });

  it('shuffles the same way for the same seed', () => {
    const options = { decks: 6, penetration: 0.75 };

    expect(createShoe(options, createSeededRng('seed')).cards).toEqual(
      createShoe(options, createSeededRng('seed')).cards,
    );
    expect(createShoe(options, createSeededRng('seed')).cards).not.toEqual(
      createShoe(options, createSeededRng('other')).cards,
    );
  });

  it('places the cut at the penetration', () => {
    const shoe = createShoe(
      { decks: 6, penetration: 0.75 },
      createSeededRng('a'),
    );

    expect(shoe.position).toBe(0);
    expect(shoe.cutPosition).toBe(234);
  });

  it.each([0, -1, 1.5])('rejects %s decks', (decks) => {
    expect(() =>
      createShoe({ decks, penetration: 0.75 }, createSeededRng('a')),
    ).toThrow(RangeError);
  });

  it.each([0, -0.5, 1.1, Number.NaN])(
    'rejects penetration %s',
    (penetration) => {
      expect(() =>
        createShoe({ decks: 6, penetration }, createSeededRng('a')),
      ).toThrow(RangeError);
    },
  );
});

describe('draw', () => {
  it('returns the next card and leaves the original shoe untouched', () => {
    const shoe = createShoe({ decks: 1, penetration: 1 }, createSeededRng('a'));

    const first = draw(shoe);
    const second = draw(first.shoe);

    expect(first.card).toBe(shoe.cards[0]);
    expect(second.card).toBe(shoe.cards[1]);
    expect(shoe.position).toBe(0);
    expect(second.shoe.position).toBe(2);
    expect(cardsRemaining(second.shoe)).toBe(50);
  });

  it('fails on an empty shoe', () => {
    const shoe = createShoe({ decks: 1, penetration: 1 }, createSeededRng('a'));

    expect(() => draw({ ...shoe, position: 52 })).toThrow(RangeError);
  });
});

describe('needsReshuffle', () => {
  it('is due once the cut position is reached', () => {
    const shoe = createShoe(
      { decks: 6, penetration: 0.75 },
      createSeededRng('a'),
    );

    expect(needsReshuffle({ ...shoe, position: 233 })).toBe(false);
    expect(needsReshuffle({ ...shoe, position: 234 })).toBe(true);
  });
});
