import {
  DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, PRISMJACK_JEWELS, alarmThresholds, roomPuzzle, storedSpecs,
  type BoardSize, type JewelSpec, type Puzzle,
} from '../domain';
import type { RandomSource } from '../ports/RandomSource';
import { roomFor, type PrismjackMode } from './modes';
import type { PrismjackState } from './PrismjackState';

export interface StartPrismjackOptions {
  readonly board?: BoardSize;
  readonly jewels?: readonly JewelSpec[];
}

/** A freshly generated room (not checked for a single solution: tests and tools only). */
export function startPrismjack(random: RandomSource, options: StartPrismjackOptions = {}): PrismjackState {
  const board = options.board ?? DEFAULT_BOARD;
  const jewels = options.jewels ?? PRISMJACK_JEWELS;
  return fromPuzzle(generatePuzzle(board, jewels, () => random.next()), jewels);
}

/** The room a mode plays: a campaign level, today's heist, or a room of the run's current tier. */
export function startMode(mode: PrismjackMode, random: RandomSource): PrismjackState {
  const { room, variant } = roomFor(mode, random.next());
  return fromPuzzle(roomPuzzle(room, variant), storedSpecs(room));
}

function fromPuzzle(puzzle: Puzzle, jewels: readonly JewelSpec[]): PrismjackState {
  const { board } = puzzle;
  return {
    puzzle,
    jewels,
    thresholds: alarmThresholds(board, puzzle.surfaces, jewels.length, puzzle.pillars),
    shots: [],
    wrongPlans: 0,
    plan: EMPTY_SURFACES,
    emptyCells: new Set(),
    mismatches: [],
    pillarStates: (puzzle.pillars ?? []).map(() => 0),
    status: 'planning',
  };
}
