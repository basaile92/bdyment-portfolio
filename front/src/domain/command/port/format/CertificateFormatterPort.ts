import { Certificate } from '../../model/Certificate';

export interface CertificateFormatterPort {
  format(certificates: Certificate[]): string;
}
