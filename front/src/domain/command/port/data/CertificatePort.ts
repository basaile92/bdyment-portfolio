import { Certificate } from '../../model/Certificate';

export interface CertificatePort {
  getCertificates(): Promise<Certificate[]>;

  getCertificatesBySkill(skill: string): Promise<Certificate[]>;
}
