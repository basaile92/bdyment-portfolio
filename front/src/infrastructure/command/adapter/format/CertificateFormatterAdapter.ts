import { Certificate } from '../../../../domain/command/model/Certificate';
import { CertificateFormatterPort } from '../../../../domain/command/port/format/CertificateFormatterPort';
import { separateByNewLine } from './separation-utils';

export class CertificateFormatterAdapter implements CertificateFormatterPort {
  format(certificates: Certificate[]): string {
    return certificates.map(this.certificatesToString).reduce(separateByNewLine, '');
  }

  private certificatesToString(certificate: Certificate): string {
    return `<div><div>
            <span class="title">${certificate.skill} </span>
            <span class="subject">certification by ${certificate.certifier}</span>
          </div>
          <div class="italic">${certificate.year}</div>
          <a class="link" target="_blank" href="${certificate.link}">${certificate.link}</a>
          </div>`;
  }
}
