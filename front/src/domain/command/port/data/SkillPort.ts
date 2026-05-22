import { Skill } from '../../model/Skill';

export interface SkillPort {
  getSkills(): Promise<Skill[]>;

  getSkillsByCategory(category: string): Promise<Skill[]>;
}
