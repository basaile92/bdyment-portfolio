import { Mission } from '../../model/Mission';

export interface MissionFormatterPort {
  format(missions: Mission[]): string;
}
