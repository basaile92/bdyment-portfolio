export interface FormattedHelpPort {
  getFormattedHelp(parameter: string): Promise<string>;
}
