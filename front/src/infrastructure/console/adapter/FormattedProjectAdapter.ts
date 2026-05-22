import { ProjectService } from '../../../domain/command/service/ProjectService';
import { FormattedProjectPort } from '../../../domain/console/port/FormattedProjectPort';

export class FormattedProjectAdapter implements FormattedProjectPort {
  private projectService: ProjectService;

  constructor(projectService: ProjectService) {
    this.projectService = projectService;
  }

  getFormattedProjects(parameter: string): Promise<string> {
    return this.projectService.projects(parameter);
  }
}
