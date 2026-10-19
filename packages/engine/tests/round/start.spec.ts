import { describe, expect, it } from 'vitest';
import { createShoe } from '../../src/cards/index.js';
import { startRound } from '../../src/round/start.js';
import type { Bet } from '../../src/round/types.js';
import { DEFAULT_RULES } from '../../src/rules.js';
import { context, play, ranks, stackedShoe, start, unwrap } from './helpers.js';

describe('startRound', () => {
  it('deals in casino order and hands the turn to the first seat', () => {
    const { round, events } = start({
      seats: [
        ['10', '7'],
        ['9', '8'],
      ],
      dealer: ['6', 'K'],
    });

    expect(round.phase).toBe('playerTurns');
    expect(round.seats.map(({ hands }) => ranks(hands[0]!.cards))).toEqual([
      ['10', '7'],
      ['9', '8'],
    ]);
    expect(ranks(round.dealer.cards)).toEqual(['6', 'K']);
    expect(round.dealer.holeCardHidden).toBe(true);
    expect(round.turn).toEqual({ seat: 0, hand: 0 });
    expect(events.map(({ type }) => type)).toEqual([
      'playerCard',
      'playerCard',
      'dealerCard',
      'playerCard',
      'playerCard',
      'holeCard',
      'turn',
    ]);
  });

  it('never puts the hidden hole card into an event', () => {
    const { events } = start({ seats: [['10', '7']], dealer: ['6', 'K'] });

    expect(events).toContainEqual({ type: 'holeCard' });
    expect(
      events.some((event) => 'card' in event && event.card.rank === 'K'),
    ).toBe(false);
  });

  it('orders seats ascending regardless of the order of the bets', () => {
    const bets: Bet[] = [
      { seat: 4, stake: 20 },
      { seat: 1, stake: 10 },
    ];
    const { round } = unwrap(
      startRound(
        {
          rules: DEFAULT_RULES,
          shoe: stackedShoe({
            seats: [
              ['10', '7'],
              ['9', '8'],
            ],
            dealer: ['6', 'K'],
          }),
          bets,
        },
        context,
      ),
    );

    expect(round.seats.map(({ seat }) => seat)).toEqual([1, 4]);
    expect(round.seats.map(({ hands }) => hands[0]!.stake)).toEqual([10, 20]);
    expect(round.turn).toEqual({ seat: 1, hand: 0 });
  });

  it('reshuffles a shoe that reached its cut position', () => {
    const shoe = createShoe(DEFAULT_RULES, context.rng);
    const { round, events } = unwrap(
      startRound(
        {
          rules: DEFAULT_RULES,
          shoe: { ...shoe, position: shoe.cutPosition },
          bets: [{ seat: 0, stake: 10 }],
        },
        context,
      ),
    );

    expect(events[0]).toEqual({ type: 'shuffle' });
    expect(round.shoe.cards).not.toBe(shoe.cards);
    expect(round.shoe.position).toBeLessThan(10);
  });

  it.each<[string, Bet[]]>([
    ['no bets', []],
    ['a negative seat', [{ seat: -1, stake: 10 }]],
    ['a fractional seat', [{ seat: 0.5, stake: 10 }]],
    ['a zero stake', [{ seat: 0, stake: 0 }]],
    ['a fractional stake', [{ seat: 0, stake: 2.5 }]],
    [
      'two bets on one seat',
      [
        { seat: 0, stake: 10 },
        { seat: 0, stake: 20 },
      ],
    ],
  ])('rejects %s', (_, bets) => {
    const result = startRound(
      {
        rules: DEFAULT_RULES,
        shoe: createShoe(DEFAULT_RULES, context.rng),
        bets,
      },
      context,
    );

    expect(!result.ok && result.error.code).toBe('INVALID_BETS');
  });

  describe('player blackjack', () => {
    it('is skipped between seats that play', () => {
      const { round, events } = play(
        start({
          seats: [
            ['10', '6'],
            ['A', 'K'],
            ['9', '8'],
          ],
          dealer: ['7', '10'],
          draws: ['2'],
        }).round,
        'hit',
        'stand',
        'stand',
      );

      expect(events.filter(({ type }) => type === 'turn')).toEqual([
        { type: 'turn', seat: 2, hand: 0 },
      ]);
      expect(round.results).toEqual([
        { seat: 0, hand: 0, outcome: 'win', stake: 10, payout: 20 },
        { seat: 1, hand: 0, outcome: 'blackjack', stake: 10, payout: 25 },
        { seat: 2, hand: 0, outcome: 'push', stake: 10, payout: 10 },
      ]);
    });

    it('finishes the hand right away and moves on to the next seat', () => {
      const { round, events } = start({
        seats: [
          ['A', 'K'],
          ['9', '8'],
        ],
        dealer: ['6', '10'],
      });

      expect(round.seats[0]!.hands[0]!.status).toBe('blackjack');
      expect(round.turn).toEqual({ seat: 1, hand: 0 });
      expect(events).toContainEqual({
        type: 'handFinished',
        seat: 0,
        hand: 0,
        status: 'blackjack',
      });
    });

    it('settles at once when every seat has a blackjack', () => {
      const { round, events } = start({
        seats: [['A', 'K']],
        dealer: ['6', '10'],
      });

      expect(round.phase).toBe('settled');
      expect(ranks(round.dealer.cards)).toEqual(['6', '10']);
      expect(events).toContainEqual({
        type: 'holeCardRevealed',
        card: { rank: '10', suit: 'spades' },
      });
      expect(round.results).toEqual([
        { seat: 0, hand: 0, outcome: 'blackjack', stake: 10, payout: 25 },
      ]);
    });
  });

  describe('peek', () => {
    it('settles at once when the dealer has a blackjack', () => {
      const { round, events } = start({
        seats: [
          ['10', '7'],
          ['A', 'Q'],
        ],
        dealer: ['A', 'K'],
      });

      expect(round.phase).toBe('settled');
      expect(round.turn).toBeNull();
      expect(round.dealer.holeCardHidden).toBe(false);
      expect(events.map(({ type }) => type)).not.toContain('turn');
      expect(round.results).toEqual([
        { seat: 0, hand: 0, outcome: 'lose', stake: 10, payout: 0 },
        { seat: 1, hand: 0, outcome: 'push', stake: 10, payout: 10 },
      ]);
    });

    it('peeks under a ten as well', () => {
      const { round } = start({ seats: [['10', '7']], dealer: ['Q', 'A'] });

      expect(round.phase).toBe('settled');
    });

    it('keeps the hole card hidden when the dealer has no blackjack', () => {
      const { round, events } = start({
        seats: [['10', '7']],
        dealer: ['A', '9'],
      });

      expect(round.phase).toBe('playerTurns');
      expect(round.dealer.holeCardHidden).toBe(true);
      expect(events.map(({ type }) => type)).not.toContain('holeCardRevealed');
    });
  });

  describe('no hole card', () => {
    it('deals the dealer a single card', () => {
      const { round, events } = start(
        { seats: [['10', '7']], dealer: ['A'] },
        { holeCard: 'none' },
      );

      expect(ranks(round.dealer.cards)).toEqual(['A']);
      expect(round.dealer.holeCardHidden).toBe(false);
      expect(events.map(({ type }) => type)).not.toContain('holeCard');
      expect(round.turn).toEqual({ seat: 0, hand: 0 });
    });
  });
});
