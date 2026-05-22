import { FormattedSkillPort } from '../../../domain/console/port/FormattedSkillPort';
import { SkillService } from '../../../domain/command/service/SkillService';

export class FormattedSkillAdapter implements FormattedSkillPort {
  private skillService: SkillService;

  constructor(skillService: SkillService) {
    this.skillService = skillService;
  }

  getFormattedSkills(parameter: string): Promise<string> {
    return this.skillService.skills(parameter);
  }
}
