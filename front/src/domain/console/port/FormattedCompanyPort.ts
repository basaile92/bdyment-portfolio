export interface FormattedCompanyPort {
  getFormattedCompanies(parameter: string): Promise<string>;
}
