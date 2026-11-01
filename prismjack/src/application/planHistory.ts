import type { SurfaceMap } from '../domain';
import type { PrismjackState } from './PrismjackState';

/** Undo / redo for the drawing only (laser tests are never undone). */
interface Drawing {
  readonly plan: SurfaceMap;
  readonly emptyCells: ReadonlySet<number>;
}

export interface PlanHistory {
  readonly past: readonly Drawing[];
  readonly future: readonly Drawing[];
}

export const EMPTY_HISTORY: PlanHistory = { past: [], future: [] };
const LIMIT = 200;

const drawingOf = (s: PrismjackState): Drawing => ({ plan: s.plan, emptyCells: s.emptyCells });
const sameDrawing = (a: PrismjackState, b: PrismjackState) => a.plan === b.plan && a.emptyCells === b.emptyCells;

/** Records `before` when an action changed the drawing. */
export function remember(history: PlanHistory, before: PrismjackState, after: PrismjackState): PlanHistory {
  if (sameDrawing(before, after)) return history;
  return { past: [...history.past, drawingOf(before)].slice(-LIMIT), future: [] };
}

export function undo(history: PlanHistory, state: PrismjackState): { history: PlanHistory; state: PrismjackState } {
  const previous = history.past.at(-1);
  if (!previous || state.status !== 'planning') return { history, state };
  return {
    history: { past: history.past.slice(0, -1), future: [drawingOf(state), ...history.future] },
    state: { ...state, ...previous, mismatches: [] },
  };
}

export function redo(history: PlanHistory, state: PrismjackState): { history: PlanHistory; state: PrismjackState } {
  const next = history.future[0];
  if (!next || state.status !== 'planning') return { history, state };
  return {
    history: { past: [...history.past, drawingOf(state)], future: history.future.slice(1) },
    state: { ...state, ...next, mismatches: [] },
  };
}
