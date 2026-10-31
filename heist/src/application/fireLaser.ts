import { traceLaser, type PortId } from '../domain';
import { shotAt, withAlarmChecked, type HeistState, type Shot } from './HeistState';

export interface FireLaserResult {
  readonly state: HeistState;
  readonly shot: Shot;
  /** False when the port was already lit: no new test, no alarm. */
  readonly isNew: boolean;
}

export function fireLaser(state: HeistState, port: PortId): FireLaserResult {
  const known = shotAt(state, port);
  if (known || state.status !== 'planning') {
    return { state, shot: known ?? { entry: port, exit: port, color: 0 }, isNew: false };
  }
  const { exit, color } = traceLaser(state.puzzle.board, state.puzzle.surfaces, port);
  const shot: Shot = { entry: port, exit, color };
  return { state: withAlarmChecked({ ...state, shots: [...state.shots, shot] }), shot, isNew: true };
}
