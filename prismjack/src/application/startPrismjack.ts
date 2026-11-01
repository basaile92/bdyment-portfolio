import { DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, PRISMJACK_JEWELS, alarmThresholds, type BoardSize, type JewelSpec } from '../domain';
import type { RandomSource } from '../ports/RandomSource';
import type { PrismjackState } from './PrismjackState';

export interface StartPrismjackOptions {
  readonly board?: BoardSize;
  readonly jewels?: readonly JewelSpec[];
}

export function startPrismjack(random: RandomSource, options: StartPrismjackOptions = {}): PrismjackState {
  const board = options.board ?? DEFAULT_BOARD;
  const jewels = options.jewels ?? PRISMJACK_JEWELS;
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
