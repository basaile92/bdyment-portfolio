import { Skill } from './Skill';

export interface Mission {
  company: string;
  websites: string[];
  role: string;
  place: string;
  description: string;
  startYear: number;
  endYear: number;
  skills: Skill[];
}
