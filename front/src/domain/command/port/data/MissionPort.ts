import { Mission } from '../../model/Mission';

export interface MissionPort {
  getMissions(): Promise<Mission[]>;

  getMissionsBySkill(skillName: string): Promise<Mission[]>;

  getMissionsByYear(year: number): Promise<Mission[]>;
}
