import { Project } from '../../../../domain/command/model/Project';
import { ProjectFormatterPort } from '../../../../domain/command/port/format/ProjectFormatterPort';
import { separateByComma, separateByNewLine } from './separation-utils';
import { displayDatesAndPlace, keepNewLine } from './value-utils';
import { Skill } from '../../../../domain/command/model/Skill';

export class ProjectFormatterAdapter implements ProjectFormatterPort {
  format(projects: Project[]): string {
    return projects.map((project) => this.projectToString(project)).reduce(separateByNewLine, '');
  }

  private projectToString(project: Project): string {
    return `<div><div>
            <span class="title">${project.name}</span>
            <span class="subject">${project.role}</span>
          </div>
          <div>
          ${
            project.websites && project.websites.length > 0
              ? project.websites
                  .map(
                    (website) => `<a class="link" target="_blank" href="${website}">
            ${website}
          </a>`,
                  )
                  .reduce(separateByNewLine)
              : ''
          }
          </div>
          ${displayDatesAndPlace(project.startYear, project.endYear)}
          <br/><div>${keepNewLine(project.description)} </div>
          <br/>
           ${project.skills.length > 0 ? `<div class="italic">${project.skills.map(this.skillToString).reduce(separateByComma)}</div>` : ''}
          </div>`;
  }

  private skillToString(skill: Skill): string {
    return `${skill.name}`;
  }
}
