/**
 * Source of randomness for everything the engine shuffles. Injected rather
 * than taken from `Math.random`, so a seeded generator makes shuffles
 * reproducible in tests and replays.
 */
export interface Rng {
  /** Returns a uniformly distributed integer in `[0, maxExclusive)`. */
  nextInt(maxExclusive: number): number;
}

const UINT32_RANGE = 2 ** 32;

/*
 * Discarding the first outputs lets sfc32 mix its state, since nearby seeds
 * would otherwise produce correlated first values.
 */
const WARM_UP_ROUNDS = 15;

/**
 * Creates a deterministic generator: the same seed always yields the same
 * sequence. Not cryptographically secure, so the seed has to stay secret for
 * as long as its sequence is in use.
 */
export function createSeededRng(seed: string): Rng {
  const next = sfc32(...cyrb128(seed));

  for (let i = 0; i < WARM_UP_ROUNDS; i++) {
    next();
  }

  return {
    nextInt(maxExclusive) {
      if (
        !Number.isInteger(maxExclusive) ||
        maxExclusive < 1 ||
        maxExclusive > UINT32_RANGE
      ) {
        throw new RangeError(
          `maxExclusive must be an integer in [1, 2^32], got ${maxExclusive}`,
        );
      }

      /*
       * A plain modulo would favour small results whenever maxExclusive does
       * not divide 2^32. Drawing again above the largest multiple of
       * maxExclusive keeps every result equally likely.
       */
      const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
      let value = next();

      while (value >= limit) {
        value = next();
      }

      return value % maxExclusive;
    },
  };
}

/** Hashes a string into the 128 bits of state sfc32 needs. */
function cyrb128(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;

  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Small fast counter generator, returns unsigned 32-bit integers. */
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return t >>> 0;
  };
}
