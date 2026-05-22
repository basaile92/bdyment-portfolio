import { CertificatePort } from '../port/data/CertificatePort';
import { CertificateFormatterPort } from '../port/format/CertificateFormatterPort';

export class CertificateService {
  private certificatePort: CertificatePort;
  private certificateFormatterPort: CertificateFormatterPort;

  constructor(certificatePort: CertificatePort, certificateFormatterPort: CertificateFormatterPort) {
    this.certificatePort = certificatePort;
    this.certificateFormatterPort = certificateFormatterPort;
  }

  async certificates(parameter: string): Promise<string> {
    if (!parameter) {
      return this.certificateFormatterPort.format(await this.certificatePort.getCertificates());
    }
    return this.certificateFormatterPort.format(await this.certificatePort.getCertificatesBySkill(parameter));
  }
}
