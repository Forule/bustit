import {
  type Card,
  type Shoe,
  cardValue,
  createShoe,
  isBlackjack,
  needsReshuffle,
} from '../cards/index.js';
import type { TableRules } from '../rules.js';
import { type Draft, dealToDealer, dealToHand, finishHand } from './draft.js';
import { continueRound, revealHoleCard, settle } from './finish.js';
import {
  type Bet,
  type Result,
  type RoundContext,
  type RoundUpdate,
  failure,
  success,
} from './types.js';

export type StartRoundInput = {
  readonly rules: TableRules;
  /** The shoe left over from the previous round, reshuffled if due. */
  readonly shoe: Shoe;
  readonly bets: readonly Bet[];
};

/**
 * Deals a new round to every seat with a bet. Betting itself happens before,
 * so the round starts with the stakes already fixed.
 */
export function startRound(
  input: StartRoundInput,
  context: RoundContext,
): Result<RoundUpdate> {
  const { rules, shoe, bets } = input;
  const invalidBets = validateBets(bets);

  if (invalidBets) {
    return failure('INVALID_BETS', invalidBets);
  }

  const draft: Draft = {
    rules,
    rng: context.rng,
    shoe,
    seats: [...bets]
      .sort((a, b) => a.seat - b.seat)
      .map(({ seat, stake }) => ({
        seat,
        hands: [{ cards: [], stake, doubled: false, status: 'playing' }],
      })),
    dealer: { cards: [], holeCardHidden: false },
    turn: null,
    events: [],
  };

  if (needsReshuffle(shoe)) {
    draft.shoe = createShoe(rules, context.rng);
    draft.events.push({ type: 'shuffle' });
  }

  deal(draft);

  for (const { seat, hands } of draft.seats) {
    if (hands[0] && isBlackjack(hands[0].cards)) {
      finishHand(draft, { seat, hand: 0 }, 'blackjack');
    }
  }

  if (rules.holeCard === 'peek' && dealerHasBlackjack(draft.dealer.cards)) {
    revealHoleCard(draft);
    return success(settle(draft));
  }

  return success(continueRound(draft));
}

/**
 * Deals in casino order: one card to every seat, the dealer's up card, a
 * second card to every seat and, when peeking, the face-down hole card.
 * Without a hole card the dealer's second card follows after the players.
 */
function deal(draft: Draft): void {
  for (const { seat } of draft.seats) {
    dealToHand(draft, { seat, hand: 0 });
  }

  dealToDealer(draft);

  for (const { seat } of draft.seats) {
    dealToHand(draft, { seat, hand: 0 });
  }

  if (draft.rules.holeCard === 'peek') {
    dealToDealer(draft, true);
  }
}

/** The dealer only peeks when the up card could complete a blackjack. */
function dealerHasBlackjack(cards: readonly Card[]): boolean {
  const upCard = cards[0];

  if (!upCard || (upCard.rank !== 'A' && cardValue(upCard) !== 10)) {
    return false;
  }

  return isBlackjack(cards);
}

function validateBets(bets: readonly Bet[]): string | null {
  if (bets.length === 0) {
    return 'A round needs at least one bet';
  }

  const seats = new Set<number>();

  for (const { seat, stake } of bets) {
    if (!Number.isInteger(seat) || seat < 0) {
      return `Invalid seat ${seat}`;
    }

    if (!Number.isInteger(stake) || stake < 1) {
      return `Invalid stake ${stake} at seat ${seat}`;
    }

    if (seats.has(seat)) {
      return `More than one bet at seat ${seat}`;
    }

    seats.add(seat);
  }

  return null;
}
