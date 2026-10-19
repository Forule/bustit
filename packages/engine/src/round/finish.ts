import { evaluateHand, isBlackjack } from '../cards/index.js';
import { type Outcome, payout } from '../rules.js';
import { type Draft, advanceTurn, dealToDealer, toRound } from './draft.js';
import type { Hand, HandResult, RoundUpdate } from './types.js';

const DEALER_STANDS_ON = 17;

/**
 * Moves on to the next hand in play. Once no hand is left, the dealer plays
 * and the round is settled.
 */
export function continueRound(draft: Draft): RoundUpdate {
  advanceTurn(draft);

  if (draft.turn) {
    return { round: toRound(draft, null), events: draft.events };
  }

  playDealer(draft);

  return settle(draft);
}

export function revealHoleCard(draft: Draft): void {
  const holeCard = draft.dealer.cards[1];

  if (!draft.dealer.holeCardHidden || !holeCard) {
    return;
  }

  draft.dealer.holeCardHidden = false;
  draft.events.push({ type: 'holeCardRevealed', card: holeCard });
}

export function settle(draft: Draft): RoundUpdate {
  const dealer = evaluateHand(draft.dealer.cards);
  const dealerBlackjack = isBlackjack(draft.dealer.cards);

  const results: HandResult[] = draft.seats.flatMap(({ seat, hands }) =>
    hands.map((hand, index) => {
      const outcome = outcomeOf(
        hand,
        dealer.total,
        dealer.bust,
        dealerBlackjack,
      );

      return {
        seat,
        hand: index,
        outcome,
        stake: hand.stake,
        payout: payout(outcome, hand.stake, draft.rules),
      };
    }),
  );

  draft.turn = null;
  draft.events.push({ type: 'settled', results });

  return { round: toRound(draft, results), events: draft.events };
}

function playDealer(draft: Draft): void {
  if (draft.rules.holeCard === 'peek') {
    revealHoleCard(draft);
  } else {
    dealToDealer(draft);
  }

  // Without a hand left that could beat the dealer, drawing changes nothing.
  if (!draft.seats.some(({ hands }) => hands.some(isLive))) {
    return;
  }

  while (mustHit(draft)) {
    dealToDealer(draft);
  }
}

function isLive(hand: Hand): boolean {
  return hand.status !== 'bust' && hand.status !== 'blackjack';
}

function mustHit(draft: Draft): boolean {
  const { total, soft } = evaluateHand(draft.dealer.cards);

  return (
    total < DEALER_STANDS_ON ||
    (total === DEALER_STANDS_ON && soft && draft.rules.dealerHitsSoft17)
  );
}

function outcomeOf(
  hand: Hand,
  dealerTotal: number,
  dealerBust: boolean,
  dealerBlackjack: boolean,
): Outcome {
  if (hand.status === 'bust') {
    return 'lose';
  }

  if (hand.status === 'blackjack') {
    return dealerBlackjack ? 'push' : 'blackjack';
  }

  if (dealerBlackjack) {
    return 'lose';
  }

  if (dealerBust) {
    return 'win';
  }

  const total = evaluateHand(hand.cards).total;

  if (total > dealerTotal) {
    return 'win';
  }

  return total === dealerTotal ? 'push' : 'lose';
}
