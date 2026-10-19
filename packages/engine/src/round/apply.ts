import { evaluateHand } from '../cards/index.js';
import {
  type Draft,
  dealToHand,
  finishHand,
  getHand,
  setHand,
  toDraft,
} from './draft.js';
import { continueRound } from './finish.js';
import {
  type HandRef,
  type PlayerAction,
  type Result,
  type RoundContext,
  type RoundState,
  type RoundUpdate,
  failure,
  success,
} from './types.js';

const BLACKJACK = 21;

/** Applies the action of the seat whose turn it is. */
export function applyAction(
  round: RoundState,
  action: PlayerAction,
  context: RoundContext,
): Result<RoundUpdate> {
  const { turn } = round;

  if (round.phase === 'settled' || !turn) {
    return failure('ROUND_FINISHED', 'The round is already settled');
  }

  if (action.seat !== turn.seat) {
    return failure(
      'NOT_YOUR_TURN',
      `Seat ${turn.seat} is to act, not seat ${action.seat}`,
    );
  }

  const draft = toDraft(round, context.rng);

  switch (action.type) {
    case 'hit':
      hit(draft, turn);
      break;
    case 'stand':
      finishHand(draft, turn, 'stood');
      break;
    case 'double':
      if (getHand(draft, turn).cards.length !== 2) {
        return failure(
          'ACTION_NOT_ALLOWED',
          'A hand can only be doubled on its first two cards',
        );
      }

      double(draft, turn);
      break;
  }

  return success(continueRound(draft));
}

/** Reaching 21 stands automatically, since no further card can help. */
function hit(draft: Draft, ref: HandRef): void {
  const { total, bust } = evaluateHand(dealToHand(draft, ref).cards);

  if (bust) {
    finishHand(draft, ref, 'bust');
  } else if (total === BLACKJACK) {
    finishHand(draft, ref, 'stood');
  }
}

/** Doubles the stake for exactly one more card. */
function double(draft: Draft, ref: HandRef): void {
  const hand = getHand(draft, ref);
  const stake = hand.stake * 2;

  setHand(draft, ref, { ...hand, stake, doubled: true });
  draft.events.push({ type: 'double', ...ref, stake });

  const { bust } = evaluateHand(dealToHand(draft, ref).cards);

  finishHand(draft, ref, bust ? 'bust' : 'stood');
}
