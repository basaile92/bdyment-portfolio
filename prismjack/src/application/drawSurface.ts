import { isFacetKey, isValidKey, keyInsideCells, parseKey, pillarCells, cellIndex, type Surface, type SurfaceKey } from '../domain';
import type { PrismjackState } from './PrismjackState';

const sameSurface = (a: Surface | undefined, b: Surface) =>
  a !== undefined && a.color === b.color && a.orientation === b.orientation;

/**
 * Draws a surface on the plan. Drawing the exact same surface again erases it;
 * anything else at that place is replaced. A facet clears the "empty" mark of its cell.
 */
export function drawSurface(state: PrismjackState, key: SurfaceKey, surface: Surface): PrismjackState {
  if (state.status !== 'planning' || !isValidKey(state.puzzle.board, key)) return state;
  if (keyInsideCells(state.puzzle.board, key, pillarCells(state.puzzle.board, state.puzzle.pillars))) return state;
  const plan = new Map(state.plan);
  const emptyCells = new Set(state.emptyCells);
  if (sameSurface(plan.get(key), surface)) {
    plan.delete(key);
  } else {
    plan.set(key, surface);
    if (isFacetKey(key)) {
      const { x, y } = parseKey(key);
      emptyCells.delete(cellIndex(state.puzzle.board, x, y));
    }
  }
  return { ...state, plan, emptyCells, mismatches: [] };
}

/** Eraser: removes whatever is drawn at `key` (any colour) and the "empty" mark of `cell`. */
export function eraseAt(state: PrismjackState, key: SurfaceKey | null, cell: number | null): PrismjackState {
  if (state.status !== 'planning') return state;
  const hasKey = key !== null && state.plan.has(key);
  const hasMark = cell !== null && state.emptyCells.has(cell);
  if (!hasKey && !hasMark) return state;
  const plan = new Map(state.plan);
  const emptyCells = new Set(state.emptyCells);
  if (key !== null) plan.delete(key);
  if (cell !== null) emptyCells.delete(cell);
  return { ...state, plan, emptyCells, mismatches: [] };
}
