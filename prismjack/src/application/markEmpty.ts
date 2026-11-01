import { cellAt, facetKey } from '../domain';
import type { PrismjackState } from './PrismjackState';

/** Marks (or unmarks) a cell as certainly empty. Marking it removes any facet drawn inside. */
export function markEmpty(state: PrismjackState, cell: number, empty: boolean): PrismjackState {
  if (state.status !== 'planning' || state.emptyCells.has(cell) === empty) return state;
  const emptyCells = new Set(state.emptyCells);
  if (!empty) {
    emptyCells.delete(cell);
    return { ...state, emptyCells, mismatches: [] };
  }
  emptyCells.add(cell);
  const { x, y } = cellAt(state.puzzle.board, cell);
  const plan = new Map(state.plan);
  plan.delete(facetKey(x, y));
  return { ...state, emptyCells, plan, mismatches: [] };
}
