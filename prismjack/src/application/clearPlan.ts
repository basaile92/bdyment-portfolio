import { EMPTY_SURFACES } from '../domain';
import type { PrismjackState } from './PrismjackState';

/** Erases the drawing; the laser results are kept. */
export function clearPlan(state: PrismjackState): PrismjackState {
  if (state.status !== 'planning') return state;
  return { ...state, plan: EMPTY_SURFACES, emptyCells: new Set(), mismatches: [] };
}
