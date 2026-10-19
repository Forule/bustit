import { describe, expect, it } from 'vitest';
import { applyAction } from '../../src/round/apply.js';
import { MAX_HANDS_PER_SEAT } from '../../src/rules.js';
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

  describe('split', () => {
    it('moves the second card to a new hand and deals the first one', () => {
      const { round, events } = act(
        start({ seats: [['8', '8']], dealer: ['7', '10'], draws: ['3'] }).round,
        'split',
      );
      const [first, second] = round.seats[0]!.hands;

      expect(ranks(first!.cards)).toEqual(['8', '3']);
      expect(ranks(second!.cards)).toEqual(['8']);
      expect(second).toMatchObject({ stake: 10, status: 'playing' });
      expect(round.turn).toEqual({ seat: 0, hand: 0 });
      expect(events.map(({ type }) => type)).toEqual(['split', 'playerCard']);
      expect(events[0]).toEqual({
        type: 'split',
        seat: 0,
        hand: 0,
        newHand: 1,
        stake: 10,
      });
    });

    it('deals the new hand its second card once it is its turn', () => {
      const { round, events } = play(
        start({ seats: [['8', '8']], dealer: ['7', '10'], draws: ['3', '2'] })
          .round,
        'split',
        'stand',
      );

      expect(ranks(round.seats[0]!.hands[1]!.cards)).toEqual(['8', '2']);
      expect(round.turn).toEqual({ seat: 0, hand: 1 });
      expect(events.map(({ type }) => type).slice(-3)).toEqual([
        'handFinished',
        'turn',
        'playerCard',
      ]);
    });

    it('splits a king and a ten', () => {
      const { round } = act(
        start({ seats: [['K', '10']], dealer: ['7', '10'], draws: ['3'] })
          .round,
        'split',
      );

      expect(round.seats[0]!.hands).toHaveLength(2);
    });

    it('rejects two cards of different value', () => {
      const { round } = start({ seats: [['10', '9']], dealer: ['7', '10'] });
      const result = applyAction(round, { seat: 0, type: 'split' }, context);

      expect(!result.ok && result.error.code).toBe('ACTION_NOT_ALLOWED');
    });

    it('rejects a hand with more than two cards', () => {
      const { round } = act(
        start({ seats: [['4', '4']], dealer: ['7', '10'], draws: ['2'] }).round,
        'hit',
      );
      const result = applyAction(round, { seat: 0, type: 'split' }, context);

      expect(!result.ok && result.error.code).toBe('ACTION_NOT_ALLOWED');
    });

    it('appends resplit hands and plays them in index order', () => {
      const { round } = play(
        start({
          seats: [['8', '8']],
          dealer: ['7', '10'],
          draws: ['8', '3', '2', '4'],
        }).round,
        'split',
        'split',
        'stand',
      );

      expect(round.seats[0]!.hands.map(({ cards }) => ranks(cards))).toEqual([
        ['8', '3'],
        ['8', '2'],
        ['8'],
      ]);
      expect(round.turn).toEqual({ seat: 0, hand: 1 });
    });

    it(`allows at most ${MAX_HANDS_PER_SEAT} hands per seat`, () => {
      const { round } = play(
        start({
          seats: [['8', '8']],
          dealer: ['7', '10'],
          draws: ['8', '8', '8'],
        }).round,
        'split',
        'split',
        'split',
      );

      expect(round.seats[0]!.hands).toHaveLength(MAX_HANDS_PER_SEAT);
      expect(ranks(round.seats[0]!.hands[0]!.cards)).toEqual(['8', '8']);

      const result = applyAction(round, { seat: 0, type: 'split' }, context);

      expect(!result.ok && result.error.code).toBe('ACTION_NOT_ALLOWED');
    });

    it('allows a double after a split', () => {
      const { round } = play(
        start({ seats: [['5', '5']], dealer: ['7', '10'], draws: ['6', '9'] })
          .round,
        'split',
        'double',
      );

      expect(round.seats[0]!.hands[0]!).toMatchObject({
        stake: 20,
        doubled: true,
        status: 'stood',
      });
    });

    it('stands automatically when a split hand reaches 21', () => {
      const { round } = act(
        start({
          seats: [
            ['10', '10'],
            ['9', '8'],
          ],
          dealer: ['7', '10'],
          draws: ['A', 'A'],
        }).round,
        'split',
      );

      expect(round.seats[0]!.hands.map(({ status }) => status)).toEqual([
        'stood',
        'stood',
      ]);
      expect(round.turn).toEqual({ seat: 1, hand: 0 });
    });

    describe('aces', () => {
      it('get one card each and finish both hands', () => {
        const { round } = act(
          start({
            seats: [
              ['A', 'A'],
              ['9', '8'],
            ],
            dealer: ['7', '10'],
            draws: ['5', 'A'],
          }).round,
          'split',
        );
        const hands = round.seats[0]!.hands;

        expect(hands.map(({ cards }) => ranks(cards))).toEqual([
          ['A', '5'],
          ['A', 'A'],
        ]);
        expect(hands.map(({ status }) => status)).toEqual(['stood', 'stood']);
        expect(round.turn).toEqual({ seat: 1, hand: 0 });
      });

      it('pay a 21 as a win, not as a blackjack', () => {
        const { round } = act(
          start({ seats: [['A', 'A']], dealer: ['7', '10'], draws: ['K', '5'] })
            .round,
          'split',
        );

        expect(round.phase).toBe('settled');
        expect(round.results[0]).toEqual({
          seat: 0,
          hand: 0,
          outcome: 'win',
          stake: 10,
          payout: 20,
        });
      });
    });

    it('settles every hand on its own', () => {
      const { round } = play(
        start({
          seats: [['9', '9']],
          dealer: ['7', '10'],
          draws: ['10', 'K', 'Q'],
        }).round,
        'split',
        'stand',
        'hit',
      );

      expect(round.results).toEqual([
        { seat: 0, hand: 0, outcome: 'win', stake: 10, payout: 20 },
        { seat: 0, hand: 1, outcome: 'lose', stake: 10, payout: 0 },
      ]);
    });
  });
});
