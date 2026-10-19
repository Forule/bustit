import {
  type Card,
  type Shoe,
  cardsRemaining,
  createShoe,
  draw,
} from '../cards/index.js';
import { evaluateHand } from '../cards/index.js';
import type { Rng } from '../rng.js';
import type { TableRules } from '../rules.js';
import type {
  FinishedHandStatus,
  Hand,
  HandRef,
  HandResult,
  RoundEvent,
  RoundState,
} from './types.js';

const BLACKJACK = 21;

/**
 * Mutable working copy of a round. An engine call copies the round into a
 * draft, changes it step by step while recording events, and turns it back
 * into a new round at the end. Callers only ever see immutable rounds, while
 * the rules read as a sequence of steps instead of nested object spreads.
 */
export type Draft = {
  readonly rules: TableRules;
  readonly rng: Rng;
  shoe: Shoe;
  seats: { readonly seat: number; hands: Hand[] }[];
  dealer: { cards: Card[]; holeCardHidden: boolean };
  turn: HandRef | null;
  readonly events: RoundEvent[];
};

export function toDraft(round: RoundState, rng: Rng): Draft {
  return {
    rules: round.rules,
    rng,
    shoe: round.shoe,
    seats: round.seats.map(({ seat, hands }) => ({ seat, hands: [...hands] })),
    dealer: {
      cards: [...round.dealer.cards],
      holeCardHidden: round.dealer.holeCardHidden,
    },
    turn: round.turn,
    events: [],
  };
}

/** Passing results settles the round, without them it is still in play. */
export function toRound(
  draft: Draft,
  results: readonly HandResult[] | null,
): RoundState {
  return {
    phase: results ? 'settled' : 'playerTurns',
    rules: draft.rules,
    shoe: draft.shoe,
    seats: draft.seats,
    dealer: draft.dealer,
    turn: draft.turn,
    results: results ?? [],
  };
}

export function getHand(draft: Draft, ref: HandRef): Hand {
  const hand = draft.seats.find(({ seat }) => seat === ref.seat)?.hands[
    ref.hand
  ];

  if (!hand) {
    throw new Error(`No hand ${ref.hand} at seat ${ref.seat}`);
  }

  return hand;
}

export function handsAtSeat(draft: Draft, seat: number): number {
  return draft.seats.find((entry) => entry.seat === seat)?.hands.length ?? 0;
}

/** Appends a hand to a seat, `ref.hand` has to be the next free index. */
export function addHand(draft: Draft, ref: HandRef, hand: Hand): void {
  const seat = draft.seats.find(({ seat }) => seat === ref.seat);

  if (!seat || seat.hands.length !== ref.hand) {
    throw new Error(`Can't add hand ${ref.hand} at seat ${ref.seat}`);
  }

  seat.hands.push(hand);
}

export function setHand(draft: Draft, ref: HandRef, hand: Hand): void {
  const seat = draft.seats.find(({ seat }) => seat === ref.seat);

  if (!seat?.hands[ref.hand]) {
    throw new Error(`No hand ${ref.hand} at seat ${ref.seat}`);
  }

  seat.hands[ref.hand] = hand;
}

/**
 * The shoe is only checked for a reshuffle between rounds. Running out in the
 * middle of one is rare enough at the usual penetration that starting a fresh
 * shoe, instead of reshuffling the discards, is good enough.
 */
export function drawCard(draft: Draft): Card {
  if (cardsRemaining(draft.shoe) === 0) {
    draft.shoe = createShoe(draft.rules, draft.rng);
    draft.events.push({ type: 'shuffle' });
  }

  const { card, shoe } = draw(draft.shoe);
  draft.shoe = shoe;

  return card;
}

export function dealToHand(draft: Draft, ref: HandRef): Hand {
  const card = drawCard(draft);
  const hand = getHand(draft, ref);
  const updated = { ...hand, cards: [...hand.cards, card] };

  setHand(draft, ref, updated);
  draft.events.push({ type: 'playerCard', ...ref, card });

  return updated;
}

/** Deals one card; reaching 21 stands automatically, since no card can help. */
export function hitHand(draft: Draft, ref: HandRef): void {
  const { total, bust } = evaluateHand(dealToHand(draft, ref).cards);

  if (bust) {
    finishHand(draft, ref, 'bust');
  } else if (total === BLACKJACK) {
    finishHand(draft, ref, 'stood');
  }
}

export function dealToDealer(draft: Draft, faceDown = false): void {
  const card = drawCard(draft);

  draft.dealer.cards.push(card);

  if (faceDown) {
    draft.dealer.holeCardHidden = true;
    draft.events.push({ type: 'holeCard' });
  } else {
    draft.events.push({ type: 'dealerCard', card });
  }
}

export function finishHand(
  draft: Draft,
  ref: HandRef,
  status: FinishedHandStatus,
): void {
  setHand(draft, ref, { ...getHand(draft, ref), status });
  draft.events.push({ type: 'handFinished', ...ref, status });
}

/**
 * Hands are played in seat order and, within a seat, left to right, so the
 * next hand to act is always the first one still in play.
 */
export function advanceTurn(draft: Draft): void {
  const next = draft.seats
    .flatMap(({ seat, hands }) =>
      hands.map((hand, index) => ({ seat, hand: index, status: hand.status })),
    )
    .find(({ status }) => status === 'playing');

  if (!next) {
    draft.turn = null;
    return;
  }

  if (draft.turn?.seat === next.seat && draft.turn.hand === next.hand) {
    return;
  }

  draft.turn = { seat: next.seat, hand: next.hand };
  draft.events.push({ type: 'turn', ...draft.turn });
}
