import { traceLaser, type PortId } from '../domain';
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
  const { exit, color } = traceLaser(state.puzzle.board, state.puzzle.surfaces, port);
  const shot: Shot = { entry: port, exit, color };
  return { state: withAlarmChecked({ ...state, shots: [...state.shots, shot] }), shot, isNew: true };
}
