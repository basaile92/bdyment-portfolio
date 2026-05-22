import { Skill } from './Skill';

export interface Project {
  name: string;
  websites: string[];
  role: string;
  description: string;
  startYear: number;
  endYear: number;
  skills: Skill[];
}
