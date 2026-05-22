export interface FormattedStudyPort {
  getFormattedStudies(parameter: string): Promise<string>;
}
