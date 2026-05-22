import { isInteger } from '../../utils/type-utils';
import { ProjectPort } from '../port/data/ProjectPort';
import { ProjectFormatterPort } from '../port/format/ProjectFormatterPort';

export class ProjectService {
  private projectPort: ProjectPort;
  private projectFormatterPort: ProjectFormatterPort;

  constructor(projectPort: ProjectPort, projectFormatterPort: ProjectFormatterPort) {
    this.projectPort = projectPort;
    this.projectFormatterPort = projectFormatterPort;
  }

  async projects(parameter: string): Promise<string> {
    if (!parameter) {
      return this.projectFormatterPort.format(await this.projectPort.getProjects());
    }
    if (isInteger(parameter)) {
      return this.projectFormatterPort.format(await this.projectPort.getProjectsByYear(Number.parseInt(parameter)));
    }
    return this.projectFormatterPort.format(await this.projectPort.getProjectsBySkill(parameter));
  }
}
