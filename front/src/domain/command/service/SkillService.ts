import { SkillPort } from '../port/data/SkillPort';
import { SkillFormatterPort } from '../port/format/SkillFormatterPort';

export class SkillService {
  private skillPort: SkillPort;
  private skillFormatterPort: SkillFormatterPort;

  constructor(skillPort: SkillPort, skillFormatterPort: SkillFormatterPort) {
    this.skillPort = skillPort;
    this.skillFormatterPort = skillFormatterPort;
  }

  async skills(parameter: string): Promise<string> {
    if (!parameter) {
      return this.skillFormatterPort.formatByCategories(await this.skillPort.getSkills());
    }
    return this.skillFormatterPort.format(await this.skillPort.getSkillsByCategory(parameter));
  }
}
