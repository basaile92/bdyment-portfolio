import { isFacetKey, isValidKey, parseKey, cellIndex, type Surface, type SurfaceKey } from '../domain';
import type { HeistState } from './HeistState';

const sameSurface = (a: Surface | undefined, b: Surface) =>
  a !== undefined && a.color === b.color && a.orientation === b.orientation;

/**
 * Draws a surface on the plan. Drawing the exact same surface again erases it;
 * anything else at that place is replaced. A facet clears the "empty" mark of its cell.
 */
export function drawSurface(state: HeistState, key: SurfaceKey, surface: Surface): HeistState {
  if (state.status !== 'planning' || !isValidKey(state.puzzle.board, key)) return state;
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
