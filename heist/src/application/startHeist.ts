import { DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, HEIST_JEWELS, alarmThresholds, type BoardSize, type JewelSpec } from '../domain';
import type { RandomSource } from '../ports/RandomSource';
import type { HeistState } from './HeistState';

export interface StartHeistOptions {
  readonly board?: BoardSize;
  readonly jewels?: readonly JewelSpec[];
}

export function startHeist(random: RandomSource, options: StartHeistOptions = {}): HeistState {
  const board = options.board ?? DEFAULT_BOARD;
  const jewels = options.jewels ?? HEIST_JEWELS;
  const puzzle = generatePuzzle(board, jewels, () => random.next());
  return {
    puzzle,
    jewels,
    thresholds: alarmThresholds(board, puzzle.surfaces, jewels.length),
    shots: [],
    wrongPlans: 0,
    plan: EMPTY_SURFACES,
    emptyCells: new Set(),
    mismatches: [],
    status: 'planning',
  };
}
