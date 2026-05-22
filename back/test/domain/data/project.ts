import { Project } from '../../../src/domain/model/model';
import { SKILL_0, SKILL_1, SKILL_2, SKILL_3, SKILL_4, SKILL_5, SKILL_6, SKILL_7 } from './skill';

export const PROJECT_1: Project = {
  name: 'name1',
  websites: ['website00', 'website01', 'website02'],
  role: 'role1',
  description: 'description1',
  startYear: 2023,
  endYear: 2024,
  skills: [SKILL_0, SKILL_1, SKILL_2],
};
export const PROJECT_2: Project = {
  name: 'name2',
  websites: ['website10', 'website11', 'website12'],
  role: 'role2',
  description: 'description2',
  startYear: 2020,
  endYear: 2023,
  skills: [SKILL_0, SKILL_3, SKILL_4],
};
export const PROJECT_3: Project = {
  name: 'name3',
  websites: ['website20', 'website21', 'website22'],
  role: 'role3',
  description: 'description3',
  startYear: 2015,
  endYear: 2020,
  skills: [SKILL_5, SKILL_6, SKILL_7],
};
export const PROJECTS: Project[] = [PROJECT_1, PROJECT_2, PROJECT_3];
