export interface FormattedCertificatePort {
  getFormattedCertificates(parameter: string): Promise<string>;
}
