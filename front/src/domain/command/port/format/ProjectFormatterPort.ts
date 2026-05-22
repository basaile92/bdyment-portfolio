import { Project } from '../../model/Project';

export interface ProjectFormatterPort {
  format(projects: Project[]): string;
}
