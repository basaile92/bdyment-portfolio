export interface FormattedSkillPort {
  getFormattedSkills(parameter: string): Promise<string>;
}
