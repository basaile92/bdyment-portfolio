import { EMPTY_SURFACES } from '../domain';
import type { HeistState } from './HeistState';

/** Erases the drawing; the laser results are kept. */
export function clearPlan(state: HeistState): HeistState {
  if (state.status !== 'planning') return state;
  return { ...state, plan: EMPTY_SURFACES, emptyCells: new Set(), mismatches: [] };
}
