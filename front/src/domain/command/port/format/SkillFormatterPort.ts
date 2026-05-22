import { Skill } from '../../model/Skill';

export interface SkillFormatterPort {
  formatByCategories(skills: Skill[]): string;
  format(skills: Skill[]): string;
}
