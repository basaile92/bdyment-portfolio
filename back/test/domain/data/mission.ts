import { Mission } from '../../../src/domain/model/model';
import { SKILL_0, SKILL_1, SKILL_2, SKILL_3, SKILL_4, SKILL_5, SKILL_6, SKILL_7 } from './skill';

export const MISSION_1: Mission = {
  company: 'company1',
  websites: ['website00', 'website01', 'website02'],
  place: 'place1',
  role: 'role1',
  description: 'description1',
  startYear: 2023,
  endYear: 2024,
  skills: [SKILL_0, SKILL_1, SKILL_2],
};
export const MISSION_2: Mission = {
  company: 'company2',
  websites: ['website10', 'website11', 'website12'],
  place: 'place2',
  role: 'role2',
  description: 'description2',
  startYear: 2020,
  endYear: 2023,
  skills: [SKILL_0, SKILL_3, SKILL_4],
};
export const MISSION_3: Mission = {
  company: 'company3',
  websites: ['website20', 'website21', 'website22'],
  place: 'place3',
  role: 'role3',
  description: 'description3',
  startYear: 2015,
  endYear: 2020,
  skills: [SKILL_5, SKILL_6, SKILL_7],
};
export const MISSIONS: Mission[] = [MISSION_1, MISSION_2, MISSION_3];
