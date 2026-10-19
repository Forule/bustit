import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../src/rng.js';

function sample(seed: string, count: number, maxExclusive: number): number[] {
  const rng = createSeededRng(seed);
  return Array.from({ length: count }, () => rng.nextInt(maxExclusive));
}

describe('createSeededRng', () => {
  it('produces the same sequence for the same seed', () => {
    expect(sample('seed', 100, 1000)).toEqual(sample('seed', 100, 1000));
  });

  it('produces different sequences for different seeds', () => {
    expect(sample('seed-a', 100, 1000)).not.toEqual(
      sample('seed-b', 100, 1000),
    );
  });

  it('stays within [0, maxExclusive)', () => {
    const values = sample('range', 10_000, 7);

    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(6);
    expect(values.every(Number.isInteger)).toBe(true);
  });

  it('spreads values evenly', () => {
    const buckets = 10;
    const draws = 100_000;
    const counts = new Array<number>(buckets).fill(0);

    for (const value of sample('distribution', draws, buckets)) {
      counts[value]!++;
    }

    // Generous bound: a fair generator stays well within 5 % of the mean.
    const expected = draws / buckets;
    for (const count of counts) {
      expect(Math.abs(count - expected)).toBeLessThan(expected * 0.05);
    }
  });

  it.each([0, -1, 1.5, Number.NaN, 2 ** 32 + 1])(
    'rejects maxExclusive %s',
    (maxExclusive) => {
      expect(() => createSeededRng('x').nextInt(maxExclusive)).toThrow(
        RangeError,
      );
    },
  );
});
