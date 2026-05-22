export interface FormattedProjectPort {
  getFormattedProjects(parameter: string): Promise<string>;
}
