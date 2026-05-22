export interface FormattedDescriptionPort {
  getFormattedDescription(parameter: string): Promise<string>;
}
