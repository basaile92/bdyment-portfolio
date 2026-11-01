import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, PRISMJACK_JEWELS, mismatchingPorts, planMatches, alarmFor,
  alarmThresholds,
} from '../../src/domain';
import { seeded } from '../helpers';

const puzzle = generatePuzzle(DEFAULT_BOARD, PRISMJACK_JEWELS, seeded(7));

describe('plan validation', () => {
  it('accepts the real layout', () => expect(planMatches(DEFAULT_BOARD, puzzle.surfaces, puzzle.surfaces)).toBe(true));

  it('rejects an empty plan', () => {
    expect(mismatchingPorts(DEFAULT_BOARD, puzzle.surfaces, EMPTY_SURFACES).length).toBeGreaterThan(0);
  });
});

describe('alarm level', () => {
  const t = alarmThresholds(DEFAULT_BOARD, puzzle.surfaces, 5);

  it('stays quiet for fewer tests than it takes to light every sensor', () => expect(t.quiet).toBeLessThan(t.all));

  it('goes up one level past the quiet limit, and one per wrong plan, up to 3', () => {
    expect(alarmFor(t.quiet, t, 0)).toBe(0);
    expect(alarmFor(t.quiet + 1, t, 0)).toBe(1);
    expect(alarmFor(t.quiet, t, 2)).toBe(2);
    expect(alarmFor(t.quiet + 1, t, 2)).toBe(3);
    expect(alarmFor(t.all, t, 3)).toBe(3);
  });
});
