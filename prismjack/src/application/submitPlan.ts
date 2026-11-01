import { mismatchingPorts, recognizedJewels, type PortId } from '../domain';
import { alarms, withAlarmChecked, type PrismjackState } from './PrismjackState';

export type SubmitResult =
  | { readonly kind: 'empty-plan'; readonly state: PrismjackState }
  | { readonly kind: 'alarm'; readonly state: PrismjackState; readonly mismatches: readonly PortId[] }
  | { readonly kind: 'caught'; readonly state: PrismjackState }
  | { readonly kind: 'success'; readonly state: PrismjackState; readonly alarms: number };

/** How many jewels of the prismjack are not yet drawn as closed shapes in the plan. */
export function missingJewels(state: PrismjackState): number {
  return recognizedJewels(state.puzzle.board, state.plan, state.jewels).filter((ok) => !ok).length;
}

export function submitPlan(state: PrismjackState): SubmitResult {
  if (state.status !== 'planning') return { kind: 'caught', state };
  if (state.plan.size === 0) return { kind: 'empty-plan', state };
  const { board, surfaces } = state.puzzle;
  const mismatches = mismatchingPorts(board, surfaces, state.plan);
  if (mismatches.length > 0) {
    const next = withAlarmChecked({ ...state, wrongPlans: state.wrongPlans + 1, mismatches });
    return next.status === 'caught' ? { kind: 'caught', state: next } : { kind: 'alarm', state: next, mismatches };
  }
  const won: PrismjackState = { ...state, status: 'success', mismatches: [] };
  return { kind: 'success', state: won, alarms: alarms(won) };
}
