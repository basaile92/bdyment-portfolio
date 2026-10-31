import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, HEIST_JEWELS, mismatchingPorts, planMatches, starsFor,
  starThresholds,
} from '../../src/domain';
import { seeded } from '../helpers';

const puzzle = generatePuzzle(DEFAULT_BOARD, HEIST_JEWELS, seeded(7));

describe('plan validation', () => {
  it('accepts the real layout', () => expect(planMatches(DEFAULT_BOARD, puzzle.surfaces, puzzle.surfaces)).toBe(true));

  it('rejects an empty plan', () => {
    expect(mismatchingPorts(DEFAULT_BOARD, puzzle.surfaces, EMPTY_SURFACES).length).toBeGreaterThan(0);
  });
});

describe('stars', () => {
  const t = starThresholds(DEFAULT_BOARD, puzzle.surfaces, 5);

  it('needs fewer shots for 3 stars than for 2', () => expect(t.threeStars).toBeLessThan(t.twoStars));

  it('grades by shots', () => {
    expect(starsFor(t.threeStars, t)).toBe(3);
    expect(starsFor(t.threeStars + 1, t)).toBe(2);
    expect(starsFor(t.twoStars + 1, t)).toBe(1);
  });
});
