import { alarmFor, MAX_ALARM, type AlarmThresholds, type ColorMask, type JewelSpec, type PortId, type Puzzle, type SurfaceMap } from '../domain';

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
  readonly thresholds: AlarmThresholds;
  readonly shots: readonly Shot[];
  /** Plans submitted while wrong: each raises the alarm by one level. */
  readonly wrongPlans: number;
  /** The player's drawing. */
  readonly plan: SurfaceMap;
  /** Cells the player marked as empty (cell indices). */
  readonly emptyCells: ReadonlySet<number>;
  /** Ports that disagreed with the plan at the last wrong submission (cleared when the plan changes). */
  readonly mismatches: readonly PortId[];
  readonly status: HeistStatus;
}

/** Tests fired so far. */
export function testsUsed(state: HeistState): number {
  return state.shots.length;
}

/** Tests that light every sensor: the end of the gauge. */
export function testsLimit(state: HeistState): number {
  return state.thresholds.all;
}

/** Alarm level, 0 (perfect) to MAX_ALARM (the guard arrives). */
export function alarms(state: HeistState): number {
  return alarmFor(state.shots.length, state.thresholds, state.wrongPlans);
}

export function withAlarmChecked(state: HeistState): HeistState {
  return state.status === 'planning' && alarms(state) >= MAX_ALARM ? { ...state, status: 'caught' } : state;
}

/** The shot that lit a port, whether the port was its entry or its exit. */
export function shotAt(state: HeistState, port: PortId): Shot | undefined {
  return state.shots.find((s) => s.entry === port || s.exit === port);
}
