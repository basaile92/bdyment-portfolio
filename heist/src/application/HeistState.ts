import { MAX_WRONG_PLANS, type ColorMask, type JewelSpec, type PortId, type Puzzle, type StarThresholds, type SurfaceMap } from '../domain';

export interface Shot {
  readonly entry: PortId;
  readonly exit: PortId;
  readonly color: ColorMask;
}

/** planning → success (plan accepted) or caught (the alarm went over the limit). */
export type HeistStatus = 'planning' | 'success' | 'caught';

/** Everything that describes a heist in progress. Immutable: use cases return a new state. */
export interface HeistState {
  readonly puzzle: Puzzle;
  readonly jewels: readonly JewelSpec[];
  readonly thresholds: StarThresholds;
  readonly shots: readonly Shot[];
  /** Plans submitted while wrong: each costs a star, MAX_WRONG_PLANS of them get the thief caught. */
  readonly wrongPlans: number;
  /** The player's drawing. */
  readonly plan: SurfaceMap;
  /** Cells the player marked as empty (cell indices). */
  readonly emptyCells: ReadonlySet<number>;
  /** Ports that disagreed with the plan at the last wrong submission (cleared when the plan changes). */
  readonly mismatches: readonly PortId[];
  readonly status: HeistStatus;
}

export function alarmLevel(state: HeistState): number {
  return state.shots.length;
}

/** Past this level the guard arrives and the heist fails. */
export function alarmLimit(state: HeistState): number {
  return state.thresholds.twoStars;
}

/** Why the guard showed up, if he did. */
export function caughtBy(state: HeistState): 'alarm' | 'wrong-plans' | null {
  if (state.wrongPlans >= MAX_WRONG_PLANS) return 'wrong-plans';
  return alarmLevel(state) > alarmLimit(state) ? 'alarm' : null;
}

export function withAlarmChecked(state: HeistState): HeistState {
  return state.status === 'planning' && caughtBy(state) !== null ? { ...state, status: 'caught' } : state;
}

/** The shot that lit a port, whether the port was its entry or its exit. */
export function shotAt(state: HeistState, port: PortId): Shot | undefined {
  return state.shots.find((s) => s.entry === port || s.exit === port);
}
