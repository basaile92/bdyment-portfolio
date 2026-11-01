import { ABSORBED, advanceStates, sceneOf, traceLaser, type PortId } from '../domain';
import { shotAt, withAlarmChecked, type PrismjackState, type Shot } from './PrismjackState';

export interface FireLaserResult {
  readonly state: PrismjackState;
  readonly shot: Shot;
  /** False when the port was already lit: no new test, no alarm. */
  readonly isNew: boolean;
}

export function fireLaser(state: PrismjackState, port: PortId): FireLaserResult {
  const known = shotAt(state, port);
  if (known || state.status !== 'planning') {
    return { state, shot: known ?? { entry: port, exit: port, color: 0 }, isNew: false };
  }
  const { board, surfaces, pillars } = state.puzzle;
  const scene = sceneOf(board, pillars, state.pillarStates);
  const result = traceLaser(board, surfaces, port, scene);
  // Swallowed light shows nothing, not even the colours it had picked up.
  const shot: Shot = { entry: port, exit: result.exit, color: result.exit === ABSORBED ? 0 : result.color };
  const pillarStates = pillars?.length ? advanceStates(scene, result.pillarsTouched) : state.pillarStates;
  return { state: withAlarmChecked({ ...state, shots: [...state.shots, shot], pillarStates }), shot, isNew: true };
}
