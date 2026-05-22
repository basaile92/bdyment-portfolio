import { Skill } from '../../../../domain/command/model/Skill';
import { SkillFormatterPort } from '../../../../domain/command/port/format/SkillFormatterPort';
import { separateByComma, separateByNewLine } from './separation-utils';

export class SkillFormatterAdapter implements SkillFormatterPort {
  formatByCategories(skills: Skill[]): string {
    return Array.from(this.groupByCategory(skills))
      .map((skillByCategory) => this.skillsByCategoryToString(skillByCategory))
      .reduce(separateByNewLine, '');
  }
  format(skills: Skill[]): string {
    if (skills.length === 0) return '';
    return skills.map((skill) => skill.name).reduce(separateByComma);
  }

  private groupByCategory(array: Skill[]): Map<string, string[]> {
    const result = new Map<string, string[]>();
    array.forEach((element) => {
      const listOfNamesForCategory = result.get(element.category) || [];
      listOfNamesForCategory.push(element.name);
      result.set(element.category, listOfNamesForCategory);
    });
    return result;
  }

  private skillsByCategoryToString(skillsByCategory: [string, string[]]) {
    return `<div><div class="subject">${skillsByCategory[0]}:</div>
               <div>${skillsByCategory[1].map(this.skillToString).reduce(separateByComma)}</div></div>`;
  }

  private skillToString(skill: string): string {
    return `<span class="parameter">${skill}</span>`;
  }
}
