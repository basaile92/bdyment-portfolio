import {
  DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, PRISMJACK_JEWELS, alarmThresholds, quietTests, roomPuzzle, storedSpecs,
  type BoardSize, type JewelSpec, type Puzzle,
} from '../domain';
import type { RandomSource } from '../ports/RandomSource';
import { roomFor, type PrismjackMode, type RoomPick } from './modes';
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
  return startRoom(roomFor(mode, random.next()));
}

/** A given stored room, seen in a given mirror image; `quietRatio` makes the alarm stricter (late in a run). */
export function startRoom({ room, variant }: RoomPick, quietRatio?: number): PrismjackState {
  const state = fromPuzzle(roomPuzzle(room, variant), storedSpecs(room));
  if (quietRatio === undefined) return state;
  return { ...state, thresholds: { ...state.thresholds, quiet: quietTests(state.thresholds.all, state.jewels.length, quietRatio) } };
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
