import { Project } from '../../model/Project';

export interface ProjectPort {
  getProjects(): Promise<Project[]>;

  getProjectsBySkill(skillName: string): Promise<Project[]>;

  getProjectsByYear(year: number): Promise<Project[]>;
}
