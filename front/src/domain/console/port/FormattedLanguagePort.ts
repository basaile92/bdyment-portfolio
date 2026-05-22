export interface FormattedLanguagePort {
  getFormattedLanguages(parameter: string): Promise<string>;
}
