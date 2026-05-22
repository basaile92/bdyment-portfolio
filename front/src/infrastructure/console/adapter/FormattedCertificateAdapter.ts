import { FormattedCertificatePort } from '../../../domain/console/port/FormattedCertificatePort';
import { CertificateService } from '../../../domain/command/service/CertificateService';

export class FormattedCertificateAdapter implements FormattedCertificatePort {
  private certificateService: CertificateService;

  constructor(certificateService: CertificateService) {
    this.certificateService = certificateService;
  }

  getFormattedCertificates(parameter: string): Promise<string> {
    return this.certificateService.certificates(parameter);
  }
}
