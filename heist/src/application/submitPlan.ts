import { mismatchingPorts, recognizedJewels, type PortId } from '../domain';
import { alarms, withAlarmChecked, type HeistState } from './HeistState';

export type SubmitResult =
  | { readonly kind: 'empty-plan'; readonly state: HeistState }
  | { readonly kind: 'alarm'; readonly state: HeistState; readonly mismatches: readonly PortId[] }
  | { readonly kind: 'caught'; readonly state: HeistState }
  | { readonly kind: 'success'; readonly state: HeistState; readonly alarms: number };

/** How many jewels of the heist are not yet drawn as closed shapes in the plan. */
export function missingJewels(state: HeistState): number {
  return recognizedJewels(state.puzzle.board, state.plan, state.jewels).filter((ok) => !ok).length;
}

export function submitPlan(state: HeistState): SubmitResult {
  if (state.status !== 'planning') return { kind: 'caught', state };
  if (state.plan.size === 0) return { kind: 'empty-plan', state };
  const { board, surfaces } = state.puzzle;
  const mismatches = mismatchingPorts(board, surfaces, state.plan);
  if (mismatches.length > 0) {
    const next = withAlarmChecked({ ...state, wrongPlans: state.wrongPlans + 1, mismatches });
    return next.status === 'caught' ? { kind: 'caught', state: next } : { kind: 'alarm', state: next, mismatches };
  }
  const won: HeistState = { ...state, status: 'success', mismatches: [] };
  return { kind: 'success', state: won, alarms: alarms(won) };
}
