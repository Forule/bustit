import { describe, expect, it } from 'vitest';
import { applyAction } from '../../src/round/apply.js';
import { act, context, play, ranks, start } from './helpers.js';

const twoSeats = {
  seats: [
    ['10', '6'],
    ['9', '8'],
  ],
  dealer: ['7', '10'],
} as const;

describe('applyAction', () => {
  it('rejects an action from a seat whose turn it is not', () => {
    const { round } = start(twoSeats);
    const result = applyAction(round, { seat: 1, type: 'stand' }, context);

    expect(!result.ok && result.error.code).toBe('NOT_YOUR_TURN');
  });

  it('rejects any action once the round is settled', () => {
    const { round } = start({ seats: [['10', '7']], dealer: ['A', 'K'] });
    const result = applyAction(round, { seat: 0, type: 'hit' }, context);

    expect(!result.ok && result.error.code).toBe('ROUND_FINISHED');
  });

  it('leaves the given round untouched', () => {
    const { round } = start({ ...twoSeats, draws: ['2'] });
    const before = structuredClone(round);

    act(round, 'hit');

    expect(round).toEqual(before);
  });

  describe('hit', () => {
    it('adds a card and keeps the turn', () => {
      const { round, events } = act(
        start({ ...twoSeats, draws: ['2'] }).round,
        'hit',
      );

      expect(ranks(round.seats[0]!.hands[0]!.cards)).toEqual(['10', '6', '2']);
      expect(round.turn).toEqual({ seat: 0, hand: 0 });
      expect(events).toEqual([
        {
          type: 'playerCard',
          seat: 0,
          hand: 0,
          card: { rank: '2', suit: 'spades' },
        },
      ]);
    });

    it('finishes a busted hand and moves on', () => {
      const { round, events } = act(
        start({ ...twoSeats, draws: ['K'] }).round,
        'hit',
      );

      expect(round.seats[0]!.hands[0]!.status).toBe('bust');
      expect(round.turn).toEqual({ seat: 1, hand: 0 });
      expect(events.map(({ type }) => type)).toEqual([
        'playerCard',
        'handFinished',
        'turn',
      ]);
    });

    it('stands automatically on 21', () => {
      const { round } = act(start({ ...twoSeats, draws: ['5'] }).round, 'hit');

      expect(round.seats[0]!.hands[0]!.status).toBe('stood');
      expect(round.turn).toEqual({ seat: 1, hand: 0 });
    });
  });

  describe('stand', () => {
    it('finishes the hand and moves on', () => {
      const { round } = act(start(twoSeats).round, 'stand');

      expect(round.seats[0]!.hands[0]!.status).toBe('stood');
      expect(round.turn).toEqual({ seat: 1, hand: 0 });
    });
  });

  describe('double', () => {
    it('doubles the stake for exactly one card', () => {
      const { round, events } = act(
        start({ ...twoSeats, draws: ['3'] }).round,
        'double',
      );
      const hand = round.seats[0]!.hands[0]!;

      expect(hand).toMatchObject({ stake: 20, doubled: true, status: 'stood' });
      expect(ranks(hand.cards)).toEqual(['10', '6', '3']);
      expect(round.turn).toEqual({ seat: 1, hand: 0 });
      expect(events.map(({ type }) => type)).toEqual([
        'double',
        'playerCard',
        'handFinished',
        'turn',
      ]);
    });

    it('can bust', () => {
      const { round } = act(
        start({ ...twoSeats, draws: ['K'] }).round,
        'double',
      );

      expect(round.seats[0]!.hands[0]!).toMatchObject({
        stake: 20,
        status: 'bust',
      });
    });

    it('is not allowed after a hit', () => {
      const { round } = act(start({ ...twoSeats, draws: ['2'] }).round, 'hit');
      const result = applyAction(round, { seat: 0, type: 'double' }, context);

      expect(!result.ok && result.error.code).toBe('ACTION_NOT_ALLOWED');
    });
  });

  it('plays the dealer and settles after the last hand', () => {
    const { round, events } = play(start(twoSeats).round, 'stand', 'stand');

    expect(round.phase).toBe('settled');
    expect(round.turn).toBeNull();
    expect(events.map(({ type }) => type).slice(-2)).toEqual([
      'holeCardRevealed',
      'settled',
    ]);
    expect(round.results).toEqual([
      { seat: 0, hand: 0, outcome: 'lose', stake: 10, payout: 0 },
      { seat: 1, hand: 0, outcome: 'push', stake: 10, payout: 10 },
    ]);
  });
});
