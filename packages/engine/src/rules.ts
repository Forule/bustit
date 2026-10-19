/**
 * `peek`: the dealer checks for blackjack right after the deal when showing an
 * ace or a ten, so players only ever lose their original stake to it.
 * `none`: the dealer's second card is dealt after the players, and a dealer
 * blackjack also takes doubled and split stakes.
 */
export type HoleCardRule = 'peek' | 'none';

/**
 * The rules that can differ between tables or rounds. Rules without a
 * realistic variant are fixed in the code instead:
 *
 * - Any two cards can be doubled, split hands included.
 * - Two cards of the same value can be split, a king and a ten as well, up
 *   to `MAX_HANDS_PER_SEAT` hands.
 * - Split aces get one card each and can't be split again.
 * - A two-card 21 on a split hand is not a blackjack.
 * - There is no surrender and no insurance.
 * - Fractional blackjack wins are rounded down, see `payout`.
 */
export type TableRules = {
  readonly decks: number;
  /** Share of the shoe dealt before reshuffling, in `(0, 1]`. */
  readonly penetration: number;
  readonly dealerHitsSoft17: boolean;
  /** Ratio a blackjack pays, as `[numerator, denominator]`. */
  readonly blackjackPayout: readonly [number, number];
  readonly holeCard: HoleCardRule;
};

export const DEFAULT_RULES: TableRules = {
  decks: 6,
  penetration: 0.75,
  dealerHitsSoft17: false,
  blackjackPayout: [3, 2],
  holeCard: 'peek',
};

/** A seat can split up to three times. */
export const MAX_HANDS_PER_SEAT = 4;

export type Outcome = 'blackjack' | 'win' | 'push' | 'lose';

/**
 * Returns the amount handed back for a settled stake, the stake included.
 * Balances are whole chips, so a fractional blackjack win is rounded down.
 */
export function payout(
  outcome: Outcome,
  stake: number,
  rules: TableRules,
): number {
  if (!Number.isInteger(stake) || stake < 1) {
    throw new RangeError(`stake must be a positive integer, got ${stake}`);
  }

  switch (outcome) {
    case 'lose':
      return 0;
    case 'push':
      return stake;
    case 'win':
      return stake * 2;
    case 'blackjack': {
      const [numerator, denominator] = rules.blackjackPayout;
      return stake + Math.floor((stake * numerator) / denominator);
    }
  }
}
