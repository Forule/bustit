import { describe, expect, it } from 'vitest';
import { act, play, ranks, start } from './helpers.js';

describe('dealer play', () => {
  it('draws to 17', () => {
    const { round } = act(
      start({ seats: [['10', '7']], dealer: ['5', '6'], draws: ['3', '4'] })
        .round,
      'stand',
    );

    expect(ranks(round.dealer.cards)).toEqual(['5', '6', '3', '4']);
    expect(round.results[0]).toMatchObject({ outcome: 'lose' });
  });

  it('stands on soft 17 by default', () => {
    const { round } = act(
      start({ seats: [['10', '7']], dealer: ['A', '6'], draws: ['4'] }).round,
      'stand',
    );

    expect(ranks(round.dealer.cards)).toEqual(['A', '6']);
    expect(round.results[0]).toMatchObject({ outcome: 'push' });
  });

  it('hits soft 17 when the rules say so', () => {
    const { round } = act(
      start(
        { seats: [['10', '7']], dealer: ['A', '6'], draws: ['4'] },
        { dealerHitsSoft17: true },
      ).round,
      'stand',
    );

    expect(ranks(round.dealer.cards)).toEqual(['A', '6', '4']);
    expect(round.results[0]).toMatchObject({ outcome: 'lose' });
  });

  it('does not draw when every hand is bust', () => {
    const { round } = act(
      start({ seats: [['10', '6']], dealer: ['5', '6'], draws: ['K'] }).round,
      'hit',
    );

    expect(ranks(round.dealer.cards)).toEqual(['5', '6']);
    expect(round.results).toEqual([
      { seat: 0, hand: 0, outcome: 'lose', stake: 10, payout: 0 },
    ]);
  });

  it('starts a fresh shoe when the cards run out mid-round', () => {
    const { round, events } = act(
      start({ seats: [['10', '6']], dealer: ['7', '10'] }).round,
      'hit',
    );

    expect(events[0]).toEqual({ type: 'shuffle' });
    expect(round.seats[0]!.hands[0]!.cards).toHaveLength(3);
    expect(round.shoe.cards).toHaveLength(312);
  });
});

describe('settlement', () => {
  it('pays standing hands when the dealer busts', () => {
    const { round } = play(
      start({
        seats: [
          ['10', '2'],
          ['10', '6'],
        ],
        dealer: ['6', '10'],
        draws: ['K', 'K'],
      }).round,
      'hit',
      'stand',
    );

    expect(round.results).toEqual([
      { seat: 0, hand: 0, outcome: 'lose', stake: 10, payout: 0 },
      { seat: 1, hand: 0, outcome: 'win', stake: 10, payout: 20 },
    ]);
  });

  it('compares totals', () => {
    const { round } = play(
      start({
        seats: [
          ['10', '9'],
          ['10', '8'],
          ['10', '7'],
        ],
        dealer: ['10', '8'],
      }).round,
      'stand',
      'stand',
      'stand',
    );

    expect(round.results.map(({ outcome }) => outcome)).toEqual([
      'win',
      'push',
      'lose',
    ]);
  });

  it('pays the doubled stake', () => {
    const { round } = play(
      start({ seats: [['6', '5']], dealer: ['10', '7'], draws: ['10'] }).round,
      'double',
    );

    expect(round.results[0]).toEqual({
      seat: 0,
      hand: 0,
      outcome: 'win',
      stake: 20,
      payout: 40,
    });
  });

  it('rounds a fractional blackjack win down', () => {
    const { round } = start(
      { seats: [['A', 'K']], dealer: ['6', '10'] },
      {},
      [15],
    );

    expect(round.results[0]).toMatchObject({
      outcome: 'blackjack',
      payout: 37,
    });
  });

  describe('without a hole card', () => {
    it('takes every split hand to a dealer blackjack', () => {
      const { round } = play(
        start(
          { seats: [['8', '8']], dealer: ['A'], draws: ['3', '2', 'K'] },
          { holeCard: 'none' },
        ).round,
        'split',
        'stand',
        'stand',
      );

      expect(ranks(round.dealer.cards)).toEqual(['A', 'K']);
      expect(round.results).toEqual([
        { seat: 0, hand: 0, outcome: 'lose', stake: 10, payout: 0 },
        { seat: 0, hand: 1, outcome: 'lose', stake: 10, payout: 0 },
      ]);
    });

    it('takes doubled stakes to a dealer blackjack', () => {
      const { round, events } = play(
        start(
          { seats: [['6', '5']], dealer: ['A'], draws: ['9', 'K'] },
          { holeCard: 'none' },
        ).round,
        'double',
      );

      expect(ranks(round.dealer.cards)).toEqual(['A', 'K']);
      expect(events.map(({ type }) => type)).not.toContain('holeCardRevealed');
      expect(round.results[0]).toEqual({
        seat: 0,
        hand: 0,
        outcome: 'lose',
        stake: 20,
        payout: 0,
      });
    });

    it('pushes a player blackjack against a dealer blackjack', () => {
      const { round } = start(
        { seats: [['A', 'K']], dealer: ['A'], draws: ['Q'] },
        { holeCard: 'none' },
      );

      expect(round.phase).toBe('settled');
      expect(ranks(round.dealer.cards)).toEqual(['A', 'Q']);
      expect(round.results[0]).toMatchObject({ outcome: 'push', payout: 10 });
    });
  });
});
